from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field


# Shared properties
class OutflowBase(SQLModel):
    head_details: Optional[str] = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=255)
    cost: Optional[Decimal] = None
    payment_type: str = Field(min_length=1, max_length=255)
    payment_to: str = Field(min_length=1, max_length=255)  # type: ignore


# Properties to receive on item creation
class OutflowCreate(OutflowBase):
    head_id: int
    subhead_id: Optional[int] = None
    place_type: Optional[str] = None
    expense_date: Optional[datetime] = None  # Outflow Date




# Properties to receive on item update
class OutflowUpdate(OutflowBase):
    head_id: Optional[int] = None
    subhead_id: Optional[int] = None
    expense_date: Optional[datetime] = None  # Outflow Date
    place_type: Optional[str] = None
    received_from: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Properties to return via API, id is always required
class OutflowPublic(OutflowBase):
    # Relationship
    head: Optional[str] = None
    sub_heads: Optional[str] = None
    user: Optional[str] = None
    # ----------------
    expense_date: Optional[datetime] = None  # Outflow Date
    place_type: Optional[str] = None
    is_deleted: bool = Field(default=False)
    id: int
    user_id: int
    # hid 40 shid 41


class OutflowsPublic(SQLModel):
    data: list[OutflowPublic]
    count: int
