from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.cf_models.schemas import ActivityLog
from app.cf_models.users import UserPublic
from app.cf_models.utils import log_activity
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import Message, NewPassword, Token
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)

router = APIRouter(tags=["login"])


@router.post("/login/access-token")
def login_access_token(
        session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.authenticate(
        session=session, username=form_data.username, password=form_data.password
    )
    if not user:
        # Log activity for incorrect email or password
        log_activity(
            session,
            "Login Attempt",
            f"Login failed due to incorrect email or password for username: {form_data.username}.",
            "login_failed",
            router_prefix="login",
            my_custom_field=f"Login failed due to incorrect email or password for username: {form_data.username}."
        )
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        # Log activity for inactive user
        log_activity(
            session,
            "Login Attempt",
            f"Login failed for inactive user: {user.username}.",
            "login_failed",
            user_id=user.id,
            router_prefix="login",
            my_custom_field=f"Login failed for inactive user: {user.username}.",
        )
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Log successful login
    log_activity(
        session,
        "User Login",
        f"User {user.username} logged in successfully.",
        "login",
        user_id=user.id,
        router_prefix="login",
        my_custom_field=f"User {user.username} logged in successfully.",
    )
    return Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    # Log activity for testing token access
    log_activity(
        session=current_user.db_session,  # assuming `db_session` is part of `current_user`
        log_name="Token Test",
        description=f"User {current_user.username} tested their access token.",
        event="token_test",
        user_id=current_user.id,
        router_prefix="login",
        my_custom_field=f"User {current_user.username} tested their access token.",
    )
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
    """
    Password Recovery
    """
    user = crud.get_user_by_username(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    send_email(
        email_to=user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Password recovery email sent")


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    """
    Reset password
    """
    email = verify_password_reset_token(token=body.token)
    if not email:
        log_activity(
            session=session,
            log_name="Password Reset Attempt",
            description="Password reset failed due to invalid token.",
            event="password_reset_failed",
            router_prefix="login",
            my_custom_field="Password reset failed due to invalid token.",
        )
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.get_user_by_username(session=session, username=email)
    if not user:
        log_activity(
            session=session,
            log_name="Password Reset Attempt",
            description=f"Password reset failed for non-existent user with: {email}.",
            event="password_reset_failed",
            router_prefix="login",
            my_custom_field=f"Password reset failed for non-existent user with: {email}.",
        )
        raise HTTPException(
            status_code=404,
            detail=f"The user with this {email} does not exist in the system.",
        )
    elif not user.is_active:
        log_activity(
            session=session,
            log_name="Password Reset Attempt",
            description=f"Password reset failed for inactive user: {user.username}.",
            event="password_reset_failed",
            user_id=user.id,
            router_prefix="login",
            my_custom_field=f"Password reset failed for inactive user: {user.username}.",
        )
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed_password = get_password_hash(password=body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    # Log successful password reset
    log_activity(
        session=session,
        log_name="Password Reset",
        description=f"User {user.username} successfully reset their password.",
        event="password_reset_successful",
        user_id=user.id,
        router_prefix="login",
        my_custom_field=f"User {user.username} successfully reset their password.",
    )
    return Message(message="Password updated successfully")


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(email: str, session: SessionDep) -> Any:
    """
    HTML Content for Password Recovery
    """
    user = crud.get_user_by_username(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )

    return HTMLResponse(
        content=email_data.html_content, headers={"subject:": email_data.subject}
    )
