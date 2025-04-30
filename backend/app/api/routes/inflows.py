import json
import pprint
import re
from decimal import Decimal
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select
from sqlalchemy.sql import expression
from sqlalchemy import desc, or_, and_
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, SessionDep
from app.cf_models.schemas import CommandFunds, Message, Balances, ActivityLog, SubHeads, Heads, Users
from app.cf_models.inflows import InflowsPublic, InflowUpdate, InflowPublic, InflowCreate
from app.cf_models.utils import log_activity
from app.utils import get_pakistan_timestamp

router = APIRouter(prefix="/inflows", tags=["inflows"])


def parse_search_query(search: str, is_superuser: bool) -> dict:
    """Parses a search string intelligently into different filters, including head:, subhead:, and pay_to:."""
    filters = {
        "payment_method": None,
        "date": None,
        "amount_range": None,
        "h": None,
        "sh": None,
        "from": None,
        "general": [],
    }

    # Define recognized prefixes
    known_prefixes = ["h:", "sh:", "from:"]

    words = search.split()
    i = 0

    while i < len(words):
        word = words[i]

        if re.match(r"^\d{1,2}/\d{1,2}$", word):  # Matches MM/DD format
            filters["date"] = word.replace("/", "-")  # Store in consistent MM-DD format
        elif re.match(r"^\d+-\d+$", word):  # Matches amount range (e.g., "1000-5000")
            filters["amount_range"] = tuple(map(Decimal, word.split("-")))
        elif word.lower() in ["bank", "cash"]:  # Payment methods
            filters["payment_method"] = word.lower()
        elif any(word.lower().startswith(prefix) for prefix in known_prefixes):  # Handle dynamic key-value pairs
            for prefix in known_prefixes:
                if word.lower().startswith(prefix):
                    key = prefix.replace(":", "")  # Extract key name (e.g., "head", "subhead", "pay_to")
                    value = " ".join(words[i:]).split(";")[0].replace(prefix, "").strip()
                    filters[key] = value  # Store extracted value

                    # Skip words until the semicolon is found
                    while i < len(words) and ";" not in words[i]:
                        i += 1
        elif len(word) > 2:  # Assume longer words might be general search terms
            filters["general"].append(word.strip())

        i += 1

    # Superusers can search by username, regular users can't
    if is_superuser and filters["general"]:
        filters["username"] = filters["general"].pop(0)  # First word assumed to be username

    return filters


@router.get("/", response_model=InflowsPublic)
def read_inflows(
        session: SessionDep,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 100,
        search: str = "",
        user_id: int | None = None,
) -> Any:
    """
    Retrieve inflow items with optional search, amount range filtering, and pagination.
    """

    # Base query setup
    base_query = select(CommandFunds).options(
        joinedload(CommandFunds.head),
        joinedload(CommandFunds.sub_heads),
        joinedload(CommandFunds.user)
    ).order_by(CommandFunds.date.desc())

    # Apply user restrictions (Admins see all, regular users see only their own)
    if not current_user.is_superuser:
        base_query = base_query.where(CommandFunds.user_id == current_user.id, CommandFunds.is_deleted == expression.false())
    if current_user.is_superuser and current_user.id != user_id: # admin see a specific user
        base_query = base_query.where(CommandFunds.user_id == user_id)

    # Apply search filters if provided
    if search:
        search_filters = parse_search_query(search, current_user.is_superuser)
        conditions = []

        # Admins can filter by username
        if current_user.is_superuser and search_filters.get("username"):
            conditions.append(CommandFunds.user.has(Users.username.ilike(f"%{search_filters['username']}%")))

        if search_filters["payment_method"]:
            conditions.append(CommandFunds.payment_method.ilike(f"%{search_filters['payment_method']}%"))
        if search_filters["from"]:
            conditions.append(CommandFunds.received_from.ilike(f"%{search_filters['from']}%"))


        if search_filters["date"]:
            month, day = map(int, search_filters["date"].split("-"))
            conditions.append(
                and_(
                    func.extract("month", CommandFunds.date) == month,
                    func.extract("day", CommandFunds.date) == day
                )
            )

        if search_filters["amount_range"]:
            min_amount, max_amount = search_filters["amount_range"]
            conditions.append(CommandFunds.amount.between(min_amount, max_amount))

        if search_filters['h']:
            conditions.append(CommandFunds.head.has(Heads.heads.ilike(f"%{search_filters['h']}%")))
        if search_filters['sh']:
            conditions.append(CommandFunds.sub_heads.has(SubHeads.subheads.ilike(f"%{search_filters['sh']}%")))

        if search_filters["general"]:
            general_conditions = []
            for term in search_filters["general"]:
                general_conditions.append(
                    or_(
                        CommandFunds.fund_details.ilike(f"%{term}%"),
                    )
                )
            conditions.append(and_(*general_conditions))

        if conditions:
            base_query = base_query.where(and_(*conditions))

    # Performance Optimization: Count total records efficiently
    total_count = session.exec(select(func.count()).select_from(base_query.subquery())).one()

    # Apply pagination
    base_query = base_query.offset(skip).limit(limit)

    # Fetch inflows
    inflows = [
        {
            **item.dict(),
            "user": item.user.name if item.user else None,
            "head": item.head.heads if item.head else None,
            "sub_heads": item.sub_heads.subheads if item.sub_heads else None,
            "iban": item.iban.ibn if item.iban else None,
        }
        for item in session.exec(base_query).all()
    ]

    return InflowsPublic(data=inflows, count=total_count)


