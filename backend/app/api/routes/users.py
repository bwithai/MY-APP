import pprint
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, delete, func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.cf_models.utils import (
    Message, log_activity
)
from app.cf_models.schemas import Users, Balances, ActivityLog, MultiIbnUser
from app.cf_models.users import (
    UserCreate,
    UserPublic,
    UsersPublic,
    UserRegister,
    UserUpdate,
    UserUpdateMe,
    UpdatePassword
)
from app.utils import generate_new_account_email, send_email

router = APIRouter(prefix="/users", tags=["users"])

import json
from typing import Optional


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(
        session: SessionDep,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 100,
        search: str = ""
) -> Any:
    """
    Retrieve users.
    """
    statement = select(Users)

    if search:
        statement = statement.where(Users.username.ilike(f"%{search}%"))

        # Get the total count of matching records
    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    # Apply pagination
    statement = statement.offset(skip).limit(limit)

    users = [
        {
            **user.dict(),
            "corp": user.corp.name if user.corp else None,  # Extract name from corp
            "divs": user.divs.name if user.divs else None,  # Extract name from divs
            "brigade": user.brigade.name if user.brigade else None,  # Extract name from brigade
            "unit": user.unit.name if user.unit else None,  # Extract name from unit
        }
        for user in session.exec(statement).all()
    ]

    return UsersPublic(data=users, count=count)


@router.get("/iban/{user_id}")
def financial_overview(
        session: SessionDep, current_user: CurrentUser, user_id: int | None
) -> Any:
    query = select(MultiIbnUser).where(MultiIbnUser.user_id == user_id)
    ibans = session.exec(query).all()
    response = [
        {"id": iban.id, "iban": iban.ibn}
        for iban in ibans
    ]
    return response


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = crud.get_user_by_username(session=session, username=user_in.username)
    if user:
        # Log the failed user creation attempt due to existing username
        log_activity(
            session=session,
            log_name="User Creation Attempt",
            description=f"Attempted to create user with existing username: '{user_in.username}'.",
            event="user_creation_failed_duplicate",
            user_id=None,  # No user to associate with the failed creation
            router_prefix="users",
            my_custom_field=f"Attempted to create user with existing username: '{user_in.username}'.",
        )
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )

    user = crud.create_user(session=session, user_create=user_in)
    user_balance = Balances(user_id=user.id)
    session.add(user_balance)
    session.commit()
    session.refresh(user_balance)

    # Log the successful user creation event
    log_activity(
        session=session,
        log_name="User Creation",
        description=f"User {user.username} created successfully.",
        event="user_creation_success",
        user_id=user.id,
        router_prefix="users",
        my_custom_field=f"User {user.username} created successfully.",
        item_in=user_in.dict(),

    )

    # Prepare the response dictionary
    response = {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "updated_password_status": user.updated_password_status,
        "corp": user.corp.name if user.corp else None,  # Extract name from corp
        "divs": user.divs.name if user.divs else None,  # Extract name from divs
        "brigade": user.brigade.name if user.brigade else None,  # Extract name from brigade
        "unit": user.unit.name if user.unit else None,  # Extract name from unit
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }

    # Return the transformed response
    return response


