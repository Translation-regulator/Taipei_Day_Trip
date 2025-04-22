from fastapi import APIRouter, Depends, HTTPException
from app.crud.user import create_user, authenticate_user
from app.schemas.user import UserCreate, TokenResponse, CurrentUserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/user")


@router.post("", response_model=TokenResponse)
def signup(user: UserCreate):
    """使用者註冊: POST /api/user"""
    ok, msg, token = create_user(user.name, user.email, user.password)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"token": token}

@router.put("/auth", response_model=TokenResponse)
def signin(user: UserCreate):
    """使用者登入: PUT /api/user/auth"""
    token, msg = authenticate_user(user.email, user.password)
    if not token:
        raise HTTPException(status_code=400, detail=msg)
    return {"token": token}

@router.get("/auth", response_model=CurrentUserResponse)
def get_user_info(user=Depends(get_current_user)):
    user["exp"] = str(user["exp"])
    return {"data": user}

