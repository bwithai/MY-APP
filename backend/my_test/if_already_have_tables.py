import json
from decimal import Decimal

from sqlmodel import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from app.cf_models.schemas import Balances

# Replace with your MySQL database details
DATABASE_URL = "mysql+pymysql://newuser:newpassword@localhost/command_fund"

# Create the engine
engine = create_engine(DATABASE_URL)

# Automap Base
Base = automap_base()
Base.prepare(autoload_with=engine)  # Updated syntax

# Access tables dynamically
MyTable = Base.classes.balances  # Replace 'users' with your actual table name

# uers = [column.name for column in MyTable.__table__.columns]


# Query data
with Session(engine) as session:
    command_fund = Balances(
        user_id=96  # Reference the user ID here
    )
    session.add(command_fund)
    session.commit()


    # results = session.query(MyTable).all()
    # json_results = []
    #
    # for row in results:
    #     # Exclude SQLAlchemy internal state
    #     row_data = {key: value for key, value in row.__dict__.items() if not key.startswith("_")}
    #     json_results.append(row_data)
    #
    # # Convert to JSON string if needed
    # print(json.dumps(json_results, default=str, indent=4))  # `default=str` handles datetime serialization