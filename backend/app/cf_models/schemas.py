from sqlmodel import SQLModel, Field, Relationship, Column, DECIMAL, TEXT
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from app.utils import get_pakistan_timestamp  # Make sure this function is imported correctly


# Generic message
class Message(SQLModel):
    message: str


class Users(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    name: str
    username: Optional[str] = None
    email: str
    role: Optional[int] = None
    status: bool = Field(default=True)  # Default status is 1 (active)
    email_verified_at: Optional[datetime] = None
    password: str
    remember_token: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)  # Removed parentheses
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})
    location_id: Optional[int] = None
    deleted_at: Optional[datetime] = None
    corp_id: Optional[int] = Field(foreign_key="corps.id", nullable=True)  # Foreign key to Corps
    div_id: Optional[int] = Field(foreign_key="divs.id", nullable=True)  # Foreign key to Divs
    brigade_id: Optional[int] = Field(foreign_key="brigades.id", nullable=True)  # Foreign key to Brigades table
    unit_id: Optional[int] = Field(foreign_key="units.id", nullable=True)  # Foreign key to Units table
    appt: Optional[str] = None
    iban: Optional[str] = None
    update_password_status: bool = Field(default=False)  # Default to 0 (not updated)
    is_active: bool = True
    is_superuser: bool = False

    # Define the relationship's
    inflows: List["CommandFunds"] = Relationship(back_populates="user")
    heads: List["Heads"] = Relationship(back_populates="user")
    sub_heads: List["SubHeads"] = Relationship(back_populates="user")
    expenses: List["Expenses"] = Relationship(back_populates="user")
    assets: List["Assets"] = Relationship(back_populates="user")
    balances: List["Balances"] = Relationship(back_populates="user")
    corp: Optional["Corps"] = Relationship(back_populates="users")
    divs: Optional["Divs"] = Relationship(back_populates="users")  # Relationship with Divs
    brigade: Optional["Brigades"] = Relationship(back_populates="users")  # Relationship with Brigades
    unit: Optional["Units"] = Relationship(back_populates="users")  # Relationship with Units
    investments: List["Investments"] = Relationship(back_populates="user")
    investment_histories: List["InvestmentHistory"] = Relationship(back_populates="user")
    liabilities: List["Liabilities"] = Relationship(back_populates="user")
    liability_balances: List["LiabilityBalances"] = Relationship(back_populates="user")
    ibans: List["MultiIbnUser"] = Relationship(back_populates="user")
    logs: List["ActivityLog"] = Relationship(back_populates="user")


class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_log"
    id: int = Field(default=None, primary_key=True, nullable=False)
    log_name: Optional[str] = Field(default=None, index=True)
    description: Optional[str] = Field(default=None, sa_column=Column(TEXT, nullable=True))
    subject_type: Optional[str] = Field(default=None, index=True)
    event: Optional[str] = None
    subject_id: Optional[int] = None
    causer_type: Optional[str] = Field(default=None, index=True)
    causer_id: Optional[int] = Field(foreign_key="users.id", nullable=True)
    properties: Optional[str] = None
    batch_uuid: Optional[str] = Field(default=None, max_length=36)
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)  # Removed parentheses
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})
    my_custom_field: Optional[str] = None

    # Define relationship back to User
    user: Optional["Users"] = Relationship(back_populates="logs")


class MultiIbnUser(SQLModel, table=True):
    __tablename__ = "multi_ibn_user"
    id: int = Field(default=None, primary_key=True, nullable=False)
    user_id: int = Field(foreign_key="users.id", nullable=True)  # Link to the User table
    ibn: Optional[str] = None  # Assuming it's a string field for the IBN
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})

    # Define relationship back to User
    user: Optional["Users"] = Relationship(back_populates="ibans")
    inflows: List["CommandFunds"] = Relationship(back_populates="iban")
    investments: List["Investments"] = Relationship(back_populates="iban")

