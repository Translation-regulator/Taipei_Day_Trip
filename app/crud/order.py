import random
import pymysql
import logging
import requests
from app.db.session import get_db_connection
from app.core.config import TAPPAY_PARTNER_KEY, TAPPAY_MERCHANT_ID, TAPPAY_ENDPOINT
from datetime import datetime

def generate_order_number(conn):
    date_prefix = datetime.now().strftime("%Y%m%d")
    
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT MAX(CAST(SUBSTRING_INDEX(order_number, '-', -1) AS UNSIGNED)) AS max_order FROM orders WHERE order_number LIKE %s",
            (f"{date_prefix}-%",)
        )
        result = cursor.fetchone()
        
        # 確保結果包含 max_order
        seq_id = result['max_order'] + 1 if result['max_order'] is not None else 1
    
    return f"{date_prefix}-{seq_id:04d}"


def create_order(user_id: int, body):
    conn = get_db_connection()
    order_no = generate_order_number(conn)  # 使用資料庫生成的訂單編號
    payload = {
        "prime": body.prime,
        "partner_key": TAPPAY_PARTNER_KEY,
        "merchant_id": TAPPAY_MERCHANT_ID,
        "amount": body.order.price,
        "order_number": order_no,
        "details": f"台北一日遊：{body.order.trip.attraction.name}",
        "cardholder": {
            "phone_number": body.order.contact.phone,
            "name": body.order.contact.name,
            "email": body.order.contact.email
        },
        "remember": True
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-key": TAPPAY_PARTNER_KEY
    }

    try:
        r = requests.post(TAPPAY_ENDPOINT, headers=headers, json=payload)
        result = r.json()
    except Exception as e:
        logging.error("TapPay 呼叫失敗：%s", e)
        raise

    try:
        with conn.cursor() as c:
            c.execute(
                """
                INSERT INTO orders
                (order_number, user_id, price, attraction_id, date, time,
                 contact_name, contact_email, contact_phone, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    order_no,
                    user_id,
                    body.order.price,
                    body.order.trip.attraction.id,
                    body.order.trip.date,
                    body.order.trip.time,
                    body.order.contact.name,
                    body.order.contact.email,
                    body.order.contact.phone,
                    0 if result.get("status") == 0 else 1
                )
            )
            c.execute("DELETE FROM bookings WHERE user_id = %s", (user_id,))
            conn.commit()
    finally:
        conn.close()

    return order_no, result


def fetch_order(order_number: str, user_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as c:

            c.execute(
                """
                SELECT 
                    o.order_number AS number,
                    o.price,
                    o.date,
                    o.time,
                    o.contact_name,
                    o.contact_email,
                    o.contact_phone,
                    o.status,
                    a.id AS attraction_id,
                    a.name AS attraction_name,
                    a.address AS attraction_address,
                    JSON_UNQUOTE(JSON_EXTRACT(a.images, '$[0]')) AS attraction_image
                FROM orders o
                JOIN attractions a ON o.attraction_id = a.id
                WHERE o.order_number = %s AND o.user_id = %s
                """,
                (order_number, user_id)
            )
            return c.fetchone()
    finally:
        conn.close()
