import bcrypt, jwt
from app.db.session import get_db_connection
from app.core.config import JWT_SECRET, JWT_ALGORITHM
from datetime import datetime, timedelta
from app.schemas.user import UserCreate
import logging

def create_user(user: UserCreate):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # 檢查 Email 是否已存在
            cursor.execute("SELECT * FROM users WHERE email = %s", (user.email,))
            if cursor.fetchone():
                return False, "Email 已重複註冊", None

            # 密碼加密
            hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            # 插入新使用者
            cursor.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
                (user.name, user.email, hashed_password)
            )
            connection.commit()

            # 產生 Token
            user_id = cursor.lastrowid
            payload = {
                "id": user_id,
                "name": user.name,
                "email": user.email,
                "exp": datetime.utcnow() + timedelta(days=7)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

            return True, None, token
    except Exception as e:
        logging.error("註冊時發生錯誤：%s", e)
        return False, "伺服器內部錯誤", None
    finally:
        connection.close()




def authenticate_user(email, password):
    conn = get_db_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM users WHERE email=%s", (email,))
            user = c.fetchone()
            if not user:
                return None, "User not found"  # 如果沒有找到使用者，回傳 "User not found"
            if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
                return None, "Invalid credentials"  # 如果密碼不匹配，回傳 "Invalid credentials"
            payload = {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "exp": datetime.utcnow() + timedelta(days=7)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            return token, None
    except Exception as e:
        logging.error("登入時發生錯誤：%s", e)
        return None, "伺服器內部錯誤"
    finally:
        conn.close()



