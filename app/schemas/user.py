from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str  
    exp: str

    model_config = {
        "from_attributes": True  
    }

class CurrentUserResponse(BaseModel):
    data: Optional[UserOut]
