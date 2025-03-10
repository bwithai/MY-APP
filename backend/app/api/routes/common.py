import pprint
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import col, delete, func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import joinedload
from sqlalchemy.sql import or_, and_

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.cf_models.schemas import Heads, Message, Corps, Divs, Brigades, Units, Apartments, Users, SubHeads, \
    MultiIbnUser
from app.cf_models.common import HeadsPublic, IvyPublic, PublicUnit, PublicBrig, PublicDiv, PublicCor, CreateCorp, \
    CreateDiv, CreateBrig, CreateUnit, UpdateDiv, UpdateBrig, UpdateUnit, ApptUpdate, AllHeadPublic, CreateHead, \
    CreateSubHead, AddIban
from app.cf_models.utils import log_activity

router = APIRouter(prefix="/common", tags=["common"])


# ---------------------------------------------------->>>>> Iban
@router.post("/iban")
def add_iban(
        *, session: SessionDep, current_user: CurrentUser, item_in: AddIban
) -> Any:
    """
    Create new item.
    """
    user = session.get(Users, item_in.user_id)
    if not user:
        log_activity(
            session=session,
            log_name="User Not Found",
            description=f"User {current_user.username} tried to add an IBAN for non-existent user {item_in.user_id}.",
            event="user_not_found",
            user_id=current_user.id,
            router_prefix="iban",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="User not found.")
    if not user.iban:
        user.iban = item_in.ibn
        session.add(user)

    # Query to count the number of IBANs the user already has
    count_query = select(MultiIbnUser).where(MultiIbnUser.user_id == item_in.user_id)
    iban_count = session.exec(count_query).all()

    # Check if the IBAN count exceeds the limit
    if len(iban_count) >= 5:
        log_activity(
            session=session,
            log_name="IBAN Limit Exceeded",
            description=f"User {user.name} has exceeded the limit of 5 IBANs. Attempted to add a new IBAN.",
            event="iban_limit_exceeded",
            user_id=current_user.id,
            router_prefix="iban",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=400, detail=f"User {user.name} has exceeded the limit of 5 IBANs.", )

    iban = MultiIbnUser.model_validate(item_in)
    session.add(iban)
    session.commit()
    session.refresh(iban)
    log_activity(
        session=session,
        log_name="IBAN Added",
        description=f"IBAN {item_in.ibn} added for user {user.name}.",
        event="iban_added",
        user_id=current_user.id,
        router_prefix="iban",
        subject_type="MultiIbnUser",  # Subject is MultiIbnUser as it's the entity related to the IBAN
        subject_id=iban.id  # The ID of the IBAN record
    )
    return Message(message="IBAN Added successfully")


# ---------------------------------------------------->>>>> Heads
@router.get("/heads", response_model=HeadsPublic)
def read_type_heads(
        session: SessionDep, current_user: CurrentUser, type: int
) -> Any:
    """
    Retrieve items.
    """
    statement = (
        select(Heads).where(Heads.type == type)
        .join(Users)
        .options(joinedload(Heads.user))
        .filter(or_(
            Heads.user_id == current_user.id,
            Users.is_superuser == True
        ))
    )

    heads = session.exec(statement).all()
    return HeadsPublic(data=heads, count=len(heads))