@router.patch("/me", response_model=UserPublic)
def update_user_me(
        *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """

    if user_in.username:
        existing_user = crud.get_user_by_username(session=session, username=user_in.username)
        if existing_user and existing_user.id != current_user.id:
            log_activity(
                session=session,
                log_name="User Update Failed",
                description=f"Username conflict: Another user with username '{user_in.email}' already exists.",
                event="user_update_failed_username_conflict",
                user_id=current_user.id,
                router_prefix="users",
                my_custom_field=f"Username conflict: Another user with username '{user_in.email}' already exists.",
            )
            raise HTTPException(
                status_code=409, detail="User with this username already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    # Log successful update
    log_activity(
        session=session,
        log_name="User Update",
        description=f"User {current_user.username} updated successfully.",
        event="user_update_success",
        user_id=current_user.id,
        router_prefix="users",
        my_custom_field=f"User {current_user.username} updated successfully.",
    )

    response = {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "updated_password_status": current_user.updated_password_status,
        "corp": current_user.corp.name if current_user.corp else None,  # Extract name from corp
        "divs": current_user.divs.name if current_user.divs else None,  # Extract name from divs
        "brigade": current_user.brigade.name if current_user.brigade else None,  # Extract name from brigade
        "unit": current_user.unit.name if current_user.unit else None,  # Extract name from unit
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
    }

    # Return the transformed response
    return response


@router.patch("/me/password", response_model=Message)
def update_password_me(
        *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.password):
        log_activity(
            session=session,
            log_name="Password Update Failed",
            description=f"Incorrect current password attempt for user {current_user.username}.",
            event="password_update_failed_incorrect_current_password",
            user_id=current_user.id,
            router_prefix="users",
        )
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        log_activity(
            session=session,
            log_name="Password Update Failed",
            description=f"User {current_user.username} tried to set the same new password.",
            event="password_update_failed_same_password",
            user_id=current_user.id,
            router_prefix="users"
        )
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.password = hashed_password
    current_user.updated_password_status = True
    session.add(current_user)
    session.commit()

    log_activity(
        session=session,
        log_name="Password Update",
        description=f"User {current_user.username} updated their password successfully.",
        event="password_update_success",
        user_id=current_user.id,
        router_prefix="users"
    )
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    response = {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "updated_password_status": current_user.updated_password_status,
        "corp": current_user.corp.name if current_user.corp else None,  # Extract name from corp
        "divs": current_user.divs.name if current_user.divs else None,  # Extract name from divs
        "brigade": current_user.brigade.name if current_user.brigade else None,  # Extract name from brigade
        "unit": current_user.unit.name if current_user.unit else None,  # Extract name from unit
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
    }

    # Return the transformed response
    return response


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    log_activity(
        session=session,
        log_name="User Deletion Attempt",
        description=f"User {current_user.username} requested account deletion.",
        event="user_deletion_attempt",
        user_id=current_user.id,
        router_prefix="users"
    )
    if current_user.is_superuser:
        log_activity(
            session=session,
            log_name="User Deletion Failed",
            description=f"Superuser {current_user.username} attempted to delete their account, but this action is not allowed.",
            event="user_deletion_failed_superuser",
            user_id=current_user.id,
            router_prefix="users"
        )
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    # If want also delete is activities
    # statement = delete(Item).where(col(Item.owner_id) == current_user.id)
    # session.exec(statement)  # type: ignore
    session.delete(current_user)
    session.commit()
    log_activity(
        session=session,
        log_name="User Deleted",
        description=f"User {current_user.username} was deleted successfully.",
        event="user_deletion_success",
        user_id=current_user.id,
        router_prefix="users"
    )
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    log_activity(
        session=session,
        log_name="User Registration Attempt",
        description=f"User {user_in.username} attempted to register.",
        event="user_registration_attempt",
        user_id=None,  # No user yet, as the registration is still in progress
        router_prefix="users"
    )
    user = crud.get_user_by_username(session=session, username=user_in.username)
    if user:
        log_activity(
            session=session,
            log_name="User Registration Failed",
            description=f"Registration failed for {user_in.username}, username already exists.",
            event="user_registration_failed_existing_username",
            user_id=None,
            router_prefix="users"
        )
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = crud.create_user(session=session, user_create=user_create)
    log_activity(
        session=session,
        log_name="User Registered",
        description=f"User {user.username} registered successfully.",
        event="user_registration_success",
        user_id=user.id,
        router_prefix="users"
    )
    response = {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "updated_password_status": user.updated_password_status,
        "corp": user.corp.name if user.corp else None,  # Extract name from corp
        "divs": user.divs.name if user.divs else None,  # Extract name from divs
        "brigade": user.brigade.name if user.brigade else None,  # Extract name from brigade
        "unit": user.unit.name if user.unit else None,  # Extract name from unit
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }

    # Return the transformed response
    return response


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
        user_id: int, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    log_activity(
        session=session,
        log_name="Read User Attempt",
        description=f"User {current_user.username} is attempting to read user data for user ID {user_id}.",
        event="read_user_attempt",
        user_id=current_user.id,
        router_prefix="users"
    )
    user = session.get(Users, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        log_activity(
            session=session,
            log_name="Access Denied",
            description=f"User {current_user.username} tried to access data for user ID {user_id}, but does not have sufficient privileges.",
            event="read_user_failed_access_denied",
            user_id=current_user.id,
            router_prefix="users"
        )
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )

    log_activity(
        session=session,
        log_name="User Read Success",
        description=f"User {current_user.username} successfully accessed user data for user ID {user_id}.",
        event="read_user_success",
        user_id=current_user.id,
        router_prefix="users"
    )
    response = {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "updated_password_status": user.updated_password_status,
        "corp": user.corp.name if user.corp else None,  # Extract name from corp
        "divs": user.divs.name if user.divs else None,  # Extract name from divs
        "brigade": user.brigade.name if user.brigade else None,  # Extract name from brigade
        "unit": user.unit.name if user.unit else None,  # Extract name from unit
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }

    # Return the transformed response
    return response


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
        *,
        session: SessionDep,
        user_id: int,
        user_in: UserUpdate,
) -> Any:
    """
    Update a user.
    """
    log_activity(
        session=session,
        log_name="Update User Attempt",
        description=f"Superuser is attempting to update user with ID {user_id}.",
        event="update_user_attempt",
        user_id=None,  # This action is performed by the superuser
        router_prefix="users"
    )

    db_user = session.get(Users, user_id)
    if not db_user:
        log_activity(
            session=session,
            log_name="User Not Found",
            description=f"User with ID {user_id} not found.",
            event="update_user_failed_user_not_found",
            user_id=None,  # No user yet
            router_prefix="users"
        )
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.username:
        existing_user = crud.get_user_by_username(session=session, username=user_in.username)
        if existing_user and existing_user.id != user_id:
            log_activity(
                session=session,
                log_name="Username Conflict",
                description=f"Username {user_in.username} already exists for a different user.",
                event="update_user_failed_username_conflict",
                user_id=None,  # Action taken by the superuser
                router_prefix="users"
            )
            raise HTTPException(
                status_code=409, detail="User with this username already exists"
            )

    db_user = crud.update_user(session=session, db_user=db_user, user_in=user_in)
    log_activity(
        session=session,
        log_name="User Update Success",
        description=f"User with ID {user_id} has been successfully updated.",
        event="update_user_success",
        user_id=None,  # Superuser performed this action
        router_prefix="users"
    )
    response = {
        "id": db_user.id,
        "name": db_user.name,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role,
        "status": db_user.status,
        "is_active": db_user.is_active,
        "is_superuser": db_user.is_superuser,
        "updated_password_status": db_user.updated_password_status,
        "corp": db_user.corp.name if db_user.corp else None,  # Extract name from corp
        "divs": db_user.divs.name if db_user.divs else None,  # Extract name from divs
        "brigade": db_user.brigade.name if db_user.brigade else None,  # Extract name from brigade
        "unit": db_user.unit.name if db_user.unit else None,  # Extract name from unit
        "created_at": db_user.created_at,
        "updated_at": db_user.updated_at,
    }
    return response


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
        session: SessionDep, current_user: CurrentUser, user_id: int
) -> Message:
    """
    Delete a user.
    """
    log_activity(
        session=session,
        log_name="Delete User Attempt",
        description=f"Superuser is attempting to delete user with ID {user_id}.",
        event="delete_user_attempt",
        user_id=current_user.id,  # This action is performed by the superuser
        router_prefix="users"
    )
    user = session.get(Users, user_id)
    if not user:
        log_activity(
            session=session,
            log_name="User Not Found",
            description=f"User with ID {user_id} not found for deletion.",
            event="delete_user_failed_user_not_found",
            user_id=current_user.id,  # Action taken by the superuser
            router_prefix="users"
        )
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        log_activity(
            session=session,
            log_name="Superuser Deletion Attempt",
            description=f"Superuser {current_user.username} attempted to delete themselves.",
            event="delete_user_failed_superuser_self_deletion",
            user_id=current_user.id,
            router_prefix="users"
        )
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    statement = delete(Balances).where(col(Balances.user_id) == user_id)
    session.exec(statement)  # type: ignore
    session.delete(user)
    session.commit()
    log_activity(
        session=session,
        log_name="User Deleted Successfully",
        description=f"User with ID {user_id} has been deleted successfully.",
        event="delete_user_success",
        user_id=current_user.id,  # Action performed by the superuser
        router_prefix="users"
    )
    return Message(message="User deleted successfully")
