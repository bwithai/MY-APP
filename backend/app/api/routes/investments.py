import re
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select
from sqlalchemy.sql import expression
from sqlalchemy import desc, or_, and_
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, SessionDep
from app.cf_models.investments import InvestsPublic, InvestPublic, InvestCreate, InvestUpdate
from app.cf_models.schemas import Investments, Message, Balances, InvestmentHistory, Users
from app.cf_models.utils import log_activity
from app.utils import get_pakistan_timestamp

router = APIRouter(prefix="/investment", tags=["investment"])


def parse_search_query(search: str, is_superuser: bool) -> dict:
    """Parses a search string intelligently into different filters, including head:, subhead:, and pay_to:."""
    filters = {
        "payment_method": None,
        "date": None,
        "amount_range": None,
        "type": None,
        "name": None,
        "general": [],
    }

    # Define recognized prefixes
    known_prefixes = ["type:", "name:"]

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


@router.get("/", response_model=InvestsPublic)
def read_invests(
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
    base_query = select(Investments).options(
        joinedload(Investments.user)
    ).order_by(Investments.date.desc())

    # Apply user restrictions (Admins see all, regular users see only their own)
    if not current_user.is_superuser:
        base_query = base_query.where(Investments.user_id == current_user.id, Investments.is_deleted == expression.false())
    if current_user.is_superuser and current_user.id != user_id:
        base_query = base_query.where(Investments.user_id == user_id)

    # Apply search filters if provided
    if search:
        search_filters = parse_search_query(search, current_user.is_superuser)
        conditions = []

        # Admins can filter by username
        if current_user.is_superuser and search_filters.get("username"):
            conditions.append(Investments.user.has(Users.username.ilike(f"%{search_filters['username']}%")))

        if search_filters["payment_method"]:
            conditions.append(Investments.payment_method.ilike(f"%{search_filters['payment_method']}%"))
        if search_filters["type"]:
            conditions.append(Investments.type.ilike(f"%{search_filters['type']}%"))
        if search_filters["name"]:
            conditions.append(Investments.name.ilike(f"%{search_filters['name']}%"))

        if search_filters["date"]:
            month, day = map(int, search_filters["date"].split("-"))
            conditions.append(
                and_(
                    func.extract("month", Investments.date) == month,
                    func.extract("day", Investments.date) == day
                )
            )

        if search_filters["amount_range"]:
            min_amount, max_amount = search_filters["amount_range"]
            conditions.append(Investments.amount.between(min_amount, max_amount))

        if search_filters["general"]:
            for term in search_filters["general"]:
                conditions.append(
                    or_(
                        Investments.asset_details.ilike(f"%{term}%"),
                    )
                )

        if conditions:
            base_query = base_query.where(and_(*conditions))

    # Count total matching records before pagination
    total_count = session.exec(select(func.count()).select_from(base_query.subquery())).one()

    # Apply pagination
    base_query = base_query.offset(skip).limit(limit)

    items = [
        {
            **item.dict(),
            "user": item.user.name if item.user else None,  # Transform user field
        }
        for item in session.exec(base_query).all()
    ]

    return InvestsPublic(data=items, count=total_count)


@router.post("/", response_model=InvestPublic)
def create_invest(
        *, session: SessionDep, current_user: CurrentUser, item_in: InvestCreate
) -> Any:
    """
    Create new inflow item and update the user's balance accordingly.
    """
    item = Investments.model_validate(item_in, update={"user_id": current_user.id})

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
                detail=f"Insufficient funds to Invest from {payment_method}."
            )

        # Subtract the amount and recalculate the total balance
        new_balance = getattr(user_balance, balance_field) - amount
        setattr(user_balance, balance_field, getattr(user_balance, balance_field) - amount)
        user_balance.balance = (user_balance.cash_in_hand or Decimal('0.00')) + (
                user_balance.cash_in_bank or Decimal('0.00'))

        session.commit()

        # Log the final updated balance
        log_activity(
            session=session,
            log_name="Balance Updated",
            description=(
                f"User {current_user.username} balance after update: "
                f"Payment Method: {payment_method}, Amount Subtracted: {amount}. "
                f"New {balance_field}: {new_balance}, Total Balance: {user_balance.balance}."
            ),
            event="balance_updated",
            user_id=current_user.id,
            router_prefix="invest",
            subject_type="Balances",
            subject_id=user_balance.id
        )

    # Add the inflow item and commit
    session.add(item)
    session.commit()
    session.refresh(item)
    # Prepare the response with dynamic fields
    response = item.dict()
    response.update({
        "user": item.user.name if item.user else None,
    })

    # Log the investment creation activity
    log_activity(
        session=session,
        log_name="Investment Created",
        description=f"User {current_user.username} created a new investment of {amount} via {payment_method}.",
        event="investment_created",
        user_id=current_user.id,
        router_prefix="invest",
        subject_type="Investments",
        subject_id=item.id
    )

    return response


