from typing import List, Optional

from pydantic import BaseModel
from sqlmodel import SQLModel, Field


class ApptUpdate(SQLModel):
    name: str = Field(..., nullable=False)  # Required field
    description: Optional[str] = None  # Optional text field

class AllHeadPublic(SQLModel):
    heads: str
    type: int  # Optional text field

class CreateHead(AllHeadPublic):
    user_id: int

class SubHeadPublic(SQLModel):
    id: Optional[int]
    subheads: str

class SubHeadBase(SQLModel):
    subheads: str

class CreateSubHead(SubHeadBase):
    user_id: int
    head_id: int
    type: int

class AddIban(SQLModel):
    user_id: int
    ibn: Optional[str] = None


# Shared properties
class HeadBase(SQLModel):
    heads: str = Field(default=None, min_length=1, max_length=255)


class HeadPublic(HeadBase):
    id: int
    sub_heads: List[SubHeadPublic]


class HeadsPublic(SQLModel):
    data: list[HeadPublic]
    count: int


class PublicUnit(SQLModel):
    id: int
    name: str


class PublicBrig(SQLModel):
    id: int
    name: str
    units: List[PublicUnit]


class PublicDiv(SQLModel):
    id: int
    name: str
    brigades: List[PublicBrig]


class PublicCor(SQLModel):
    id: int
    name: str
    divs: List[PublicDiv]


class IvyPublic(SQLModel):
    data: list[PublicCor]


class CreateCorp(BaseModel):
    name: str


class CreateDiv(BaseModel):
    name: str
    corp_id: int


class UpdateDiv(BaseModel):
    id: int
    corp_id: int


class CreateBrig(BaseModel):
    name: str
    div_id: int


class UpdateBrig(BaseModel):
    id: int
    div_id: int
    corp_id: int


class CreateUnit(BaseModel):
    name: str
    brigade_id: int

class UpdateUnit(BaseModel):
    id: int
    div_id: int
    corp_id: int
    brigade_id: int
