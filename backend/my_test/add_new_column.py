from sqlalchemy import Column, Boolean, text, BIGINT, VARCHAR, DECIMAL, DATE
from sqlalchemy.exc import OperationalError
from sqlmodel import create_engine

# Replace with your MySQL database details
DATABASE_URL = "mysql+pymysql://newuser:newpassword@localhost/command_fund"

# Create the engine
engine = create_engine(DATABASE_URL)

# Define the new columns you want to add
new_columns = [
    # Column('head_id', BIGINT, default=None),
    Column('sell_price', DECIMAL(16,2), default=None),
    Column('sold_to', VARCHAR(200), default=None),
    Column('gift_to', VARCHAR(200), default=None),
    Column('disposed_reason', VARCHAR(255), default=None),
    Column('disposed_date', DATE, default=None),
]

# Access the 'users' table dynamically using the engine
with engine.connect() as connection:
    try:
        # Add new columns to the 'users' table
        for col in new_columns:
            alter_statement = text(f"ALTER TABLE assets ADD COLUMN {col.name} {col.type}")
            connection.execute(alter_statement)
        print("Columns added successfully.")
    except OperationalError as e:
        print(f"Error occurred: {e}")
