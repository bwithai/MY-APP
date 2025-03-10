from sqlmodel import SQLModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    username: str
    password: str
    role: int
    appt: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CommandFunds(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    name: str
    amount: Decimal
    payment_method: str
    date: datetime
    updated_at: datetime = Field(default_factory=datetime.utcnow)
