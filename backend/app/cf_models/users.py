from typing import Optional

from pydantic import EmailStr
from sqlmodel import SQLModel, create_engine, Field, Session


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: Optional[bool] = True  # Default to False if None
    is_superuser: Optional[bool] = False  # Default to False if None
    name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    username: str | None = Field(default=None, max_length=255)
    name: str | None = Field(default=None, max_length=255)
    appt: Optional[str] = None
    password: str = Field(min_length=8, max_length=40)
    corp_id: Optional[int] = None
    div_id: Optional[int] = None
    brigade_id: Optional[int] = None
    unit_id: Optional[int] = None


class UserRegister(SQLModel):
    corp_id: Optional[int]
    div_id: Optional[int]
    brigade_id: Optional[int]
    unit_id: Optional[int]
    appt: Optional[str] = Field(min_length=2, max_length=40)
    email: EmailStr = Field(max_length=255)
    username: str | None = Field(default=None, max_length=255)
    password: str = Field(min_length=8, max_length=40)
    name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    username: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    username: str | None = Field(default=None, max_length=255)
    name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: int
    iban: Optional[str] = None
    username: str | None = Field(default=None, max_length=255)
    updated_password_status: bool = Field(default=False)
    corp: Optional[str] = None
    divs: Optional[str] = None
    brigade: Optional[str] = None
    unit: Optional[str] = None
    appt: Optional[str] = None



class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int
