from pydantic import BaseModel
from typing import List, Optional

class Attraction(BaseModel):
    id: int
    name: str
    category: str
    description: str
    address: str
    transport: str
    mrt: Optional[str]
    lat: float
    lng: float
    images: List[str]

class AttractionListResponse(BaseModel):
    nextPage: Optional[int]
    data: List[Attraction]

class MRTListResponse(BaseModel):
    data: List[str]


class AttractionDetailResponse(BaseModel):
    data: Attraction