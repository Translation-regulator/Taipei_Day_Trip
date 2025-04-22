from pydantic import BaseModel
from typing import Dict, Optional
from datetime import date

# ----- Input Models -----
class OrderContact(BaseModel):
    name: str
    email: str
    phone: str

class AttractionInfo(BaseModel):
    id: int
    name: str
    address: str
    image: str

class TripInfo(BaseModel):
    attraction: AttractionInfo
    date: date
    time: str

class OrderData(BaseModel):
    price: int
    trip: TripInfo
    contact: OrderContact

class OrderRequest(BaseModel):
    prime: str
    order: OrderData

# ----- Create Response Models -----
class OrderResult(BaseModel):
    number: str
    payment: Dict

class OrderCreateResponse(BaseModel):
    data: OrderResult

# ----- Get Response Models -----
class OrderGetData(BaseModel):
    number: str
    price: int
    trip: TripInfo
    contact: OrderContact
    status: int

class OrderGetResponse(BaseModel):
    data: Optional[OrderGetData]
