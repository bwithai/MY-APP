from sqlalchemy import Column, Boolean, text, BIGINT, VARCHAR, DECIMAL, DATE, Integer, DateTime
from sqlalchemy.exc import OperationalError
from sqlmodel import create_engine
from app.core.config import settings

# Replace with your MySQL database details
settings.MYSQL_DB = 'test'
DATABASE_URL = str(settings.SQLALCHEMY_DATABASE_URI)

# Get database name from connection URL
DATABASE_NAME = DATABASE_URL.split('/')[-1]

# Create the engine
engine = create_engine(DATABASE_URL)

# Define table modifications with proper SQLAlchemy types
table_modifications = {
    'users': {
        'add_columns': [
            Column('is_active', Boolean, server_default=text('1')),  # Default to 1 (True)
            Column('is_superuser', Boolean, server_default=text('0')),  # Default to 0 (False)
        ]
    },
    'command_funds': {
        'rename_columns': [
            ('name', 'head_id', BIGINT),
            ('subhead', 'subhead_id', BIGINT)
        ]
    },
    'expenses': {
        'rename_columns': [
            ('name', 'head_id', BIGINT),
            ('subhead', 'subhead_id', BIGINT)
        ]
    },
    'investment_balance_histories': {
        'change_type': [
            ('user_id', BIGINT),
            ('investment_id', BIGINT)
        ]
    },
    'liabilities': {
        'add_columns': [
            Column('remaining_balance', DECIMAL(16,2))
        ]
    },
    'assets': {
        'add_columns': [
            Column('sell_price', DECIMAL(16,2)),
            Column('sold_to', VARCHAR(255)),
            Column('gift_to', VARCHAR(255)),
            Column('disposed_reason', VARCHAR(255)),
            Column('disposed_date', DateTime),
            Column('quantity', Integer)
        ]
    }
}


# Function to check if column exists
def column_exists(connection, table_name, column_name):
    try:
        check_stmt = text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema = :db_name "
            "AND table_name = :table_name "
            "AND column_name = :column_name"
        )
        result = connection.execute(
            check_stmt,
            {
                "db_name": DATABASE_NAME,
                "table_name": table_name,
                "column_name": column_name
            }
        ).scalar()
        return result > 0
    except Exception as e:
        print(f"Error checking column existence: {e}")
        return False


# Function to add new columns
def add_columns(connection, table_name, columns):
    for col in columns:
        try:
            # Check if column already exists
            if column_exists(connection, table_name, col.name):
                print(f"Column {col.name} already exists in {table_name}, skipping...")
                continue

            if isinstance(col.type, Boolean):
                # Extract the default value from server_default
                default_value = col.server_default.arg.text if col.server_default else '0'
                alter_statement = text(
                    f"ALTER TABLE {table_name} ADD COLUMN {col.name} BOOLEAN DEFAULT {default_value}")
            else:
                alter_statement = text(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col.type}")
            connection.execute(alter_statement)
            connection.commit()  # Add commit after each execution
            print(f"Added column {col.name} to {table_name} successfully.")
        except OperationalError as e:
            print(f"Error adding column {col.name} to {table_name}: {e}")


# Function to rename columns (renames and changes type)
def rename_columns(connection, table_name, rename_list):
    for old_name, new_name, new_type in rename_list:
        try:
            # Check if old column exists
            if not column_exists(connection, table_name, old_name):
                print(f"Column {old_name} does not exist in {table_name}, skipping...")
                continue

            # Check if new column already exists
            if column_exists(connection, table_name, new_name):
                print(f"Column {new_name} already exists in {table_name}, skipping...")
                continue

            # Convert SQLAlchemy type to MySQL type string
            if new_type == BIGINT:
                type_str = 'BIGINT(10) NULL'
            else:
                type_str = str(new_type)

            # Use CHANGE COLUMN for renaming in MySQL
            alter_statement = text(
                f"ALTER TABLE {table_name} CHANGE COLUMN {old_name} {new_name} {type_str}"
            )
            connection.execute(alter_statement)
            connection.commit()
            print(f"Renamed column {old_name} to {new_name} in {table_name} successfully.")
        except OperationalError as e:
            print(f"Error renaming column {old_name} to {new_name} in {table_name}: {e}")


# New functionality: change only the column type
def change_column_type(connection, table_name, columns):
    """
    Change the data type of existing columns in a table.
    Each entry in 'columns' is a tuple: (column_name, new_type)
    """
    for col_name, new_type in columns:
        try:
            # Check if the column exists
            if not column_exists(connection, table_name, col_name):
                print(f"Column {col_name} does not exist in {table_name}, skipping...")
                continue

            # Convert SQLAlchemy type to a MySQL type string
            if new_type == BIGINT:
                type_str = 'BIGINT(10) NULL'
            else:
                type_str = str(new_type)

            # Use MODIFY COLUMN to change only the type without renaming
            alter_statement = text(f"ALTER TABLE {table_name} MODIFY COLUMN {col_name} {type_str}")
            connection.execute(alter_statement)
            connection.commit()
            print(f"Changed type of column {col_name} in {table_name} to {type_str} successfully.")
        except OperationalError as e:
            print(f"Error changing type of column {col_name} in {table_name}: {e}")


# Execute modifications
with engine.connect() as connection:
    for table_name, modifications in table_modifications.items():
        print(f"\nProcessing table: {table_name}")

        if 'add_columns' in modifications:
            add_columns(connection, table_name, modifications['add_columns'])

        if 'rename_columns' in modifications:
            rename_columns(connection, table_name, modifications['rename_columns'])

        if 'change_type' in modifications:
            change_column_type(connection, table_name, modifications['change_type'])
