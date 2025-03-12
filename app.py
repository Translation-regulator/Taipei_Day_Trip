import os
import json
import logging
import pymysql
from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import FileResponse
import uvicorn
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# 設定日誌
logging.basicConfig(level=logging.INFO)

# 資料庫連線設定，建議以環境變數管理敏感資訊
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_CHARSET = os.getenv("DB_CHARSET", "utf8mb4")

def get_db_connection():
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            db=DB_NAME,
            charset=DB_CHARSET,
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except Exception as e:
        logging.error("無法連接資料庫：%s", e)
        raise

app = FastAPI()

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")
@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")
@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")

@app.get("/")
async def index(request: Request):
    return FileResponse("./static/index.html", media_type="text/html")

@app.get("/api/attractions")
def get_attractions(page: int = Query(0), keyword: str = Query(None)):
    per_page = 12
    offset = page * per_page
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            if keyword:
                sql = "SELECT * FROM attractions WHERE name LIKE %s LIMIT %s OFFSET %s"
                cursor.execute(sql, ('%' + keyword + '%', per_page + 1, offset))
            else:
                sql = "SELECT * FROM attractions LIMIT %s OFFSET %s"
                cursor.execute(sql, (per_page + 1, offset))
            records = cursor.fetchall()
            
            if len(records) > per_page:
                nextPage = page + 1
                records = records[:per_page]
            else:
                nextPage = None
            
            for record in records:
                record['images'] = json.loads(record['images'])
        return {"nextPage": nextPage, "data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
