from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field


# Properties to return via API, id is always required
class LogPublic(SQLModel):
    # Relationship
    user: Optional[str] = None
    # ----------------
    log_name: Optional[str] = Field(default=None, index=True)
    description: Optional[str] = None
    subject_type: Optional[str] = Field(default=None, index=True)
    event: Optional[str] = None
    properties: Optional[str] = None
    my_custom_field: Optional[str] = None
    created_at: Optional[datetime] = None
    # ----------------
    id: int
    user_id: int
    # hid 40 shid 41


class LogsPublic(SQLModel):
    data: list[LogPublic]
    count: int
