import pprint
import re
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select
from sqlalchemy.sql import expression
from sqlalchemy import desc, or_, and_
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, SessionDep
from app.cf_models.schemas import Expenses, Message, Balances, Users, Assets, Heads, SubHeads
from app.cf_models.outflows import OutflowsPublic, OutflowUpdate, OutflowPublic, OutflowCreate
from app.cf_models.utils import log_activity
from app.utils import get_pakistan_timestamp, get_asset_id, get_salvage

router = APIRouter(prefix="/outflows", tags=["outflows"])


def parse_search_query(search: str, is_superuser: bool) -> dict:
    """Parses a search string intelligently into different filters, including head:, subhead:, and pay_to:."""
    filters = {
        "payment_type": None,
        "date": None,
        "amount_range": None,
        "head": None,
        "subhead": None,
        "pay_to": None,
        "general": [],
    }

    # Define recognized prefixes
    known_prefixes = ["head:", "subhead:", "pay_to:"]

    words = search.split()
    i = 0

    while i < len(words):
        word = words[i]
        print(word)

        if re.match(r"^\d{1,2}/\d{1,2}$", word):  # Matches MM/DD format
            filters["date"] = word.replace("/", "-")  # Store in consistent MM-DD format
        elif re.match(r"^\d+-\d+$", word):  # Matches amount range (e.g., "1000-5000")
            filters["amount_range"] = tuple(map(Decimal, word.split("-")))
        elif word.lower() in ["bank", "cash"]:  # Payment methods
            filters["payment_type"] = word.lower()
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


# Endpoint for retrieving expenses
@router.get("/", response_model=OutflowsPublic)
def read_expenses(
        session: SessionDep,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 100,
        search: str = "",
        user_id: int | None = None,
) -> Any:
    """
    Retrieve expense items with optional search and pagination.
    """

    # Base query setup
    base_query = select(Expenses).options(
        joinedload(Expenses.head),
        joinedload(Expenses.sub_heads),
        joinedload(Expenses.user)
    ).order_by(Expenses.expense_date.desc())

    # Apply user restrictions (Admins see all, regular users see only their own)
    if not current_user.is_superuser:
        base_query = base_query.where(Expenses.user_id == current_user.id, Expenses.is_deleted == expression.false())
    if current_user.is_superuser and current_user.id != user_id:
        base_query = base_query.where(Expenses.user_id == user_id)

    # Apply search filters if provided
    if search:
        search_filters = parse_search_query(search, current_user.is_superuser)
        conditions = []

        # Admins can filter by username
        if current_user.is_superuser and search_filters.get("username"):
            conditions.append(Expenses.user.has(Users.username.ilike(f"%{search_filters['username']}%")))

        if search_filters["payment_type"]:
            conditions.append(Expenses.payment_type.ilike(f"%{search_filters['payment_type']}%"))
        if search_filters["pay_to"]:
            conditions.append(Expenses.payment_to.ilike(f"%{search_filters['pay_to']}%"))

        if search_filters["date"]:
            month, day = map(int, search_filters["date"].split("-"))
            conditions.append(
                and_(
                    func.extract("month", Expenses.expense_date) == month,
                    func.extract("day", Expenses.expense_date) == day
                )
            )

        if search_filters["amount_range"]:
            min_amount, max_amount = search_filters["amount_range"]
            conditions.append(Expenses.cost.between(min_amount, max_amount))

        if search_filters['head']:
            conditions.append(Expenses.head.has(Heads.heads.ilike(f"%{search_filters['head']}%")))
        if search_filters['subhead']:
            conditions.append(Expenses.sub_heads.has(SubHeads.subheads.ilike(f"%{search_filters['subhead']}%")))

        if search_filters["general"]:
            for term in search_filters["general"]:
                conditions.append(
                    or_(
                        Expenses.head.has(Heads.heads.ilike(f"%{term}%")),
                        Expenses.sub_heads.has(SubHeads.subheads.ilike(f"%{term}%")),
                        Expenses.head_details.ilike(f"%{term}%"),
                        Expenses.payment_to.ilike(f"%{term}%"),
                    )
                )

        if conditions:
            base_query = base_query.where(and_(*conditions))

    # Count total matching records before pagination
    total_count = session.exec(select(func.count()).select_from(base_query.subquery())).one()

    # Apply pagination
    base_query = base_query.offset(skip).limit(limit)

    # Fetch expenses
    expenses = [
        {
            **item.dict(),
            "user": item.user.name if item.user else None,  # Transform user field
            "head": item.head.heads if item.head else None,  # Transform user field
            "sub_heads": item.sub_heads.subheads if item.sub_heads else None,  # Transform user field
        }
        for item in session.exec(base_query).all()
    ]

    return OutflowsPublic(data=expenses, count=total_count)


