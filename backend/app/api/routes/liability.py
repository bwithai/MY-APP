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
from app.cf_models.liability import LiabilityPublic, LiabilityCreate, LiabilitysPublic, LiabilityUpdate, LiabilityPay, \
    LiabilityHistory
from app.cf_models.schemas import Liabilities, Message, Balances, LiabilityBalances, Users, Heads, SubHeads
from app.cf_models.utils import log_activity
from app.utils import get_pakistan_timestamp

router = APIRouter(prefix="/liability", tags=["liability"])


def parse_search_query(search: str, is_superuser: bool) -> dict:
    """Parses a search string intelligently into different filters, including head:, subhead:, and pay_to:."""
    filters = {
        "payment_method": None,
        "date": None,
        "amount_range": None,
        "pay_to": None,
        "type": None,
        "paid": None,
        "general": [],
    }

    # Define recognized prefixes
    known_prefixes = ["pay_to:", "type:", "paid:"]

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


@router.get("/", response_model=LiabilitysPublic)
def read_liabilities(
        session: SessionDep,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 100,
        search: str = "",
        user_id: int | None = None,
) -> Any:
    """
    Retrieve items.
    """
    # Base query setup
    base_query = select(Liabilities).options(
        joinedload(Liabilities.user)
    ).order_by(Liabilities.date.desc())

    # Apply user restrictions (Admins see all, regular users see only their own)
    if not current_user.is_superuser:
        base_query = base_query.where(Liabilities.user_id == current_user.id, Liabilities.is_deleted == expression.false())
    if current_user.is_superuser and current_user.id != user_id:
        base_query = base_query.where(Liabilities.user_id == user_id)

    # Apply search filters if provided
    if search:
        search_filters = parse_search_query(search, current_user.is_superuser)
        conditions = []

        # Admins can filter by username
        if current_user.is_superuser and search_filters.get("username"):
            conditions.append(Liabilities.user.has(Users.username.ilike(f"%{search_filters['username']}%")))

        if search_filters["payment_method"]:
            conditions.append(Liabilities.payment_method.ilike(f"%{search_filters['payment_method']}%"))
        if search_filters["type"]:
            conditions.append(Liabilities.type.ilike(f"%{search_filters['type']}%"))
        if search_filters["pay_to"]:
            conditions.append(Liabilities.payment_to.ilike(f"%{search_filters['pay_to']}%"))
        if search_filters["paid"]:
            conditions.append(Liabilities.is_paid.ilike(f"%{search_filters['paid']}%"))


        if search_filters["date"]:
            month, day = map(int, search_filters["date"].split("-"))
            conditions.append(
                and_(
                    func.extract("month", Liabilities.date) == month,
                    func.extract("day", Liabilities.date) == day
                )
            )

        if search_filters["amount_range"]:
            min_amount, max_amount = search_filters["amount_range"]
            conditions.append(Liabilities.amount.between(min_amount, max_amount))

        if search_filters["general"]:
            general_conditions = []
            for term in search_filters["general"]:
                general_conditions.append(
                    or_(
                        Liabilities.fund_details.ilike(f"%{term}%"),
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
            # "head": item.head.heads if item.head else None,
            # "sub_heads": item.sub_heads.subheads if item.sub_heads else None,
        }
        for item in session.exec(base_query).all()
    ]

    return LiabilitysPublic(data=inflows, count=total_count)


@router.post("/", response_model=LiabilityPublic)
def create_liability(
        *, session: SessionDep, current_user: CurrentUser, item_in: LiabilityCreate
) -> Any:
    """
    Create new inflow item and update the user's balance accordingly.
    """
    item_in.remaining_balance = item_in.amount
    item = Liabilities.model_validate(item_in, update={"user_id": current_user.id})

    # Extract payment method and amount
    payment_method = item.payment_method
    amount = item.amount

    # Update user balance based on payment method
    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()
    if user_balance:
        balance_field = 'cash_in_hand' if payment_method == "Cash Transfer" else 'cash_in_bank'
        if getattr(user_balance, balance_field) < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient funds to Pay from {payment_method}."
            )

        # Subtract the amount and recalculate the total balance
        setattr(user_balance, balance_field, getattr(user_balance, balance_field) - amount)
        user_balance.balance = (user_balance.cash_in_hand or Decimal('0.00')) + (
                user_balance.cash_in_bank or Decimal('0.00'))

        session.commit()

    # Add the inflow item and commit
    session.add(item)
    session.commit()
    session.refresh(item)

    # Prepare the response with dynamic fields
    response = item.dict()
    response.update({
        "user": item.user.name if item.user else None,
        # "head": item.head.heads if item.head else None,
        # "sub_heads": item.sub_heads.subheads if item.sub_heads else None
    })



    # Log the activity
    log_activity(
        session=session,
        log_name="Liability Created",
        description=(
            f"User {current_user.username} created a new liability. "
            f"Amount: {amount}, Payment Method: {payment_method}. "
            f"Updated Balance - Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
            f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
            f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
        ),
        event="liability_created",
        user_id=current_user.id,
        router_prefix="liability",
        subject_type="Liabilities",
        subject_id=item.id
    )

    # # Record the liability payment history
    # history_entry = LiabilityBalances(
    #     user_id=item.user_id,
    #     liability_id=id,
    #     first_balance=0,
    #     last_balance=0,
    #     payment_type="N/A",
    #     description="N/A",
    #     date=None,
    #     status="UnPaid",
    #     payment_to="N/A",
    #     current_amount=0,
    # )
    # session.add(history_entry)
    # session.commit()

    return response