class CommandFunds(SQLModel, table=True):
    __tablename__ = "command_funds"

    id: int = Field(default=None, primary_key=True, nullable=False)
    fund_details: Optional[str] = Field(default=None, sa_column=Column(TEXT, nullable=True))
    amount: Optional[Decimal] = Field(default=None, sa_column=Column(DECIMAL(16, 2), nullable=True))
    payment_method: Optional[str] = None
    iban_id: Optional[int] = Field(foreign_key="multi_ibn_user.id", nullable=True)
    date: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})
    created_at: datetime = Field(default_factory=get_pakistan_timestamp)  # Automatically set to current timestamp

    # Foreign key to Users table with CASCADE delete behavior
    user_id: int = Field(foreign_key="users.id", nullable=False, ondelete="CASCADE")

    received_from: Optional[str] = None
    old_amount: Optional[int] = None
    is_old_amount: bool = False  # Default value set to 0 (False)
    head_id: Optional[int] = Field(foreign_key="heads.id", nullable=True)
    subhead_id: Optional[int] = Field(foreign_key="sub_heads.id", nullable=True)
    deleted_at: Optional[datetime] = None
    is_deleted: bool = False  # Default value set to 0 (False)

    # Define the relationship's
    user: Users | None = Relationship(back_populates="inflows")
    head: Optional["Heads"] = Relationship(back_populates="command_funds")
    sub_heads: Optional["SubHeads"] = Relationship(
        back_populates="command_funds",
        sa_relationship_kwargs={"primaryjoin": "CommandFunds.subhead_id == SubHeads.id"}
    )
    iban: Optional["MultiIbnUser"] = Relationship(back_populates="inflows")


class Apartments(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    name: str = Field(..., nullable=False)  # Required field
    description: Optional[str] = None  # Optional text field
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})


class Heads(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    user_id: Optional[int] = Field(foreign_key="users.id", nullable=True)
    heads: Optional[str] = None
    type: int = Field(default=1)  # Default type is 1
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})
    status: Optional[int] = None
    deleted_at: Optional[datetime] = None

    # Relationship
    user: Optional["Users"] = Relationship(back_populates="heads")
    sub_heads: List["SubHeads"] = Relationship(back_populates="head")
    command_funds: List["CommandFunds"] = Relationship(back_populates="head")
    expenses: List["Expenses"] = Relationship(back_populates="head")
    # liabilities: List["Liabilities"] = Relationship(back_populates="head")


class SubHeads(SQLModel, table=True):
    __tablename__ = "sub_heads"
    id: int = Field(default=None, primary_key=True, nullable=False)
    user_id: Optional[int] = Field(foreign_key="users.id", nullable=True)
    head_id: Optional[int] = Field(foreign_key="heads.id", nullable=True)
    subheads: Optional[str] = None
    type: int  # Required field, no default value
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})

    # Relationships
    user: Optional["Users"] = Relationship(back_populates="sub_heads")
    head: Optional["Heads"] = Relationship(back_populates="sub_heads")
    command_funds: List["CommandFunds"] = Relationship(back_populates="sub_heads")
    expenses: List["Expenses"] = Relationship(back_populates="sub_heads")
    # liabilities: List["Liabilities"] = Relationship(back_populates="sub_heads")


