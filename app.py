import os
import sys
import json
import logging
import re
import pymysql
from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import FileResponse
import uvicorn

# 設定日誌
logging.basicConfig(level=logging.INFO)

# 資料庫連線設定，建議以環境變數管理敏感資訊
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "8745")
DB_NAME = os.environ.get("DB_NAME", "attraction")
DB_CHARSET = os.environ.get("DB_CHARSET", "utf8mb4")

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
    """
    改用正則表達式直接找出符合 jpg/png 格式的 URL
    """
    pattern = r'https?://[^\s,]+?\.(?:jpg|png)'
    urls = re.findall(pattern, image_str, flags=re.IGNORECASE)
    return urls

def import_data():
    """
    資料匯入：讀取 JSON 並存入 MySQL，僅在尚未匯入時執行
    """
    try:
        with open('data/taipei-attractions.json', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        logging.error("讀取 JSON 檔案失敗：%s", e)
        return

    # 檢查 JSON 結構
    if 'result' in data and 'results' in data['result']:
        results = data['result']['results']
    else:
        logging.error("JSON 格式錯誤，缺少 'result' 或 'results'")
        return

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # 建立 attractions 資料表，移除 SQL 中不必要的註解
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

            # 遍歷 JSON 資料並插入資料庫（先檢查是否已存在）
            for item in results:
                if isinstance(item, dict):
                    name = item.get('name', '')
                    category = item.get('CAT', '')
                    description = item.get('description', '')
                    address = item.get('address', '')
                    transport = item.get('direction', '')
                    mrt = item.get('MRT', '')
                    try:
                        latitude = float(item.get('latitude', 0)) if item.get('latitude') else None
                    except ValueError:
                        latitude = None
                    try:
                        longitude = float(item.get('longitude', 0)) if item.get('longitude') else None
                    except ValueError:
                        longitude = None
                    images = filter_image_urls(item.get('file', ''))

                    # 檢查資料是否已存在
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

# 建立單一 FastAPI 實例，後續靜態頁面與 API 都掛在此實例上
app = FastAPI()

# ----------------------- 靜態頁面路由 (勿修改) -----------------------
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
# -------------------------------------------------------------------

# ----------------------- API Endpoints -----------------------
@app.get("/api/attractions")
def get_attractions(page: int = Query(0), keyword: str = Query(None)):
    per_page = 12  # 每頁筆數
    offset = page * per_page
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            if keyword:
                # 使用模糊查詢搜尋景點名稱
                sql = "SELECT * FROM attractions WHERE name LIKE %s LIMIT %s OFFSET %s"
                cursor.execute(sql, ('%' + keyword + '%', per_page + 1, offset))
            else:
                sql = "SELECT * FROM attractions LIMIT %s OFFSET %s"
                cursor.execute(sql, (per_page + 1, offset))
            records = cursor.fetchall()

            # 判斷是否還有下一頁資料
            if len(records) > per_page:
                nextPage = page + 1
                records = records[:per_page]
            else:
                nextPage = None

            # 將 images 欄位的 JSON 字串轉回陣列
            for record in records:
                record['images'] = json.loads(record['images'])
        return {"nextPage": nextPage, "data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()

@app.get("/api/attraction/{attractionId}")
def get_attraction_detail(attractionId: int):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT * FROM attractions WHERE id = %s"
            cursor.execute(sql, (attractionId,))
            attraction = cursor.fetchone()
            if not attraction:
                raise HTTPException(status_code=400, detail="景點編號不正確")
            attraction['images'] = json.loads(attraction['images'])
        return {"data": attraction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()

@app.get("/api/mrts")
def get_mrts():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT DISTINCT mrt FROM attractions WHERE mrt IS NOT NULL AND mrt <> ''"
            cursor.execute(sql)
            results = cursor.fetchall()
            mrts = [item['mrt'] for item in results]
        return {"data": mrts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()
# -------------------------------------------------------------------

if __name__ == "__main__":
    # 若執行時帶有參數 "import" 則進行資料匯入，否則啟動 API 伺服器
    if len(sys.argv) > 1 and sys.argv[1] == "import":
        import_data()
    else:
        uvicorn.run("app:app")
