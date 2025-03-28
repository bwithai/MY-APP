from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field


# Shared properties
class AssetBase(SQLModel):
    asset_id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    purchase_date: Optional[datetime] = None  # date_of_entry
    purchased_from: Optional[str] = None
    cost: Optional[Decimal] = None
    salvage_value: Optional[Decimal] = None
    status: Optional[str] = None
    head_details: Optional[str] = None


# Properties to receive on item creation
class AssetCreate(AssetBase):
    pass


# Properties to receive on item update
class AssetUpdate(AssetBase):
    model: Optional[str] = None
    brand: Optional[str] = None
    useful_life: Optional[int] = None
    remarks: Optional[str] = None
    place_type: Optional[str] = None


class AssetDispose(SQLModel):
    dispose_status: Optional[str] = None
    sell_price: Optional[Decimal] = None
    sold_to: Optional[str] = None
    gift_to: Optional[str] = None
    disposed_reason: Optional[str] = None
    disposed_date: Optional[datetime] = None


# Properties to return via API, id is always required
class AssetPublic(AssetBase):
    # Relationship
    user: Optional[str] = None
    # update field
    model: Optional[str] = None
    brand: Optional[str] = None
    useful_life: Optional[int] = None
    remarks: Optional[str] = None
    place_type: Optional[str] = None
    # disposed field
    dispose_status: Optional[str] = None
    sell_price: Optional[Decimal] = None
    sold_to: Optional[str] = None
    gift_to: Optional[str] = None
    disposed_reason: Optional[str] = None
    disposed_date: Optional[datetime] = None
    # ----------------
    id: int
    user_id: int
    # hid 40 shid 41


class AssetsPublic(SQLModel):
    data: list[AssetPublic]
    count: int
