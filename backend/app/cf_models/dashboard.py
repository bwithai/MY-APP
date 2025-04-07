from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from typing import List, Optional


class BaseSchema(BaseModel):
    count: int
    total_amount: Optional[Decimal] = None



class InflowOutflowResponse(BaseModel):
    inflow: BaseSchema
    outflow: BaseSchema