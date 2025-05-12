from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field


class LiabilityHistory(SQLModel):
    user: Optional[str] = None
    liability: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    first_balance: Optional[Decimal] = None
    last_balance: Optional[Decimal] = None
    date: Optional[datetime] = None  # date_of_entry
    payment_to: Optional[str] = None
    current_amount: Optional[Decimal] = None



# Shared properties
class LiabilityBase(SQLModel):
    fund_details: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    date: Optional[datetime] = None  # date_of_entry
    type: Optional[str] = None


# Properties to receive on item creation
class LiabilityCreate(LiabilityBase):
    iban_id: Optional[int] = None
    name: Optional[str] = None
    # head_id: Optional[int] = None
    remaining_balance: Optional[Decimal] = None
    # subhead_id: Optional[int] = None
    payment_to: Optional[str] = None

class LiabilityPay(LiabilityBase):
    payment_to: Optional[str] = None
    pay: Optional[Decimal] = None
    remaining_balance: Optional[Decimal] = None
    description: Optional[str] = None



# Properties to receive on item update
class LiabilityUpdate(LiabilityBase):
    payment_to: Optional[str] = None



# Properties to return via API, id is always required
class LiabilityPublic(LiabilityBase):
    # Relationship
    # head: Optional[str] = None
    # sub_heads: Optional[str] = None
    name: Optional[str]
    user: Optional[str] = None
    remaining_balance: Decimal  # Required field
    # ----------------
    payment_to: Optional[str] = None
    is_deleted: bool = Field(default=False)
    is_paid: bool = Field(default=False)
    id: int
    user_id: int
    # hid 40 shid 41


class LiabilitysPublic(SQLModel):
    data: list[LiabilityPublic]
    count: int