@router.post("/", response_model=InflowPublic)
def create_inflow(
        *, session: SessionDep, current_user: CurrentUser, item_in: InflowCreate
) -> Any:
    """
    Create new inflow item and update the user's balance accordingly.
    """
    print("amount: ", item_in.amount)
    item = CommandFunds.model_validate(item_in, update={"user_id": current_user.id})

    # Extract payment method and amount
    payment_method = item.payment_method
    amount = item.amount

    # Add the inflow item and commit
    session.add(item)
    session.commit()
    session.refresh(item)

    # Prepare the response with dynamic fields
    response = item.dict()
    response.update({
        "id": item.id,
        "user_id": item.user_id,
        "user": item.user.name if item.user else None,
        "head": item.head.heads if item.head else None,
        "sub_heads": item.sub_heads.subheads if item.sub_heads else None
    })

    log_activity(
        session=session,
        log_name="Create Inflow",
        description=f"Inflow amount {amount} via {payment_method}",
        event="CREATE",
        user_id=current_user.id,
        router_prefix="inflows",
        subject_type="User",
        subject_id=current_user.id,
        my_custom_field=f"Inflow of amount {amount} created via {payment_method}",
    )

    # Update user balance based on payment method
    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()
    if user_balance:
        balance_field = 'cash_in_hand' if payment_method == "Cash Transfer" else 'cash_in_bank'
        old_balance = getattr(user_balance, balance_field, Decimal('0.00'))
        new_balance = old_balance + amount
        setattr(user_balance, balance_field, new_balance)

        # Recalculate the total balance
        user_balance.balance = (user_balance.cash_in_hand or Decimal('0.00')) + (
                user_balance.cash_in_bank or Decimal('0.00'))
        session.commit()

        # Log the balance update activity
        log_activity(
            session=session,
            log_name="Update Balance",
            description=f"{current_user.username} balance {balance_field} changed {old_balance} to {new_balance}.",
            event="balance_updated",
            user_id=current_user.id,
            router_prefix="inflows",
            subject_type="Balances",  # The subject is the balance entity
            subject_id=user_balance.id,  # The balance ID is the subject ID
            my_custom_field=f"Balance for user {current_user.username} updated. {balance_field} changed from {old_balance} to {new_balance}.",
        )

    return response


from sqlalchemy.orm import Session


@router.put("/{id}", response_model=InflowPublic)
def update_inflow(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
        item_in: InflowUpdate,
) -> Any:
    """
    Update an item and manage balance accordingly.
    """
    # Start a transaction (i.e., encapsulate the update logic in one session.commit)
    item = session.get(CommandFunds, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if not current_user.is_superuser and (item.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    old_payment_method = item.payment_method
    old_amount = item.amount
    new_payment_method = item_in.payment_method
    new_amount = item_in.amount

    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()
    if not user_balance:
        raise HTTPException(status_code=400, detail="User balance record not found")

    # Revert old payment method balance
    if old_payment_method != new_payment_method or new_amount != old_amount:
        old_balance_field = 'cash_in_hand' if old_payment_method == "Cash Transfer" else 'cash_in_bank'
        old_balance = getattr(user_balance, old_balance_field, Decimal('0.00'))

        if old_balance < old_amount and new_amount < old_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Revert failed due to insufficient funds in {old_payment_method}."
            )
        setattr(user_balance, old_balance_field, old_balance - old_amount)

        # Add new amount to new payment method
        new_balance_field = 'cash_in_hand' if new_payment_method == "Cash Transfer" else 'cash_in_bank'
        setattr(user_balance, new_balance_field, getattr(user_balance, new_balance_field) + new_amount)

        # Recalculate total balance
        user_balance.balance = (user_balance.cash_in_hand or Decimal('0.00')) + (
                user_balance.cash_in_bank or Decimal('0.00')
        )

    # Apply the updates to the inflow item
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)

    # Commit changes
    session.commit()
    session.refresh(user_balance)
    session.refresh(item)
    # Prepare and return the response
    response = item.dict()
    response.update({
        "id": item.id,
        "user_id": item.user_id,
        "user": item.user.name if item.user else None,
        "head": item.head.heads if item.head else None,
        "sub_heads": item.sub_heads.subheads if item.sub_heads else None
    })

    # Log the update activity
    log_activity(
        session=session,
        log_name="Update Inflow",
        description=(
            f"User {current_user.username} updated inflow {item.id}. "
            f"Original Payment Method: {old_payment_method}, Original Amount: {old_amount}, "
            f"New Payment Method: {new_payment_method}, New Amount: {new_amount}. "
            f"User balance updated: Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
            f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
            f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
        ),
        event="inflow_updated",
        user_id=current_user.id,
        router_prefix="inflows",
        subject_type="inflows",
        subject_id=item.id
    )

    return response


