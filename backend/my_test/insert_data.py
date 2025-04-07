from datetime import datetime
from pprint import pprint

from sqlmodel import Session, select, create_engine, SQLModel
from app.core.db import engine

from app.cf_models.schemas import Heads, Balances, Units, Liabilities, SubHeads
from app.api.deps import CurrentUser, SessionDep

# Create the database engine (replace the URI with your actual database URI)
# path = "../CFMS.sqlite"
# DATABASE_URL = f"sqlite:///{path}"  # Example for SQLite
# engine = create_engine(DATABASE_URL)

# Create tables (if they don't exist)
# SQLModel.metadata.create_all(engine)

# session: SessionDep
# balance = session.get(Units, 1)
# print(balance)

# Open a session to interact with the database
with Session(engine) as session:
    # Prepare the data to be inserted
    new_head = SubHeads(
        user_id=97,  # Replace with an actual user_id from the 'users' table
        head_id=42,  # Replace with an actual user_id from the 'users' table
        subheads="Sample sub Head 2",  # Replace with the actual heads content
        type=1,  # Use the desired type
        created_at=datetime.now(),  # Set the current time for created_at
        updated_at=datetime.now(),  # Set the current time for updated_at
        status=1,  # Use the desired status (e.g., 1 for active)
        deleted_at=None  # Set to None if not deleted
    )

    # Add the new head to the session
    session.add(new_head)
    session.commit()

    # user_balance = Balances(user_id=2, cash_in_hand=0, cash_in_bank=0, balance=0)
    # session.add(user_balance)
    #
    # # Commit the transaction to save to the database
    # session.commit()
    # session.refresh(user_balance)
    # balance = session.get(Liabilities, 1)
    # balance.cash_in_hand = 0.00
    # balance.cash_in_bank = 0.00
    # balance.balance = 0.00
    # session.add(balance)
    # session.commit()
    # session.refresh(balance)
    # session.delete(balance)
    # session.commit()
    # pprint(balance)

    print("New entry added successfully!")
