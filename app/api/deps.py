from fastapi import Depends, HTTPException, Request
from app.core.config import JWT_SECRET, JWT_ALGORITHM
import jwt
from jwt.exceptions import PyJWTError
from app.db.session import get_db_connection

def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

def get_current_user(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="未登入系統")
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except PyJWTError:
        raise HTTPException(status_code=403, detail="Token 驗證失敗")
