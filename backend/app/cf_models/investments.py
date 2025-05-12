from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field


# Shared properties
class InvestBase(SQLModel):
    name: Optional[str] = None
    asset_details: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    date: Optional[datetime] = None  # date_of_entry
    type: Optional[str] = None


# Properties to receive on item creation
class InvestCreate(InvestBase):
    iban_id: int = None


# Properties to receive on item update
class InvestUpdate(InvestBase):
    description: Optional[str] = None



# Properties to return via API, id is always required
class InvestPublic(InvestBase):
    iban: Optional[str] = None
    # Relationship
    user: Optional[str] = None
    # ----------------
    is_deleted: bool = Field(default=False)
    id: int
    user_id: int
    # hid 40 shid 41


class InvestsPublic(SQLModel):
    data: list[InvestPublic]
    count: int