@router.put("/{id}", response_model=InvestPublic)
def update_invest(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
        item_in: InvestUpdate,
) -> Any:
    """
    Update an investment item and manage balance and history accordingly.
    """
    # Fetch the investment item by ID
    item = session.get(Investments, id)

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check if the user has permission to update
    if not current_user.is_superuser and (item.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

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

    # Extract the updated fields (excluding description, as it's only for history)
    update_dict = item_in.model_dump(exclude_unset=True, exclude={"description"})
    item.sqlmodel_update(update_dict)

    # Commit changes to balances and outflow in a single transaction
    session.commit()
    session.refresh(user_balance)
    session.refresh(item)

    response = {
        **item.dict(),
        "user": item.user.name if item.user else None,
    }

    # Record the history of the update
    if old_amount > new_amount:
        pay_status = "Decrease"
    elif old_amount < new_amount:
        pay_status = "Increase"
    else:
        pay_status = None
    history_entry = InvestmentHistory(
        user_id=item.user_id,
        investment_id=id,
        first_balance=old_amount,
        last_balance=new_amount,
        date=item.date,
        status=pay_status,
        description=item_in.description or "Investment updated"  # History description
    )
    session.add(history_entry)

    # Log the update activity
    log_activity(
        session=session,
        log_name="Investment Updated",
        description=(
            f"User {current_user.username} updated Investment ID {id}. "
            f"Original Amount: {old_amount}, New Amount: {new_amount}, "
            f"Original Payment Method: {old_payment_method}, New Payment Method: {new_payment_method}. "
            f"User balance updated: Cash in Hand: {user_balance.cash_in_hand}, "
            f"Cash in Bank: {user_balance.cash_in_bank}, Total Balance: {user_balance.balance}."
        ),
        event="investment_updated",
        user_id=current_user.id,
        router_prefix="invest",
        subject_type="Investments",
        subject_id=id
    )
    session.commit()

    return response


@router.get("/history/{id}")
def get_investment_history(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
) -> Any:
    # Check if the investment exists (optional)
    investment = session.get(Investments, id)
    if not investment:
        raise HTTPException(status_code=404, detail="investment not found")

    # Optional: Check user permissions, if needed
    if not current_user.is_superuser and investment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions to access this history")

    # Retrieve the investment history
    statement = (
        select(InvestmentHistory)
        .where(InvestmentHistory.investment_id == id)
    )

    items = [
        {
            "status": item.status,
            "description": item.description,
            "first_balance": item.first_balance,
            "last_balance": item.last_balance,
            "date": item.date,
            "user": item.user.name if item.user else None,  # Transform user field
            "investment": item.investment.name if item.investment else None,
        }
        for item in session.exec(statement).all()
    ]

    # Log the activity for tracking
    log_activity(
        session=session,
        log_name="investment History Retrieved",
        description=(
            f"User {current_user.username} retrieved history for investment ID {id}. "
            f"History count: {len(items)}. Investment Name: {investment.name}."
        ),
        event="investment_history_retrieved",
        user_id=current_user.id,
        router_prefix="history",
        subject_type="Investments",
        subject_id=id
    )

    # Return the history
    return items


@router.get("/{id}", response_model=InvestPublic)
def read_invest(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
    """
    Get item by ID.
    """
    item = session.get(Investments, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    # return item
    return {
        **item.dict()
    }


@router.delete("/{id}")
def delete_invest(
        session: SessionDep, current_user: CurrentUser, id: int
) -> Message:
    """
    Delete an item and adjust the user's balance accordingly.
    """
    # Fetch the inflow item by ID
    item = session.get(Investments, id)
    if not item:
        log_activity(
            session=session,
            log_name="Item Not Found",
            description=f"User {current_user.username} tried to delete investment item {id}, but it was not found.",
            event="investment_item_not_found",
            user_id=current_user.id,
            router_prefix="investments",
            subject_type="Investments",
            subject_id=id
        )
        raise HTTPException(status_code=404, detail="Item not found")

    if current_user.is_superuser and item.is_deleted:
        session.delete(item)
        session.commit()
        log_activity(
            session=session,
            log_name="Item Permanently Deleted",
            description=f"Superuser {current_user.username} permanently deleted investment item {id}.",
            event="investment_item_deleted_permanently",
            user_id=current_user.id,
            router_prefix="investments",
            subject_type="Investments",
            subject_id=id
        )
        return Message(message="Investment permanently deleted")

    # Check if the user has permission to delete
    if not current_user.is_superuser and (item.user_id != current_user.id):
        log_activity(
            session=session,
            log_name="Permission Denied",
            description=f"User {current_user.username} attempted to delete investment item {id} but lacked permissions.",
            event="investment_item_permission_denied",
            user_id=current_user.id,
            router_prefix="investments",
            subject_type="Investments",
            subject_id=id
        )
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Extract the payment method and amount
    payment_method = item.payment_method
    amount = item.amount

    # Find the user's balance record
    user_balance = session.query(Balances).filter_by(user_id=current_user.id).first()
    if not user_balance:
        raise HTTPException(status_code=400, detail="User balance record not found")

    # Add the amount from the appropriate balance field based on payment method
    balance_field = 'cash_in_hand' if payment_method == "Cash Transfer" else 'cash_in_bank'
    old_balance = getattr(user_balance, balance_field, Decimal('0.00'))
    setattr(user_balance, balance_field, old_balance + amount)

    # Recalculate the total balance after the subtraction
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

    # Delete the inflow item
    item.deleted_at = get_pakistan_timestamp()
    if current_user.is_superuser:
        session.delete(item)
        session.commit()
        log_activity(
            session=session,
            log_name="Investment Permanently Deleted",
            description=(
                f"Superuser {current_user.username} permanently deleted Investment ID {id}. "
                f"Amount: {amount}, Payment Method: {payment_method}. "
                f"Updated Balance - Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
                f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
                f"Total: {user_balance.balance if user_balance else 'N/A'}."
            ),
            event="investment_permanently_deleted",
            user_id=current_user.id,
            router_prefix="invest",
            subject_type="Investments",
            subject_id=id
        )
    else:
        item.is_deleted = True
        session.add(item)
        session.commit()
        session.refresh(item)
        log_activity(
            session=session,
            log_name="Investment Deleted",
            description=(
                f"User {current_user.username} deleted Investment ID {id}. "
                f"Amount: {amount}, Payment Method: {payment_method}. "
                f"Updated Balance - Cash in Hand: {user_balance.cash_in_hand if user_balance else 'N/A'}, "
                f"Cash in Bank: {user_balance.cash_in_bank if user_balance else 'N/A'}, "
                f"Total: {user_balance.balance if user_balance else 'N/A'}."
            ),
            event="investment_deleted",
            user_id=current_user.id,
            router_prefix="invest",
            subject_type="Investments",
            subject_id=id
        )

    return Message(message="Investment deleted successfully")