class Expenses(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    expense_id: Optional[str] = None
    type: Optional[str] = None
    cost: Optional[Decimal] = Field(default=None, sa_column=Column(DECIMAL(16, 2), nullable=True))
    payment_type: Optional[str] = None
    payment_to: Optional[str] = None
    expense_date: Optional[datetime] = None  # You might want to adjust the type if this should be a datetime
    picture: Optional[str] = None
    reciept: Optional[str] = None
    site_id: Optional[int] = None
    category_id: Optional[int] = None
    corps_id: Optional[int] = Field(foreign_key="corps.id", nullable=True)
    div_id: Optional[int] = Field(foreign_key="divs.id", nullable=True)
    brigade_id: Optional[int] = Field(foreign_key="brigades.id", nullable=True)
    unit_id: Optional[int] = Field(foreign_key="units.id", nullable=True)
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})
    asset_id: Optional[int] = Field(default=None, foreign_key="assets.id", nullable=True)
    liability_id: Optional[int] = Field(default=None, foreign_key="liabilities.id", nullable=True)
    fixed_asset_id: Optional[int] = Field(default=None, foreign_key="fixed_assets.id", nullable=True)
    head_id: Optional[int] = Field(foreign_key="heads.id", nullable=True)
    subhead_id: Optional[int] = Field(foreign_key="sub_heads.id", nullable=True)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    head_details: Optional[str] = Field(default=None, sa_column=Column(TEXT, nullable=True))
    place_type: Optional[str] = None

    # Relationships
    user: Users = Relationship(back_populates="expenses")
    head: Optional["Heads"] = Relationship(back_populates="expenses")
    sub_heads: Optional["SubHeads"] = Relationship(
        back_populates="expenses",
        sa_relationship_kwargs={"primaryjoin": "Expenses.subhead_id == SubHeads.id"}
    )
    asset: Optional["Assets"] = Relationship(back_populates="expenses")
    liability: Optional["Liabilities"] = Relationship(back_populates="expenses")
    fixed_asset: Optional["Investments"] = Relationship(back_populates="expenses")
    corps: Optional["Corps"] = Relationship(back_populates="expenses")
    divs: Optional["Divs"] = Relationship(back_populates="expenses")
    brigades: Optional["Brigades"] = Relationship(back_populates="expenses")
    units: Optional["Units"] = Relationship(back_populates="expenses")


class Assets(SQLModel, table=True):
    __tablename__ = "assets"
    id: int = Field(default=None, primary_key=True, nullable=False)
    name: str
    subhead: Optional[str] = None
    type: Optional[str] = None
    purchase_date: Optional[datetime] = None
    model: Optional[str] = None
    asset_id: Optional[str] = None
    purchased_from: Optional[str] = None
    brand: Optional[str] = None
    serial_number: Optional[str] = None
    cost: Optional[Decimal] = Field(default=None, sa_column=Column(DECIMAL(16, 2), nullable=True))
    site_id: Optional[int] = None
    location_id: Optional[int] = None
    category_id: Optional[int] = None
    department_id: Optional[int] = None
    depreciation_method_id: Optional[int] = None
    assign_to_id: Optional[int] = None
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})
    status: Optional[str] = None
    deleted_at: Optional[datetime] = None
    salvage_value: Optional[str] = None
    useful_life: Optional[int] = None
    image: Optional[str] = None
    remarks: Optional[str] = None
    receipt: Optional[str] = None
    purchased_by: Optional[int] = None
    user_id: Optional[int] = Field(foreign_key="users.id", nullable=True)
    place_type: Optional[str] = None
    payment_type: Optional[str] = None
    payment_to: Optional[str] = None
    dispose_status: Optional[str] = None
    sell_price: Optional[Decimal] = None
    sold_to: Optional[str] = None
    gift_to: Optional[str] = None
    disposed_reason: Optional[str] = None
    disposed_date: Optional[datetime] = None
    head_details: str = Field(default=None, sa_column=Column(TEXT, nullable=True))
    quantity: Optional[int] = None

    # Relationships
    user: Users = Relationship(back_populates="assets")
    expenses: Optional["Expenses"] = Relationship(back_populates="asset")

