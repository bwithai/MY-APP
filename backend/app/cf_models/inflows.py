from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field


# Shared properties
class InflowBase(SQLModel):
    fund_details: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_method: Optional[str] = None


# Properties to receive on item creation
class InflowCreate(InflowBase):
    head_id: Optional[int] = None
    subhead_id: Optional[int] = None
    iban_id: Optional[int] = None
    date: Optional[datetime] = None  # date_of_entry
    received_from: Optional[str] | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Properties to receive on item update
class InflowUpdate(InflowBase):
    head_id: Optional[int] = None
    subhead_id: Optional[int] = None
    date: Optional[datetime] = None  # date_of_entry
    received_from: Optional[str] | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Properties to return via API, id is always required
class InflowPublic(InflowBase):
    # Relationship
    head: Optional[str] = None
    sub_heads: Optional[str] = None
    user: Optional[str] = None
    iban: Optional[str] = None
    # ----------------
    created_at: Optional[datetime] = None
    date: Optional[datetime] = None  # date_of_entry
    is_deleted: bool = Field(default=False)
    id: int
    user_id: int
    # hid 40 shid 41


class InflowsPublic(SQLModel):
    data: list[InflowPublic]
    count: int
