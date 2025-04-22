import bcrypt, jwt
from app.db.session import get_db_connection
from app.core.config import JWT_SECRET, JWT_ALGORITHM
from datetime import datetime, timedelta

def create_user(name, email, password):
    conn = get_db_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT 1 FROM users WHERE email=%s", (email,))
            if c.fetchone():
                return None, "Email 已重複註冊"
            pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            c.execute("INSERT INTO users (name,email,password_hash) VALUES (%s,%s,%s)",
            (name, email, pw_hash))
            conn.commit()
            return True, None
    finally:
        conn.close()

def authenticate_user(email, password):
    conn = get_db_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM users WHERE email=%s", (email,))
            user = c.fetchone()
            if not user or not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
                return None, "帳號或密碼錯誤"
            payload = {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "exp": datetime.utcnow() + timedelta(days=7)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            return token, None
    finally:
        conn.close()
