from fastapi import APIRouter, Depends, HTTPException
from app.crud.user import create_user, authenticate_user
from app.schemas.user import UserCreate, UserLogin, TokenResponse, CurrentUserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/user", tags=["User"])

@router.post("", response_model=TokenResponse)
def signup(user: UserCreate):
    """使用者註冊"""
    ok, msg, token = create_user(user.name, user.email, user.password)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"token": token}

@router.put("/auth", response_model=TokenResponse)
def signin(user: UserLogin):
    """使用者登入"""
    token, msg = authenticate_user(user.email, user.password)
    if not token:
        raise HTTPException(status_code=400, detail=msg)
    return {"token": token}

@router.get("/auth", response_model=CurrentUserResponse)
def get_user_info(user=Depends(get_current_user)):
    """取得目前登入的使用者資訊"""
    user_data = user.copy()
    user_data["exp"] = str(user_data["exp"])
    return {"data": user_data}

