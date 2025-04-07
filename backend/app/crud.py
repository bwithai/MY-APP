from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.cf_models.users import UserCreate, UserUpdate
from app.cf_models.schemas import Users
from app.utils import get_pakistan_timestamp


def create_user(*, session: Session, user_create: UserCreate) -> Users:
    # Validate and hash the password
    hashed_password = get_password_hash(user_create.password)

    # Create a new Users object with all necessary fields
    db_obj = Users(
        username=''.join(user_create.name.split()),
        name=user_create.name,
        email=user_create.email,
        password=hashed_password,
        created_at=get_pakistan_timestamp(),  # Set created_at to the current timestamp
        updated_at=get_pakistan_timestamp(),  # Set updated_at
        is_active=user_create.is_active,
        is_superuser=user_create.is_superuser,
        corp_id=user_create.corp_id,
        appt=user_create.appt,
        div_id=user_create.div_id if user_create.div_id else None,
        brigade_id=user_create.brigade_id if user_create.brigade_id else None,
        unit_id=user_create.unit_id if user_create.unit_id else None
    )
    # Add the user object to the session and commit it
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)

    return db_obj


def update_user(*, session: Session, db_user: Users, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_username(*, session: Session, username: str) -> Users | None:
    statement = select(Users).where(Users.username == username)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, username: str, password: str) -> Users | None:
    db_user = get_user_by_username(session=session, username=username)
    if not db_user:
        return None
    if not verify_password(password, db_user.password):
        return None
    return db_user


# def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
#     db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
#     session.add(db_item)
#     session.commit()
#     session.refresh(db_item)
#     return db_item