@router.post("/", response_model=OutflowPublic)
def create_outflow(
        *, session: SessionDep, current_user: CurrentUser, item_in: OutflowCreate
) -> Any:
    """
    Create new outflow item and update the user's balance accordingly.
    """
    item = Expenses.model_validate(item_in, update={
        "user_id": current_user.id, "corps_id": current_user.corp_id,
        "div_id": current_user.div_id, "brigade_id": current_user.brigade_id,
        "unit_id": current_user.unit_id
    })

    # Extract payment method and amount
    payment_method = item.payment_type
    amount = item.cost
    is_asset = True if item.type == "NONEXPANDABLE" else False

    if is_asset:
        salvage = get_salvage(amount)
        asset_serial_id = get_asset_id(current_user.username, item.head_details)
        asset = Assets(
            name=item.head_details, type="PURCHASED", purchase_date=item.expense_date,
            asset_id=asset_serial_id, purchased_from=item.payment_to, serial_number=asset_serial_id,
            cost=amount, status="Pending", salvage_value=salvage, user_id=current_user.id,
            head_detaills=item.head_details, payment_type=item.payment_type

        )
        session.add(asset)
        session.commit()
        session.refresh(asset)

    # Get user balance
    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()

    if user_balance:
        # Check for sufficient funds based on payment method
        balance_field = 'cash_in_hand' if payment_method == "cash" else 'cash_in_bank'
        if getattr(user_balance, balance_field) < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient funds in {payment_method}."
            )

        # Subtract the amount and recalculate the total balance
        setattr(user_balance, balance_field, getattr(user_balance, balance_field) - amount)
        user_balance.balance = (user_balance.cash_in_hand or Decimal('0.00')) + (
                user_balance.cash_in_bank or Decimal('0.00'))

        session.commit()

    # Add the outflow item and commit
    session.add(item)
    session.commit()
    session.refresh(item)

    # Prepare the response with dynamic fields
    response = item.dict()
    response.update({
        "user": item.user.name if item.user else None,
        "head": item.head.heads if item.head else None,
        "sub_heads": item.sub_heads.subheads if item.sub_heads else None
    })

    # Log the create activity
    log_activity(
        session=session,
        log_name="Outflow Created",
        description=(
            f"User {current_user.username} created Outflow ID {item.id}. "
            f"Payment Method: {payment_method}, Amount: {amount}, Asset: {is_asset}. "
            f"User balance updated: Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
            f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
            f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
        ),
        event="outflow_created",
        user_id=current_user.id,
        router_prefix="outflow",
        subject_type="Expenses",
        subject_id=item.id
    )

    return response


@router.put("/{id}", response_model=OutflowPublic)
def update_outflow(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
        item_in: OutflowUpdate,
) -> Any:
    """
    Update an outflow item and update the user's balance accordingly.
    """
    # Fetch the outflow item by ID
    item = session.get(Expenses, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check if the user has permission to update
    if not current_user.is_superuser and (item.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    old_payment_method = item.payment_type
    old_amount = item.cost
    new_payment_method = item_in.payment_type
    new_amount = item_in.cost

    # Find the user's balance record
    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()
    if not user_balance:
        raise HTTPException(status_code=400, detail="User balance record not found")

    # Step 1: Ensure there's enough balance in the new payment method for the updated outflow
    new_balance_field = 'cash_in_hand' if new_payment_method == "cash" else 'cash_in_bank'
    if getattr(user_balance, new_balance_field) < new_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient funds in {new_payment_method}."
        )

    # Step 2: Revert the previous payment method's deduction
    if old_payment_method != new_payment_method or old_amount != new_amount:  # Only if the payment method changes
        old_balance_field = 'cash_in_hand' if old_payment_method == "cash" else 'cash_in_bank'
        setattr(user_balance, old_balance_field,
                getattr(user_balance, old_balance_field, Decimal('0.00')) + old_amount)

        # Step 3: Deduct the amount from the new payment method's balance
        setattr(user_balance, new_balance_field, getattr(user_balance, new_balance_field) - new_amount)

        # Step 4: Recalculate the total balance
        user_balance.balance = (user_balance.cash_in_hand or Decimal('0.00')) + (
                user_balance.cash_in_bank or Decimal('0.00'))

    # Apply the updates to the outflow item
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)

    # Commit changes to balances and outflow in a single transaction
    session.commit()
    session.refresh(user_balance)
    session.refresh(item)
    # Prepare the response with dynamic fields
    response = item.dict()
    response.update({
        "user": item.user.name if item.user else None,
        "head": item.head.heads if item.head else None,
        "sub_heads": item.sub_heads.subheads if item.sub_heads else None
    })

    # Log the update activity
    log_activity(
        session=session,
        log_name="Outflow Updated",
        description=(
            f"User {current_user.username} updated Outflow ID {item.id}. "
            f"Original Payment Method: {old_payment_method}, Original Amount: {old_amount}, "
            f"New Payment Method: {new_payment_method}, New Amount: {new_amount}. "
            f"User balance updated: Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
            f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
            f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
        ),
        event="outflow_updated",
        user_id=current_user.id,
        router_prefix="outflow",
        subject_type="Expenses",
        subject_id=item.id
    )

    return response


