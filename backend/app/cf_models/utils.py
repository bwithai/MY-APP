# Generic message
import json
from typing import Optional

from sqlmodel import SQLModel

from app.api.deps import SessionDep
from app.cf_models.schemas import ActivityLog


class Message(SQLModel):
    message: str


def log_activity(
        session: SessionDep,
        log_name: str,
        description: str,
        event: str,
        user_id: Optional[int] = None,
        router_prefix: Optional[str] = None,
        my_custom_field: Optional[str] = None,
        subject_type: Optional[str] = "User",
        subject_id: Optional[int] = None,
        item_in: Optional[dict] = None
) -> None:
    """
    Helper function to log activity in the system.

    This function logs activities with context such as the router prefix, custom fields,
    and the user involved in the activity, ensuring a detailed log entry.
    """
    # Define the context based on the router prefix
    context = f"{router_prefix or 'general'} - {log_name}"

    # Prepare properties to store in a structured way (e.g., as a JSON object)
    properties = {
        "context": context,
    }

    # Create the activity log entry
    activity_log = ActivityLog(
        log_name=log_name,
        description=description,
        subject_type=subject_type,  # Can be "User" or "Balances" based on the action
        subject_id=subject_id if subject_type != "User" else user_id,  # Could be the user_id or balance_id
        event=event,
        causer_type="User",
        causer_id=user_id,
        properties=json.dumps(properties),  # Store properties as a JSON string
        my_custom_field=my_custom_field if my_custom_field else description,  # Log custom field if provided
    )

    # Add the activity log to the session and commit it
    session.add(activity_log)
    session.commit()