class Investments(SQLModel, table=True):
    __tablename__ = "fixed_assets"
    id: int = Field(default=None, primary_key=True, nullable=False)
    user_id: Optional[int] = Field(foreign_key="users.id", nullable=True)  # Foreign key to Users table
    name: Optional[str] = None
    asset_details: Optional[str] = Field(default=None, sa_column=Column(TEXT, nullable=True))
    amount: Optional[Decimal] = Field(default=None, sa_column=Column(DECIMAL(16, 2), nullable=True))
    payment_method: Optional[str] = None
    iban_id: Optional[int] = Field(foreign_key="multi_ibn_user.id", nullable=True)
    date: Optional[datetime] = None
    type: Optional[str] = None
    is_deleted: bool = Field(default=False)  # Default value is False
    deleted_at: Optional[datetime] = None
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: Optional[datetime] = Field(
        default_factory=get_pakistan_timestamp,
        sa_column_kwargs={"onupdate": get_pakistan_timestamp}
    )

    # Relationship
    user: Optional["Users"] = Relationship(back_populates="investments")
    history: List["InvestmentHistory"] = Relationship(back_populates="investment")
    iban: Optional["MultiIbnUser"] = Relationship(back_populates="investments")
    expenses: Optional["Expenses"] = Relationship(back_populates="fixed_asset")

class InvestmentHistory(SQLModel, table=True):
    __tablename__ = "investment_balance_histories"
    id: int = Field(default=None, primary_key=True, nullable=False)
    user_id: Optional[int] = Field(foreign_key="users.id", nullable=True)  # Foreign key to Users table
    investment_id: Optional[int] = Field(foreign_key="fixed_assets.id", nullable=True)
    first_balance: Decimal = Field(..., nullable=False)  # Required field
    last_balance: Decimal = Field(..., nullable=False)  # Required field
    date: str = Field(..., nullable=False)  # Date as a string
    status: str = Field(..., nullable=False)  # Required field
    description: Optional[str] = Field(default=None, sa_column=Column(TEXT, nullable=True))
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: Optional[datetime] = Field(
        default_factory=get_pakistan_timestamp,
        sa_column_kwargs={"onupdate": get_pakistan_timestamp}
    )

    # Relationship
    user: Optional["Users"] = Relationship(back_populates="investment_histories")
    investment: Optional["Investments"] = Relationship(back_populates="history")


