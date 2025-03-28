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
from app.cf_models.assets import AssetsPublic, AssetPublic, AssetUpdate, AssetDispose
from app.cf_models.schemas import Message, Balances, Assets, Users
from app.cf_models.utils import log_activity
from app.utils import get_pakistan_timestamp, get_asset_id

router = APIRouter(prefix="/assets", tags=["assets"])


def parse_search_query(search: str, is_superuser: bool) -> dict:
    """Parses a search string intelligently into different filters, including head:, subhead:, and pay_to:."""
    filters = {
        "date": None,
        "amount_range": None,
        "from": None,
        "general": [],
    }

    # Define recognized prefixes
    known_prefixes = ["from:"]

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


@router.get("/", response_model=AssetsPublic)
def read_assets(
        session: SessionDep,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 100,
        search: str = "",
        user_id: int | None = None,
) -> Any:
    # Base query setup
    base_query = select(Assets).options(
        joinedload(Assets.user)
    ).order_by(Assets.purchase_date.desc())

    # Apply user restrictions (Admins see all, regular users see only their own)
    if not current_user.is_superuser:
        base_query = base_query.where(Assets.user_id == current_user.id)
    if current_user.is_superuser and current_user.id != user_id:
        base_query = base_query.where(Assets.user_id == user_id)

    # Apply search filters if provided
    if search:
        search_filters = parse_search_query(search, current_user.is_superuser)
        conditions = []

        # Admins can filter by username
        if current_user.is_superuser and search_filters.get("username"):
            conditions.append(
                or_(
                    Assets.user.has(Users.username.ilike(f"%{search_filters['username']}%")),
                    Assets.asset_id.ilike(f"%{search_filters['username']}%")
                )
            )

            #

        if search_filters["from"]:
            conditions.append(Assets.purchased_from.ilike(f"%{search_filters['from']}%"))

        if search_filters["date"]:
            month, day = map(int, search_filters["date"].split("-"))
            conditions.append(
                and_(
                    func.extract("month", Assets.purchase_date) == month,
                    func.extract("day", Assets.purchase_date) == day
                )
            )

        if search_filters["amount_range"]:
            min_amount, max_amount = search_filters["amount_range"]
            conditions.append(Assets.cost.between(min_amount, max_amount))

        if search_filters["general"]:
            general_conditions = []
            for term in search_filters["general"]:
                general_conditions.append(
                    or_(
                        Assets.head_details.ilike(f"%{term}%"),
                        Assets.model.ilike(f"%{term}%"),
                        Assets.brand.ilike(f"%{term}%"),
                        Assets.purchased_from.ilike(f"%{term}%"),
                        Assets.status.ilike(f"%{term}%"),
                        Assets.dispose_status.ilike(f"%{term}%"),
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
            "user": item.user.name if item.user else None,  # Transform user field
            "user_id": item.user_id or 0,  # Provide a fallback for user_id
        }
        for item in session.exec(base_query).all()
    ]

    return AssetsPublic(data=inflows, count=total_count)


@router.put("/{id}", response_model=AssetPublic)
def update_item(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
        item_in: AssetUpdate,
) -> Any:
    """
    Update an item.
    """
    item = session.get(Assets, id)
    if not item:
        log_activity(
            session=session,
            log_name="Item Not Found",
            description=f"User {current_user.username} tried to update asset {id}, but it was not found.",
            event="asset_not_found",
            user_id=current_user.id,
            router_prefix="assets",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.user_id != current_user.id):
        log_activity(
            session=session,
            log_name="Permission Denied",
            description=f"User {current_user.username} tried to update asset {id}, but lacked permissions.",
            event="asset_update_permission_denied",
            user_id=current_user.id,
            router_prefix="assets",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)
    log_activity(
        session=session,
        log_name="Asset Updated",
        description=f"Asset {item.name} (ID: {id}) updated by {current_user.username}.",
        event="asset_updated",
        user_id=current_user.id,
        router_prefix="assets",
        subject_type="Assets",  # Subject type is "Assets" as it is an asset update
        subject_id=item.id  # The asset ID is the subject ID
    )
    asset_serial_id = get_asset_id(current_user.username, item.name)
    if item.status == "Pending":
        item.asset_id = asset_serial_id
    item.status = "Edited"
    session.add(item)
    session.commit()
    session.refresh(item)
    response = {
        **item.dict(),
        "user": item.user.name if item.user else None,
        "user_id": item.user_id or 0,  # Provide a fallback for user_id
    }
    return response


@router.put("/dispose/{id}", response_model=AssetPublic)
def dispose_asset(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
        item_in: AssetDispose,
) -> Any:
    """
    Update an item.
    """
    item = session.get(Assets, id)
    if not item:
        log_activity(
            session=session,
            log_name="Item Not Found",
            description=f"User {current_user.username} tried to dispose of asset {id}, but it was not found.",
            event="asset_not_found",
            user_id=current_user.id,
            router_prefix="assets",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.user_id != current_user.id):
        log_activity(
            session=session,
            log_name="Permission Denied",
            description=f"User {current_user.username} tried to dispose of asset {id}, but lacked permissions.",
            event="asset_dispose_permission_denied",
            user_id=current_user.id,
            router_prefix="assets",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)
    item.status = "Disposed"
    log_activity(
        session=session,
        log_name="Asset Disposed",
        description=f"Asset {item.name} (ID: {id}) disposed by {current_user.username}.",
        event="asset_disposed",
        user_id=current_user.id,
        router_prefix="assets",
        subject_type="Assets",  # Subject type is "Assets" as it is an asset disposal
        subject_id=item.id  # The asset ID is the subject ID
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    response = {
        **item.dict(),
        "user": item.user.name if item.user else None,
        "user_id": item.user_id or 0,  # Provide a fallback for user_id
    }
    return response