@router.get("/{id}")
def read_item(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
    """
    Get item by ID.
    """
    item = session.get(CommandFunds, id)
    if not item:
        log_activity(
            session=session,
            log_name="Item Not Found",
            description=f"User {current_user.username} tried to view inflow item {id}, but it was not found.",
            event="inflow_item_not_found",
            user_id=current_user.id,
            router_prefix="inflows",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Item not found")
    response = {
        **item.dict()
    }
    if not current_user.is_superuser and (item.user_id != current_user.id):
        log_activity(
            session=session,
            log_name="Permission Denied",
            description=f"User {current_user.username} tried to view inflow item {id} without sufficient permissions.",
            event="inflow_permission_denied",
            user_id=current_user.id,
            router_prefix="inflows",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=400, detail="Not enough permissions")
    # return item

    log_activity(
        session=session,
        log_name="View Inflow",
        description=f"User {current_user.username} viewed inflow item {item.id}.",
        event="inflow_viewed",
        user_id=current_user.id,
        router_prefix="inflows",
        subject_type="User",
        subject_id=current_user.id
    )
    return response


@router.delete("/{id}")
def delete_item(
        session: SessionDep, current_user: CurrentUser, id: int
) -> Message:
    """
    Delete an item and adjust the user's balance accordingly.
    """
    # Fetch the inflow item by ID
    item = session.get(CommandFunds, id)
    if not item:
        log_activity(
            session=session,
            log_name="Item Not Found",
            description=f"User {current_user.username} tried to delete inflow item {id}, but it was not found.",
            event="inflow_item_not_found",
            user_id=current_user.id,
            router_prefix="inflows",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Item not found")

    # Handle Permanent Deletion by Superuser (if already marked deleted)
    if current_user.is_superuser and item.is_deleted:
        session.delete(item)
        session.commit()
        log_activity(
            session=session,
            log_name="Item Permanently Deleted",
            description=f"Superuser {current_user.username} permanently deleted inflow item {id}.",
            event="inflow_item_deleted_permanently",
            user_id=current_user.id,
            router_prefix="inflows",
            subject_type="User",
            subject_id=current_user.id
        )
        return Message(message="Inflow permanently deleted")

    # Ensure user has permission to delete
    if not current_user.is_superuser and item.user_id != current_user.id:
        log_activity(
            session=session,
            log_name="Permission Denied",
            description=f"User {current_user.username} attempted to delete inflow item {id} but lacked permissions.",
            event="inflow_item_permission_denied",
            user_id=current_user.id,
            router_prefix="inflows",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Fetch user's balance
    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()
    if not user_balance:
        raise HTTPException(status_code=400, detail="User balance record not found")

    # Determine balance field based on payment method
    balance_field = 'cash_in_hand' if item.payment_method == "Cash Transfer" else 'cash_in_bank'
    old_balance = getattr(user_balance, balance_field, Decimal('0.00'))
    payment_method = item.payment_method
    amount = item.amount

    # Validate available balance before deduction
    if old_balance < amount:
        raise HTTPException(
            status_code=400,
            detail=f"This {balance_field.replace('_', ' ')} may link to invest/outflow can't be deleted."
        )

    # Deduct the amount
    setattr(user_balance, balance_field, old_balance - amount)
    user_balance.balance = (user_balance.cash_in_hand or Decimal('0.00')) + (
            user_balance.cash_in_bank or Decimal('0.00')
    )
    session.commit()

    # Log the balance update
    log_activity(
        session=session,
        log_name="Balance Updated",
        description=(
            f"Balance for user {current_user.username} updated. "
            f"{balance_field} changed from {old_balance} to {getattr(user_balance, balance_field)}. "
            f"Total balance is now {user_balance.balance}."
        ),
        event="balance_updated",
        user_id=current_user.id,
        router_prefix="inflows",
        subject_type="Balances",
        subject_id=user_balance.id
    )

    # Delete the inflow item
    item.deleted_at = get_pakistan_timestamp()
    if current_user.is_superuser:
        session.delete(item)
        session.commit()
        log_activity(
            session=session,
            log_name="inflow Permanently Deleted by Admin",
            description=(
                f"User {current_user.username} deleted inflow ID {item.id}. "
                f"Payment Method: {payment_method}, Amount: {amount}. "
                f"User balance updated: Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
                f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
                f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
            ),
            event="inflow_deleted",
            user_id=current_user.id,
            router_prefix="inflow",
            subject_type="Inflows",
            subject_id=item.id
        )
        return Message(message="Inflow permanently deleted")
    else:
        item.is_deleted = True
        session.add(item)
        session.commit()
        session.refresh(item)
        log_activity(
            session=session,
            log_name="inflow Deleted",
            description=(
                f"User {current_user.username} deleted inflow ID {item.id}. "
                f"Payment Method: {payment_method}, Amount: {amount}. "
                f"User balance updated: Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
                f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
                f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
            ),
            event="inflow_deleted",
            user_id=current_user.id,
            router_prefix="inflow",
            subject_type="Inflows",
            subject_id=item.id
        )
        return Message(message="Inflow deleted successfully")
