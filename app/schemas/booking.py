from pydantic import BaseModel
from typing import Optional
from datetime import date

class BookingModel(BaseModel):
    attractionId: int
    date: date
    time: str   
    price: int

class BookingAttraction(BaseModel):
    id: int
    name: str
    address: str
    image: str

class BookingData(BaseModel):
    attraction: BookingAttraction
    date: date
    time: str
    price: int

class BookingGetResponse(BaseModel):
    data: Optional[BookingData]  

class BookingOkResponse(BaseModel):
    ok: bool
