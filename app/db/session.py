import pymysql
from app.core.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_CHARSET
import logging

def get_db_connection():
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            db=DB_NAME,
            charset=DB_CHARSET,
            cursorclass=pymysql.cursors.DictCursor
        )
        return conn
    except Exception as e:
        logging.error("無法連接資料庫：%s", e)
        raise
