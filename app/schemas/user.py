from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class TokenResponse(BaseModel):
    token: str

class UserLogin(BaseModel):
    email: str
    password: str
    
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