@router.post("/heads")
def create_head(
        *, session: SessionDep, current_user: CurrentUser, item_in: CreateHead
) -> Any:
    """
    Create new item.
    """
    if not 1 <= item_in.type <= 2:
        log_activity(
            session=session,
            log_name="Invalid Head Type",
            description=f"User {current_user.username} tried to create a head with an invalid type {item_in.type}.",
            event="invalid_head_type",
            user_id=current_user.id,
            router_prefix="heads",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type must be 1: Inflow or 2: Outflow"
        )
    is_head_in_db = session.exec(select(Heads).where(Heads.heads == item_in.heads)).first()
    if is_head_in_db:
        log_activity(
            session=session,
            log_name="Duplicate Heads",
            description=f"User {current_user.username} tried to create a head which is already in db {item_in.heads}.",
            event="duplicate_head_entry",
            user_id=current_user.id,
            router_prefix="heads",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate Heads not Aloud."
        )

    head = Heads.model_validate(item_in)
    session.add(head)
    session.commit()
    session.refresh(head)
    log_activity(
        session=session,
        log_name="Head Created",
        description=f"Head {head.heads} (ID: {head.id}) created by {current_user.username} with type {head.type}.",
        event="head_created",
        user_id=current_user.id,
        router_prefix="heads",
        subject_type="Heads",  # Subject is the "Heads" entity
        subject_id=head.id  # The ID of the newly created head
    )
    return {"id": head.id, "heads": head.heads, "type": head.type, "user_id": head.user_id}


@router.post("/sub-heads")
def create_subhead(
        *, session: SessionDep, current_user: CurrentUser, item_in: CreateSubHead
) -> Any:
    """
    Create new item.
    """
    if not 1 <= item_in.type <= 2:
        log_activity(
            session=session,
            log_name="Invalid SubHead Type",
            description=f"User {current_user.username} tried to create a subhead with an invalid type {item_in.type}.",
            event="invalid_subhead_type",
            user_id=current_user.id,
            router_prefix="sub-heads",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type must be 1: Inflow or 2: Outflow"
        )
    head = SubHeads.model_validate(item_in)
    session.add(head)
    session.commit()
    session.refresh(head)
    log_activity(
        session=session,
        log_name="SubHead Created",
        description=f"SubHead {head.head} (ID: {head.id}) created by {current_user.username} with type {head.type}.",
        event="subhead_created",
        user_id=current_user.id,
        router_prefix="sub-heads",
        subject_type="SubHeads",  # Subject is the "SubHeads" entity
        subject_id=head.id  # The ID of the newly created subhead
    )
    return Message(message="SubHead Added successfully")


