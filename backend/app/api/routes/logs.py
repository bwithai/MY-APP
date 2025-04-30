import pprint
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select
from sqlalchemy import desc, or_, and_
from datetime import datetime
from fastapi import Query

from app.api.deps import CurrentUser, SessionDep
from app.cf_models.assets import AssetsPublic, AssetPublic, AssetUpdate, AssetDispose
from app.cf_models.logs import LogsPublic
from app.cf_models.schemas import Message, Balances, ActivityLog

router = APIRouter(prefix="/logs", tags=["logs"])

from sqlalchemy import desc


@router.get("/", response_model=LogsPublic)
def read_logs(
        session: SessionDep,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 100,
        search: str = ""
) -> Any:
    """
    Retrieve recent log entries, with optional search functionality, and pagination.
    """

    # Base query setup
    base_query = select(ActivityLog).order_by(desc(ActivityLog.created_at))

    # Apply search filter if provided
    if search:
        parts = search.split(" ", 2)  # Split into max three parts
        first_word = parts[0]  # Always present
        target = parts[1] if len(parts) > 1 else None  # Second word if available
        date_filter = parts[2] if len(parts) > 2 else None  # Third word (expected MM-DD)

        conditions = [
            ActivityLog.log_name.ilike(f"%{search}%"),  # Always search in log_name
            ActivityLog.event.ilike(f"%{search}%"),  # Always search in event
        ]

        if target and not date_filter:
            # If only two words, ensure both exist in description
            conditions.append(
                and_(
                    ActivityLog.description.ilike(f"%{first_word}%"),
                    ActivityLog.description.ilike(f"%{target}%"),
                )
            )
        elif target and date_filter:
            # If three words, enforce both words in description and filter by month-day
            conditions.append(
                and_(
                    ActivityLog.description.ilike(f"%{first_word}%"),
                    ActivityLog.description.ilike(f"%{target}%"),
                    and_(
                        func.extract("month", ActivityLog.created_at) == int(date_filter.split("-")[0]),
                        func.extract("day", ActivityLog.created_at) == int(date_filter.split("-")[1])
                    )
                )
            )
        else:
            # If only one word, search normally in description
            conditions.append(ActivityLog.description.ilike(f"%{first_word}%"))

        base_query = base_query.where(or_(*conditions))

    # Apply user restrictions (Admins see all, regular users see only their own)
    if not current_user.is_superuser:
        base_query = base_query.where(ActivityLog.causer_id == current_user.id)

    # Get total count before pagination
    total_count = session.exec(select(func.count()).select_from(base_query.subquery())).one()

    # Apply pagination
    paginated_query = base_query.offset(skip).limit(limit)

    # Fetch logs and prepare response
    items = [
        {
            **item.dict(),
            "user": item.user.name if item.user else None,
            "user_id": item.causer_id or 0,
        }
        for item in session.exec(paginated_query).all()
    ]

    return LogsPublic(data=items, count=total_count)


@router.get("/search/", response_model=LogsPublic)
def search_logs(
        session: SessionDep,
        current_user: CurrentUser,
        query: str = Query(None, description="Search keyword"),
        start_date: datetime = Query(None, description="Start date for filtering"),
        end_date: datetime = Query(None, description="End date for filtering"),
        skip: int = 0,
        limit: int = 100,
) -> Any:
    """
    Search logs by log_name, description, event, and filter by date range.
    """

    # Base query with permissions
    statement = select(ActivityLog).order_by(desc(ActivityLog.created_at))

    if not current_user.is_superuser:
        statement = statement.where(ActivityLog.causer_id == current_user.id)

    # Apply search filters if a query is provided
    if query:
        statement = statement.where(
            or_(
                ActivityLog.log_name.ilike(f"%{query}%"),
                ActivityLog.description.ilike(f"%{query}%"),
                ActivityLog.event.ilike(f"%{query}%")
            )

        )

    # Apply date range filtering
    if start_date:
        statement = statement.where(ActivityLog.created_at >= start_date)
    if end_date:
        statement = statement.where(ActivityLog.created_at <= end_date)

    # Get count before pagination
    count = session.exec(select(func.count()).select_from(statement.subquery())).one()

    # Apply pagination
    statement = statement.offset(skip).limit(limit)

    items = [
        {
            **item.dict(),
            "user": item.user.name if item.user else None,
            "user_id": item.causer_id or 0,
        }
        for item in session.exec(statement).all()
    ]

    return LogsPublic(data=items, count=count)