@router.get("/{id}")
def read_liability(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
    """
    Get item by ID.
    """
    item = session.get(Liabilities, id)
    response = {
        "id": item.id,
        "name": item.name,
        # "head_id": item.head_id,
        # "subhead_id": item.subhead_id,
        "fund_details": item.fund_details,
        "amount": item.amount,
        "type": item.type,
        "remaining_balance": item.remaining_balance,
        "payment_to": item.payment_to,
        "payment_method": item.payment_method,
        "date": item.date
    }
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    # return item
    return response


@router.put("/pay/{id}", response_model=LiabilityPublic)
def pay_liability(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
        item_in: LiabilityPay,
) -> Any:
    """
    Update an investment item and manage balance and history accordingly.
    """
    # Fetch the investment item by ID
    item = session.get(Liabilities, id)

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check if admin is trying to update another user's record
    if current_user.is_superuser and item.user_id != current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Administrators cannot modify user liability payment records. This restriction is in place to maintain data integrity."
        )

    # Check if the user has permission to update
    if not current_user.is_superuser and (item.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Record the original amount before update to calculate the difference
    original_amount = item.remaining_balance

    if item_in.pay > original_amount:
        raise HTTPException(status_code=400, detail="Payment amount exceeds remaining balance")

    # Update the remaining balance
    item.remaining_balance -= item_in.pay

    # Determine the status
    if item.remaining_balance == 0:
        item.is_paid = True
        pay_status = "Paid"
    else:
        pay_status = "Partial"

    # Save the updated liability item
    session.add(item)
    session.commit()
    session.refresh(item)

    response = {
        **item.dict(),
        "user": item.user.name if item.user else None,
    }

    # Record the liability payment history
    history_entry = LiabilityBalances(
        user_id=item.user_id,
        liability_id=id,
        first_balance=original_amount,
        last_balance=item.remaining_balance,
        payment_type=item_in.payment_method,
        description=item_in.description,
        date=item_in.date,
        status=pay_status,
        payment_to=item_in.payment_to,
        current_amount=item_in.pay,
    )
    session.add(history_entry)
    session.commit()

    # Log the payment activity
    log_activity(
        session=session,
        log_name="Liability Payment",
        description=(
            f"User {current_user.username} paid {item_in.pay} towards Liability ID {id}. "
            f"Payment Method: {item_in.payment_method}, Payment To: {item_in.payment_to}. "
            f"Original Balance: {original_amount}, Remaining Balance: {item.remaining_balance}. "
        ),
        event="liability_payment",
        user_id=current_user.id,
        router_prefix="liability",
        subject_type="Liabilities",
        subject_id=id,
    )

    # Prepare and return the response
    return response


@router.get("/history/{id}")
def get_liability_history(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
) -> Any:
    # Check if the liability exists (optional)
    liability = session.get(Liabilities, id)
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")

    # Optional: Check user permissions, if needed
    if not current_user.is_superuser and liability.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions to access this history")

    # Retrieve the liability history
    statement = (
        select(LiabilityBalances)
        .where(LiabilityBalances.liability_id == id)
        .order_by(LiabilityBalances.date)  # Optional: Order by date or created_at field
    )

    items = [
        {
            "status": item.status,
            "description": item.description,
            "first_balance": item.first_balance,
            "last_balance": item.last_balance,
            "date": item.date,
            "payment_to": item.payment_to,
            "current_amount": item.current_amount,
            "user": item.user.name if item.user else None,  # Transform user field
            "fund_detail": item.liability.fund_details if item.liability else None,
        }
        for item in session.exec(statement).all()
    ]

    # Log activity for retrieving the history
    log_activity(
        session=session,
        log_name="Retrieve Liability History",
        description=(
            f"User {current_user.username} retrieved payment history for Liability ID {id}. "
            f"Number of history entries: {len(items)}."
        ),
        event="liability_history_retrieved",
        user_id=current_user.id,
        router_prefix="liability",
        subject_type="Liabilities",
        subject_id=id,
    )

    # Return the history
    return items


@router.put("/{id}", response_model=LiabilityPublic)
def update_liability(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
        item_in: LiabilityUpdate,
) -> Any:
    """
    Update an outflow item and update the user's balance accordingly.
    """
    # Fetch the outflow item by ID
    item = session.get(Liabilities, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check if admin is trying to update another user's record
    if current_user.is_superuser and item.user_id != current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Administrators cannot modify user liability records. This restriction is in place to maintain data integrity."
        )

    # Check if the user has permission to update
    if not current_user.is_superuser and (item.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Extract the old payment method and amount for reverting balance
    old_payment_method = item.payment_method
    old_amount = item.amount
    new_payment_method = item_in.payment_method
    new_amount = item_in.amount

    # Find the user's balance record
    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()
    if not user_balance:
        raise HTTPException(status_code=400, detail="User balance record not found")

    # Step 1: Ensure there's enough balance in the new payment method for the updated outflow
    new_balance_field = 'cash_in_hand' if new_payment_method == "Cash Transfer" else 'cash_in_bank'
    if getattr(user_balance, new_balance_field) < new_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient funds in {new_payment_method}."
        )

    # Step 2: Revert the previous payment method's deduction
    if old_payment_method != new_payment_method or old_amount != new_amount:  # Only if the payment method changes
        old_balance_field = 'cash_in_hand' if old_payment_method == "Cash Transfer" else 'cash_in_bank'
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

    session.commit()
    session.refresh(user_balance)
    session.refresh(item)
    # Prepare the response with dynamic fields
    response = item.dict()
    response.update({
        "user": item.user.name if item.user else None,
        # "head": item.head.heads if item.head else None,
        # "sub_heads": item.sub_heads.subheads if item.sub_heads else None
    })

    # Log the update activity
    log_activity(
        session=session,
        log_name="Liability Updated",
        description=(
            f"User {current_user.username} updated Liability ID {id}. "
            f"Original Payment Method: {old_payment_method}, New Payment Method: {new_payment_method}. "
            f"Original Amount: {old_amount}, New Amount: {new_amount}. "
            f"User balance updated: Cash in Hand: {user_balance.cash_in_hand}, "
            f"Cash in Bank: {user_balance.cash_in_bank}, Total Balance: {user_balance.balance}."
        ),
        event="liability_updated",
        user_id=current_user.id,
        router_prefix="liability",
        subject_type="Liabilities",
        subject_id=id
    )
    return response


@router.delete("/{id}")
def delete_liability(
        session: SessionDep, current_user: CurrentUser, id: int
) -> Message:
    """
    Delete an outflow item and update the user's balance accordingly.
    """
    # Fetch the outflow item by ID
    item = session.get(Liabilities, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if current_user.is_superuser and item.is_deleted:
        session.delete(item)
        session.commit()
        return Message(message="Liability permanently deleted")

    # Check if the user has permission to delete
    if not current_user.is_superuser and (item.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Get the payment method and cost for balance reversal
    payment_method = item.payment_method
    amount = item.amount

    # Find the user's balance record
    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()
    if not user_balance:
        raise HTTPException(status_code=400, detail="User balance record not found")

    # Add the amount back to the balance field based on payment method
    balance_field = 'cash_in_hand' if payment_method == "Cash Transfer" else 'cash_in_bank'
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
        router_prefix="liability",
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
            log_name="Liability Permanently Deleted by Admin",
            description=(
                f"User {current_user.username} deleted Liability ID {id}. "
                f"Payment Method: {payment_method}, Amount: {amount}. "
                f"User balance updated: Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
                f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
                f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
            ),
            event="liability_deleted",
            user_id=current_user.id,
            router_prefix="liability",
            subject_type="Liabilities",
            subject_id=id
        )
    else:
        item.is_deleted = True
        session.add(item)
        session.commit()
        session.refresh(item)
        # Log the delete activity
        log_activity(
            session=session,
            log_name="Liability Deleted",
            description=(
                f"User {current_user.username} deleted Liability ID {id}. "
                f"Payment Method: {payment_method}, Amount: {amount}. "
                f"User balance updated: Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
                f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
                f"Total Balance: {user_balance.balance if user_balance else 'N/A'}."
            ),
            event="liability_deleted",
            user_id=current_user.id,
            router_prefix="liability",
            subject_type="Liabilities",
            subject_id=id
        )

    return Message(message="Outflow deleted successfully")