@router.get("/all-heads")
def read_heads(
        session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Retrieve items.
    """
    statement = (
        select(Heads)
        .join(Users)
        .options(joinedload(Heads.user))
        .filter(or_(
            Heads.user_id == current_user.id,
            Users.is_superuser == True
        ))
    )

    heads = session.exec(statement).all()

    result = [
        {"id": head.id, "heads": head.heads, "type": head.type, "admin": head.user.is_superuser if head.user else None,
         "sub_heads": head.sub_heads}
        for head in heads
    ]

    return result


@router.put("/heads/{id}")
def update_head(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
        head_in: AllHeadPublic,
) -> Any:
    """
    Update an item.
    """
    if not 1 <= head_in.type <= 2:
        log_activity(
            session=session,
            log_name="Invalid Head Type",
            description=f"User {current_user.username} tried to update a head with an invalid type {head_in.type}.",
            event="invalid_head_type",
            user_id=current_user.id,
            router_prefix="heads",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type must be 1: Inflow or 2: Outflow"
        )
    head = session.get(Heads, id)
    if not head:
        log_activity(
            session=session,
            log_name="Head Not Found",
            description=f"User {current_user.username} tried to update non-existent head {id}.",
            event="head_not_found",
            user_id=current_user.id,
            router_prefix="heads",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Head not found")

    log_activity(
        session=session,
        log_name="Head Update Initiated",
        description=f"User {current_user.username} initiated an update for head {head.heads} (ID: {head.id}).",
        event="head_update_initiated",
        user_id=current_user.id,
        router_prefix="heads",
        subject_type="Heads",
        subject_id=head.id
    )

    update_dict = head_in.model_dump(exclude_unset=True)
    head.sqlmodel_update(update_dict)
    session.add(head)
    session.commit()
    session.refresh(head)
    log_activity(
        session=session,
        log_name="Head Updated",
        description=f"Head {head.heads} (ID: {head.id}) updated by {current_user.username}.",
        event="head_updated",
        user_id=current_user.id,
        router_prefix="heads",
        subject_type="Heads",
        subject_id=head.id
    )
    return {"id": head.id, "heads": head.heads, "type": head.type, "user_id": head.user_id}


@router.delete("/heads/{id}")
def delete_head(
        session: SessionDep, current_user: CurrentUser, id: int
) -> Message:
    """
    Delete an item.
    """
    item = session.get(Heads, id)
    if not item:
        log_activity(
            session=session,
            log_name="Head Not Found",
            description=f"User {current_user.username} tried to delete head {id}, but it was not found.",
            event="head_not_found",
            user_id=current_user.id,
            router_prefix="heads",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Item not found")
    # Check if the user has permission to delete
    if not current_user.is_superuser and (item.user_id != current_user.id):
        log_activity(
            session=session,
            log_name="Delete Permission Denied",
            description=f"User {current_user.username} tried to delete head {id}, but they do not have permission.",
            event="delete_permission_denied",
            user_id=current_user.id,
            router_prefix="heads",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=400, detail="Not enough permissions")
    log_activity(
        session=session,
        log_name="Head Deletion Initiated",
        description=f"User {current_user.username} initiated deletion of head {item.heads} (ID: {item.id}).",
        event="head_deletion_initiated",
        user_id=current_user.id,
        router_prefix="heads",
        subject_type="Heads",
        subject_id=item.id
    )
    statement = delete(SubHeads).where(col(SubHeads.head_id) == id)
    session.exec(statement)
    session.delete(item)
    session.commit()
    log_activity(
        session=session,
        log_name="Head Deleted",
        description=f"Head {item.heads} (ID: {item.id}) successfully deleted by {current_user.username}.",
        event="head_deleted",
        user_id=current_user.id,
        router_prefix="heads",
        subject_type="Heads",
        subject_id=item.id
    )

    return Message(message="Head deleted successfully")


@router.delete("/ivy-deletion/{flag}/{id}")
def delete_head(
        session: SessionDep, current_user: CurrentUser, flag: str, id: int
) -> Message:
    """
    Delete an item.
    """
    valid_flags = {"Corp", "Division", "Brigade", "Unit"}
    if flag not in valid_flags:
        log_activity(
            session=session,
            log_name="Invalid Flag",
            description=f"User {current_user.username} tried to delete an item with an invalid flag '{flag}'.",
            event="invalid_flag",
            user_id=current_user.id,
            router_prefix="setting hierarchy-deletion",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=400, detail="Invalid flag")

    # Validate the existence of the item before deletion
    if flag == "Corp" and not session.get(Corps, id):
        log_activity(
            session=session,
            log_name="Corp Not Found",
            description=f"User {current_user.username} tried to delete Corp with ID {id}, but it was not found.",
            event="corp_not_found",
            user_id=current_user.id,
            router_prefix="setting hierarchy-deletion",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Corp not found")
    elif flag == "Division" and not session.get(Divs, id):
        log_activity(
            session=session,
            log_name="Division Not Found",
            description=f"User {current_user.username} tried to delete Division with ID {id}, but it was not found.",
            event="division_not_found",
            user_id=current_user.id,
            router_prefix="setting hierarchy-deletion",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Division not found")
    elif flag == "Brigade" and not session.get(Brigades, id):
        log_activity(
            session=session,
            log_name="Brigade Not Found",
            description=f"User {current_user.username} tried to delete Brigade with ID {id}, but it was not found.",
            event="brigade_not_found",
            user_id=current_user.id,
            router_prefix="setting hierarchy-deletion",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Brigade not found")
    elif flag == "Unit" and not session.get(Units, id):
        log_activity(
            session=session,
            log_name="Unit Not Found",
            description=f"User {current_user.username} tried to delete Unit with ID {id}, but it was not found.",
            event="unit_not_found",
            user_id=current_user.id,
            router_prefix="setting hierarchy-deletion",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Unit not found")

    # Log the deletion initiation
    log_activity(
        session=session,
        log_name="Deletion Initiated",
        description=f"User {current_user.username} initiated deletion of {flag} with ID {id}.",
        event=f"{flag.lower()}_deletion_initiated",
        user_id=current_user.id,
        router_prefix="setting hierarchy-deletion",
        subject_type=flag,
        subject_id=id
    )

    # First delete dependent units, brigades, and divs in the correct order to respect foreign keys
    if flag == "Corp":
        session.execute(delete(Units).where(Units.brigade_id == Brigades.id).where(Brigades.div_id == Divs.id).where(
            Divs.corp_id == id))
        session.execute(delete(Brigades).where(Brigades.div_id == Divs.id).where(Divs.corp_id == id))
        session.execute(delete(Divs).where(Divs.corp_id == id))
        session.execute(delete(Corps).where(Corps.id == id))
    elif flag == "Division":
        session.execute(delete(Units).where(Units.brigade_id == Brigades.id).where(Brigades.div_id == id))
        session.execute(delete(Brigades).where(Brigades.div_id == id))
        session.execute(delete(Divs).where(Divs.id == id))
    elif flag == "Brigade":
        session.execute(delete(Units).where(Units.brigade_id == id))
        session.execute(delete(Brigades).where(Brigades.id == id))
    elif flag == "Unit":
        session.execute(delete(Units).where(Units.id == id))

    session.commit()
    log_activity(
        session=session,
        log_name="Deletion Successful",
        description=f"User {current_user.username} successfully deleted {flag} with ID {id} and its related entities.",
        event=f"{flag.lower()}_deleted",
        user_id=current_user.id,
        router_prefix="setting hierarchy-deletion",
        subject_type=flag,
        subject_id=id
    )

    return Message(message=f"{flag} and all related entities deleted successfully.")


@router.delete("/sub-heads/{id}")
def delete_head(
        session: SessionDep, current_user: CurrentUser, id: int
) -> Message:
    """
    Delete an item.
    """
    item = session.get(SubHeads, id)
    if not item:
        log_activity(
            session=session,
            log_name="SubHead Not Found",
            description=f"User {current_user.username} tried to delete SubHead with ID {id}, but it was not found.",
            event="subhead_not_found",
            user_id=current_user.id,
            router_prefix="sub-heads",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    log_activity(
        session=session,
        log_name="SubHead Deletion Successful",
        description=f"User {current_user.username} successfully deleted SubHead with ID {id}.",
        event="subhead_deleted",
        user_id=current_user.id,
        router_prefix="sub-heads",
        subject_type="SubHeads",
        subject_id=id
    )
    return Message(message="SubHead deleted successfully")


# ---------------------------------------------------->>>>> Appointments
@router.get("/appt")
def read_appt(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve Appointments.
    """
    appointments = session.query(Apartments).all()

    # Return the results as a list of dictionaries
    result = [{"id": head.id, "name": head.name, "description": head.description} for head in appointments]

    return result


@router.post("/appt", )
def create_appt(
        *, session: SessionDep, current_user: CurrentUser, item_in: ApptUpdate  # same field for create
) -> Any:
    """
    Create new item.
    """
    head = Apartments.model_validate(item_in)
    session.add(head)
    session.commit()
    session.refresh(head)
    log_activity(
        session=session,
        log_name="Appointment Created",
        description=f"Appointment '{item_in.name}' created by user {current_user.username}. ID: {head.id}.",
        event="appointment_created",
        user_id=current_user.id,
        router_prefix="appt",
        subject_type="Appointments",
        subject_id=head.id
    )
    return {"id": head.id, "name": head.name, "description": head.description}


@router.put("/appt/{id}")
def update_appt(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: int,
        item_in: ApptUpdate,
) -> Any:
    """
    Update an item.
    """
    head = session.get(Apartments, id)
    if not head:
        log_activity(
            session=session,
            log_name="Appointment Not Found",
            description=f"User {current_user.username} attempted to update appointment with ID {id}, but it was not found.",
            event="appointment_not_found",
            user_id=current_user.id,
            router_prefix="appt",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Item not found")

    update_dict = item_in.model_dump(exclude_unset=True)
    head.sqlmodel_update(update_dict)
    session.add(head)
    session.commit()
    session.refresh(head)
    log_activity(
        session=session,
        log_name="Appointment Updated",
        description=f"Appointment '{head.name}' (ID: {id}) updated by user {current_user.username}.",
        event="appointment_updated",
        user_id=current_user.id,
        router_prefix="appt",
        subject_type="Appointments",
        subject_id=head.id
    )
    return {"id": head.id, "name": head.name, "description": head.description}


@router.delete("/appt/{id}")
def delete_appt(
        session: SessionDep, current_user: CurrentUser, id: int
) -> Message:
    """
    Delete an item.
    """
    item = session.get(Apartments, id)
    if not item:
        log_activity(
            session=session,
            log_name="Appointment Not Found",
            description=f"User {current_user.username} tried to delete appointment with ID {id}, but it was not found.",
            event="appointment_not_found",
            user_id=current_user.id,
            router_prefix="appt",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    log_activity(
        session=session,
        log_name="Appointment Deleted",
        description=f"Appointment '{item.name}' (ID: {id}) deleted by user {current_user.username}.",
        event="appointment_deleted",
        user_id=current_user.id,
        router_prefix="appt",
        subject_type="Appointments",
        subject_id=item.id
    )

    return Message(message="Item deleted successfully")


def get_ivy(session):
    # Fetch the corps with related divs, brigades, and units
    statement = (
        select(Corps)
        .options(
            selectinload(Corps.divs)  # Load related Divs
            .selectinload(Divs.brigades)  # Load related Brigades
            .selectinload(Brigades.units)  # Load related Units
        )
    )

    corps_list = session.exec(statement).all()

    # Map the fetched data to Pydantic models
    def map_unit_to_public(unit):
        return PublicUnit(id=unit.id, name=unit.name)

    def map_brigade_to_public(brigade):
        return PublicBrig(
            id=brigade.id,
            name=brigade.name,
            units=[map_unit_to_public(unit) for unit in brigade.units]
        )

    def map_div_to_public(div):
        return PublicDiv(
            id=div.id,
            name=div.name,
            brigades=[map_brigade_to_public(brigade) for brigade in div.brigades]
        )

    def map_corp_to_public(corp):
        return PublicCor(
            id=corp.id,
            name=corp.name,
            divs=[map_div_to_public(div) for div in corp.divs]
        )

    # Map each corp to its public schema
    mapped_corps = [map_corp_to_public(corp) for corp in corps_list]
    return mapped_corps


@router.get("/ivy", response_model=IvyPublic)
def read_ivy(
        session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Retrieve corps along with their associated divisions, brigades, and units.
    """
    mapped_corps = get_ivy(session)
    # Return the response with count and mapped data
    return IvyPublic(data=mapped_corps)


@router.post(
    "/corp", response_model=IvyPublic
)
def create_corp(*, session: SessionDep, data: CreateCorp, current_user: CurrentUser) -> Any:
    """
    Create a new Corp entity.
    """
    try:
        # Create a new Corp entity
        new_corp = Corps(name=data.name)
        session.add(new_corp)
        session.commit()
        session.refresh(new_corp)

        # Log the creation of the new Corp
        log_activity(
            session=session,
            log_name="Corp Created",
            description=f"User {current_user.username} created a new Corp named {new_corp.name}.",
            event="corp_created",
            user_id=current_user.id,
            router_prefix="corp",
            subject_type="Corps",
            subject_id=new_corp.id
        )

        return IvyPublic(data=get_ivy(session))

    except Exception as e:
        # If an error occurs, log the error
        log_activity(
            session=session,
            log_name="Corp Creation Failed",
            description=f"User {current_user.username} failed to create a Corp due to error: {str(e)}",
            event="corp_creation_failed",
            user_id=current_user.id,
            router_prefix="corp",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=400, detail="Failed to create Corp")


@router.post(
    "/div", response_model=IvyPublic
)
def create_div(*, session: SessionDep, data: CreateDiv, current_user: CurrentUser) -> Any:
    """
    Create a new Division (Div).
    """
    try:
        # Create a new Div entity
        new_div = Divs(
            name=data.name,
            corp_id=data.corp_id
        )
        session.add(new_div)
        session.commit()
        session.refresh(new_div)

        # Log the creation of the new Division
        log_activity(
            session=session,
            log_name="Division Created",
            description=f"User {current_user.username} created a new Division named {new_div.name} under Corp ID {new_div.corp_id}.",
            event="div_created",
            user_id=current_user.id,
            router_prefix="div",
            subject_type="Divs",
            subject_id=new_div.id
        )

        return IvyPublic(data=get_ivy(session))

    except Exception as e:
        # If an error occurs, log the error
        log_activity(
            session=session,
            log_name="Division Creation Failed",
            description=f"User {current_user.username} failed to create a Division due to error: {str(e)}",
            event="div_creation_failed",
            user_id=current_user.id,
            router_prefix="div",
            subject_type="User",
            subject_id=current_user.id
        )
        raise HTTPException(status_code=400, detail="Failed to create Division")


@router.put(
    "/div", response_model=IvyPublic
)
def update_div(*, session: SessionDep, data: UpdateDiv, current_user: CurrentUser) -> Any:
    """
    Update an existing division's corp_id.
    """
    # Fetch the division by ID
    statement = select(Divs).where(Divs.id == data.id)
    item = session.exec(statement).first()

    # Handle the case where the division is not found
    if not item:
        raise HTTPException(status_code=404, detail=f"Division with id {data.id} not found.")

    # Log the old value of the corp_id
    old_corp_id = item.corp_id

    # Update the division's corp_id
    item.corp_id = data.corp_id
    session.add(item)
    session.commit()
    session.refresh(item)

    log_activity(
        session=session,
        log_name="Division Updated",
        description=f"User {current_user.username} updated Division with id {item.id}. "
                    f"Corp ID changed from {old_corp_id} to {item.corp_id}.",
        event="div_updated",
        user_id=current_user.id,
        router_prefix="div",
        subject_type="Divs",
        subject_id=item.id
    )

    # Return the updated IvyPublic structure
    return IvyPublic(data=get_ivy(session))


@router.post(
    "/brigade", response_model=IvyPublic
)
def create_brigade(*, session: SessionDep, data: CreateBrig, current_user: CurrentUser) -> Any:
    """
    Create new user.
    """
    new_brigade = Brigades(
        name=data.name,
        div_id=data.div_id
    )
    session.add(new_brigade)
    session.commit()
    session.refresh(new_brigade)
    # Log the creation activity
    log_activity(
        session=session,
        log_name="Brigade Created",
        description=f"User {current_user.username} created a new Brigade with id {new_brigade.id}. "
                    f"Brigade name: {new_brigade.name}, Division ID: {new_brigade.div_id}.",
        event="brigade_created",
        user_id=current_user.id,
        router_prefix="brigade",
        subject_type="Brigades",
        subject_id=new_brigade.id
    )

    return IvyPublic(data=get_ivy(session))


@router.put(
    "/brigade", response_model=IvyPublic
)
def update_brigade(*, session: SessionDep, data: UpdateBrig, current_user: CurrentUser) -> Any:
    """
    Update brigade's division and associated division's corp.
    """
    # Fetch the brigade by ID
    pprint.pprint(data)
    brigade_statement = select(Brigades).where(Brigades.id == data.id)
    brigade = session.exec(brigade_statement).first()

    # Handle the case where the brigade is not found
    if not brigade:
        raise HTTPException(status_code=404, detail=f"Brigade with id {data.id} not found.")

    # Fetch the division by ID
    div_statement = select(Divs).where(Divs.id == data.div_id)
    div = session.exec(div_statement).first()

    # Handle the case where the division is not found
    if not div:
        raise HTTPException(status_code=404, detail=f"Division with id {data.div_id} not found.")

    # Store the old values for logging
    old_div_id = brigade.div_id
    old_corp_id = div.corp_id

    # Update the brigade's division ID
    brigade.div_id = data.div_id

    # Update the division's corp ID
    div.corp_id = data.corp_id

    # Persist changes
    session.add(brigade)
    session.add(div)
    session.commit()

    # Refresh entities to reflect changes
    session.refresh(brigade)
    session.refresh(div)

    # Log the activity
    log_activity(
        session=session,
        log_name="Brigade Updated",
        description=f"User {current_user.username} updated Brigade with id {brigade.id}. "
                    f"Brigade division changed from {old_div_id} to {brigade.div_id}. "
                    f"Division corp changed from {old_corp_id} to {div.corp_id}.",
        event="brigade_updated",
        user_id=current_user.id,
        router_prefix="brigade",
        subject_type="Brigades",
        subject_id=brigade.id
    )

    # Return the updated IvyPublic structure
    return IvyPublic(data=get_ivy(session))


@router.post(
    "/unit", response_model=IvyPublic
)
def create_unit(*, session: SessionDep, data: CreateUnit, current_user: CurrentUser) -> Any:
    """
    Create new user.
    """
    new_unit = Units(
        name=data.name,
        brigade_id=data.brigade_id
    )
    session.add(new_unit)
    session.commit()
    session.refresh(new_unit)
    # Log the activity
    log_activity(
        session=session,
        log_name="Unit Created",
        description=f"User {current_user.username} created Unit with id {new_unit.id}. "
                    f"Unit name: {new_unit.name}, Brigade ID: {new_unit.brigade_id}",
        event="unit_created",
        user_id=current_user.id,
        router_prefix="unit",
        subject_type="Units",
        subject_id=new_unit.id
    )

    return IvyPublic(data=get_ivy(session))


@router.put(
    "/unit", response_model=IvyPublic
)
def update_unit(*, session: SessionDep, data: UpdateUnit, current_user: CurrentUser) -> Any:
    """
    Update a Unit's brigade, brigade's division, and division's corp.
    """
    # Fetch the Unit by ID
    unit_statement = select(Units).where(Units.id == data.id)
    unit = session.exec(unit_statement).first()

    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit with id {data.id} not found.")

    # Fetch the Brigade by ID
    brigade_statement = select(Brigades).where(Brigades.id == data.brigade_id)
    brigade = session.exec(brigade_statement).first()

    if not brigade:
        raise HTTPException(status_code=404, detail=f"Brigade with id {data.brigade_id} not found.")

    # Fetch the Division by ID
    div_statement = select(Divs).where(Divs.id == data.div_id)
    div = session.exec(div_statement).first()

    if not div:
        raise HTTPException(status_code=404, detail=f"Division with id {data.div_id} not found.")

    # Log the changes before updating
    log_activity(
        session=session,
        log_name="Unit Updated",
        description=f"User {current_user.username} updated Unit {unit.id} with name {unit.name}. "
                    f"Updated brigade_id: {unit.brigade_id} -> {data.brigade_id}, "
                    f"division_id: {brigade.div_id} -> {data.div_id}, corp_id: {div.corp_id} -> {data.corp_id}",
        event="unit_updated",
        user_id=current_user.id,
        router_prefix="unit",
        subject_type="Units",
        subject_id=unit.id
    )

    # Update the Unit's Brigade ID
    unit.brigade_id = data.brigade_id

    # Update the Brigade's Division ID
    brigade.div_id = data.div_id

    # Update the Division's Corp ID
    div.corp_id = data.corp_id

    # Persist changes
    session.add(unit)
    session.add(brigade)
    session.add(div)
    session.commit()

    # Refresh entities to reflect changes
    session.refresh(unit)
    session.refresh(brigade)
    session.refresh(div)

    # Return the updated IvyPublic structure
    return IvyPublic(data=get_ivy(session))
