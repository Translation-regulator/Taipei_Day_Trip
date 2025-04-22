import os
import logging
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

# 資料庫
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_CHARSET = os.getenv("DB_CHARSET", "utf8mb4")

# JWT
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

# TapPay
TAPPAY_PARTNER_KEY = os.getenv("TAPPAY_PARTNER_KEY")
TAPPAY_MERCHANT_ID = os.getenv("TAPPAY_MERCHANT_ID")
TAPPAY_ENDPOINT = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"

if not TAPPAY_PARTNER_KEY or not TAPPAY_MERCHANT_ID:
    logging.error("❌ 無法讀取 TapPay 設定，請確認 .env 是否正確")
    raise RuntimeError("Missing TapPay credentials in .env")