class Liabilities(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    name: Optional[str] = None
    subhead: Optional[str] = None
    # head_id: Optional[int] = Field(foreign_key="heads.id", nullable=True)
    # subhead_id: Optional[int] = Field(foreign_key="sub_heads.id", nullable=True)
    fund_details: Optional[str] = Field(default=None, sa_column=Column(TEXT, nullable=True))
    amount: Optional[Decimal] = Field(default=None, sa_column=Column(DECIMAL(16, 2), nullable=True))
    payment_method: Optional[str] = None
    date: datetime
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: Optional[datetime] = Field(
        default_factory=get_pakistan_timestamp,
        sa_column_kwargs={"onupdate": get_pakistan_timestamp}
    )
    user_id: int = Field(foreign_key="users.id", nullable=False)  # Foreign key to Users table
    payment_to: Optional[str] = None
    schedule: Optional[str] = None
    type: Optional[str] = None
    is_deleted: bool = Field(default=False)  # Default value is False
    is_new_entry_created: Optional[bool] = None
    is_paid: bool = Field(default=False)  # Default value is False
    deleted_at: Optional[datetime] = None
    remaining_balance: Decimal  # Required field

    # Relationship
    user: Optional["Users"] = Relationship(back_populates="liabilities")
    # head: Optional["Heads"] = Relationship(back_populates="liabilities")
    # sub_heads: Optional["SubHeads"] = Relationship(
    #     back_populates="liabilities",
    #     sa_relationship_kwargs={"primaryjoin": "Liabilities.subhead_id == SubHeads.id"}
    # )
    balances: List["LiabilityBalances"] = Relationship(back_populates="liability")
    expenses: List["Expenses"] = Relationship(back_populates="liability")


class LiabilityBalances(SQLModel, table=True):
    __tablename__ = "liability_balances"
    id: int = Field(default=None, primary_key=True, nullable=False)
    user_id: Optional[int] = Field(foreign_key="users.id", nullable=True)
    liability_id: Optional[int] = Field(foreign_key="liabilities.id", nullable=True)
    first_balance: Optional[Decimal] = None
    last_balance: Optional[Decimal] = None
    payment_type: str = Field(..., nullable=False)  # Required field
    date: str = Field(..., nullable=False)  # Date as a string, required field
    status: str = Field(..., nullable=False)  # Required field
    description: Optional[str] = Field(default=None, sa_column=Column(TEXT, nullable=True))
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: Optional[datetime] = Field(
        default_factory=get_pakistan_timestamp,
        sa_column_kwargs={"onupdate": get_pakistan_timestamp}
    )
    payment_to: Optional[str] = None
    current_amount: Optional[Decimal] = Field(default=None, sa_column=Column(DECIMAL(16, 2), nullable=True))

    # Relationships
    user: Optional["Users"] = Relationship(back_populates="liability_balances")
    liability: Optional["Liabilities"] = Relationship(back_populates="balances")


class Balances(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    cash_in_hand: Optional[Decimal] = Field(default=Decimal('0.00'), nullable=True)
    cash_in_bank: Optional[Decimal] = Field(default=Decimal('0.00'), nullable=True)
    balance: Optional[Decimal] = Field(default=Decimal('0.00'), nullable=True)
    created_at: datetime = Field(default_factory=get_pakistan_timestamp)  # Use your custom function
    updated_at: datetime = Field(default_factory=get_pakistan_timestamp,
                                 sa_column_kwargs={"onupdate": get_pakistan_timestamp})

    # Relationship
    user: Users = Relationship(back_populates="balances")


class Corps(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    name: str
    corp_img: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp,
                                           sa_column_kwargs={"onupdate": get_pakistan_timestamp})

    # Relationships
    users: List["Users"] = Relationship(back_populates="corp")
    divs: List["Divs"] = Relationship(back_populates="corp")  # Relationship with Divs
    expenses: List["Expenses"] = Relationship(back_populates="corps")

class Divs(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    name: str
    corp_id: Optional[int] = Field(foreign_key="corps.id", nullable=True)  # Foreign key to Corps table
    div_img: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp,
                                           sa_column_kwargs={"onupdate": get_pakistan_timestamp})

    # Relationships
    corp: Optional["Corps"] = Relationship(back_populates="divs")
    users: Optional["Users"] = Relationship(back_populates="divs")  # Relationship with Users
    brigades: List["Brigades"] = Relationship(back_populates="division")  # Relationship with Brigades
    expenses: List["Expenses"] = Relationship(back_populates="divs")

class Brigades(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    name: str
    div_id: Optional[int] = Field(foreign_key="divs.id", nullable=True)  # Foreign key to Divs table
    brigade_img: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp,
                                           sa_column_kwargs={"onupdate": get_pakistan_timestamp})

    # Relationships
    division: Optional["Divs"] = Relationship(back_populates="brigades")  # Relationship with Divs
    users: List["Users"] = Relationship(back_populates="brigade")  # Relationship with Users
    units: List["Units"] = Relationship(back_populates="brigade")  # Relationship with Units
    expenses: List["Expenses"] = Relationship(back_populates="brigades")

class Units(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, nullable=False)
    name: str
    brigade_id: Optional[int] = Field(foreign_key="brigades.id", nullable=True)  # Foreign key to Brigades table
    unit_img: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=get_pakistan_timestamp)
    updated_at: Optional[datetime] = Field(
        default_factory=get_pakistan_timestamp,
        sa_column_kwargs={"onupdate": get_pakistan_timestamp}
    )

    # Relationships
    brigade: Optional["Brigades"] = Relationship(back_populates="units")  # Relationship with Brigades
    users: List["Users"] = Relationship(back_populates="unit")  # Relationship with Users
    expenses: List["Expenses"] = Relationship(back_populates="units")
