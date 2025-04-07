import pprint
from sqlmodel import SQLModel, create_engine, Session, select
from datetime import datetime
from decimal import Decimal
from app.cf_models.sqlite_model import User, CommandFunds  # Ensure that CommandFunds is correctly imported
from sqlalchemy import text

# Create SQLite engine
DATABASE_URL = "sqlite:////home/sana/Office/full-stack-fastapi-template/backend/CFMS.sqlite"
# DATABASE_URL = "mysql+pymysql://sana:sana@localhost/sana"
engine = create_engine(DATABASE_URL)


# Initialize the database
def initialize_database():
    # Create the tables in the database
    SQLModel.metadata.create_all(engine)


# Add a user to the database
def add_user(name: str, email: str, role: int, password: str):  # Added password parameter
    with Session(engine) as session:
        user = User(
            name=name,
            email=email,
            role=role,
            username="example_user",
            password=password,  # Provide a password here
            appt="Manager",
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"User added: {user}")


# Add an inflow for a user
def add_inflow(user_id: int, name: str, amount: Decimal, payment_method: str):
    with Session(engine) as session:
        inflow = CommandFunds(
            user_id=user_id,
            name=name,
            amount=amount,
            payment_method=payment_method,
            date=datetime.utcnow(),
        )
        session.add(inflow)
        session.commit()
        session.refresh(inflow)
        print(f"Inflow added: {inflow}")


# Query users and their inflows
def query_data():
    with Session(engine) as session:
        # Query users
        users = session.exec(select(User)).all()
        for user in users:
            print(f"User: {user.name}, Email: {user.email}")
            # Query inflows for each user
            inflows = session.exec(select(CommandFunds).where(CommandFunds.user_id == user.id)).all()
            result = []
            for inflow in inflows:
                result.append({"Inflow": inflow.name, "Amount": inflow.amount, "Date": inflow.date})
            pprint.pprint(result)


def describe_table(table_name: str):
    with engine.connect() as connection:
        result = connection.execute(text(f"PRAGMA table_info({table_name});"))
        print(f"Structure of {table_name} table:")
        for row in result:
            print(row)


if __name__ == "__main__":
    initialize_database()

    # Add sample data
    # add_user(name="John Doe", email="john.doe@example.com", role=1, password="secret_password")
    # add_user(name="Jane Smith", email="jane.smith@example.com", role=2, password="secret_password")
    #
    #
    # # Add inflows for the users
    # add_inflow(user_id=1, name="Project Funding", amount=Decimal("5000.00"), payment_method="Bank Transfer")
    # add_inflow(user_id=1, name="Bonus Payment", amount=Decimal("1500.00"), payment_method="Credit Card")
    # add_inflow(user_id=2, name="Donation", amount=Decimal("2000.00"), payment_method="PayPal")

    # Query data
    query_data()

    print("/////////////////////////////////////////////////////////")
    describe_table("user")  # Replace with your table name
    describe_table("CommandFunds")  # Replace with your table name