@router.get("/{id}")
def read_item(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
    """
    Get item by ID.
    """
    item = session.get(Expenses, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    # return item
    return {
        **item.dict()
    }


@router.delete("/{id}")
def delete_item(
        session: SessionDep, current_user: CurrentUser, id: int
) -> Message:
    """
    Delete an outflow item and update the user's balance accordingly.
    """
    # Fetch the outflow item by ID
    item = session.get(Expenses, id)
    if not item:
        log_activity(
            session=session,
            log_name="Item Not Found",
            description=f"User {current_user.username} tried to delete outflow item {id}, but it was not found.",
            event="outflow_item_not_found",
            user_id=current_user.id,
            router_prefix="outflows",
            subject_type="Expenses",
            subject_id=item.id
        )
        raise HTTPException(status_code=404, detail="Item not found")

    if current_user.is_superuser and item.is_deleted:
        session.delete(item)
        session.commit()
        log_activity(
            session=session,
            log_name="Item Permanently Deleted",
            description=f"Superuser {current_user.username} permanently deleted outflow item {id}.",
            event="outflow_item_deleted_permanently",
            user_id=current_user.id,
            router_prefix="outflows",
            subject_type="Expenses",
            subject_id=item.id
        )
        return Message(message="Outflow permanently deleted")

    # Check if the user has permission to delete
    if not current_user.is_superuser and (item.user_id != current_user.id):
        log_activity(
            session=session,
            log_name="Permission Denied",
            description=f"User {current_user.username} attempted to delete outflow item {id} but lacked permissions.",
            event="outflow_item_permission_denied",
            user_id=current_user.id,
            router_prefix="outflows",
            subject_type="Outflows",
            subject_id=id
        )
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Get the payment method and cost for balance reversal
    payment_method = item.payment_type
    amount = item.cost

    # Find the user's balance record
    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()
    if not user_balance:
        raise HTTPException(status_code=400, detail="User balance record not found")

    # Add the amount back to the balance field based on payment method
    balance_field = 'cash_in_hand' if payment_method == "cash" else 'cash_in_bank'
    old_balance = getattr(user_balance, balance_field, Decimal('0.00'))
    setattr(user_balance, balance_field, old_balance + amount)

    # Recalculate the total balance
    user_balance.balance = (user_balance.cash_in_hand or Decimal('0.00')) + (
            user_balance.cash_in_bank or Decimal('0.00'))
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
        router_prefix="outflows",
        subject_type="Balances",
        subject_id=user_balance.id
    )

    # Delete the outflow item
    item.deleted_at = get_pakistan_timestamp()
    if current_user.is_superuser:
        session.delete(item)
        session.commit()
        # Log the delete activity
        log_activity(
            session=session,
            log_name="Outflow Permanently Deleted by Admin",
            description=(
                f"User {current_user.username} deleted Outflow ID {item.id}. "
                f"Payment Method: {payment_method}, Amount: {amount}. "
                f"User balance updated: Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
                f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
                f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
            ),
            event="outflow_deleted",
            user_id=current_user.id,
            router_prefix="outflow",
            subject_type="Expenses",
            subject_id=item.id
        )

    else:
        item.is_deleted = True
        session.add(item)
        session.commit()
        session.refresh(item)
        # Log the delete activity
        log_activity(
            session=session,
            log_name="Outflow Deleted",
            description=(
                f"User {current_user.username} deleted Outflow ID {item.id}. "
                f"Payment Method: {payment_method}, Amount: {amount}. "
                f"User balance updated: Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
                f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
                f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
            ),
            event="outflow_deleted",
            user_id=current_user.id,
            router_prefix="outflow",
            subject_type="Expenses",
            subject_id=item.id
        )

    return Message(message="Outflow deleted successfully")
