import os
import sys
import json
import logging
import re
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
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "8745")
DB_NAME = os.getenv("DB_NAME", "attraction")
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

def filter_image_urls(image_str: str):
    pattern = r'https?://[^\s,]+?\.(?:jpg|png)'
    urls = re.findall(pattern, image_str, flags=re.IGNORECASE)
    return urls

def import_data():
    try:
        with open('data/taipei-attractions.json', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        logging.error("讀取 JSON 檔案失敗：%s", e)
        return

    if 'result' in data and 'results' in data['result']:
        results = data['result']['results']
    else:
        logging.error("JSON 格式錯誤，缺少 'result' 或 'results'")
        return

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS attractions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) UNIQUE,
                category VARCHAR(255),
                description TEXT,
                address VARCHAR(255),
                transport TEXT,
                mrt VARCHAR(255),
                latitude DOUBLE,
                longitude DOUBLE,
                images JSON
            );
            """
            cursor.execute(create_table_sql)
            connection.commit()

            for item in results:
                if isinstance(item, dict):
                    name = item.get('name', '')
                    category = item.get('CAT', '')
                    description = item.get('description', '')
                    address = item.get('address', '')
                    transport = item.get('direction', '')
                    mrt = item.get('MRT', '')
                    latitude = float(item.get('latitude', 0)) if item.get('latitude') else None
                    longitude = float(item.get('longitude', 0)) if item.get('longitude') else None
                    images = filter_image_urls(item.get('file', ''))

                    check_sql = "SELECT COUNT(*) as count FROM attractions WHERE name = %s"
                    cursor.execute(check_sql, (name,))
                    result_count = cursor.fetchone()
                    if result_count and result_count.get('count', 0) == 0:
                        insert_sql = """
                        INSERT INTO attractions (name, category, description, address, transport, mrt, latitude, longitude, images)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """
                        cursor.execute(insert_sql, (
                            name, category, description, address, transport, mrt, latitude, longitude, json.dumps(images)
                        ))
            connection.commit()
            logging.info("資料匯入成功")
    except Exception as e:
        logging.error("資料匯入失敗：%s", e)
    finally:
        connection.close()

app = FastAPI()

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
    if len(sys.argv) > 1 and sys.argv[1] == "import":
        import_data()
    else:
        uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
