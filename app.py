from fastapi import *
from fastapi.responses import FileResponse
app=FastAPI()

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
import json
import pymysql
import re

# 篩選出圖片 URL 的函式
def filter_image_urls(image_str):
    # 在每個 https:// 或 http:// 前加逗號作為分隔符
    image_str = re.sub(r'(https?://)', r',\1', image_str)
    # 使用逗號分隔並提取 URL
    urls = image_str.split(',')
    # 篩選出以 .jpg 和 .png 結尾的圖片 URL
    filtered = [url for url in urls if url.lower().endswith(('.jpg', '.png'))]
    return filtered

# 連接資料庫
def get_db_connection():
    connection = pymysql.connect(
        host='localhost',  # 請填入資料庫位置      
        user='root',      
        password='8745',  
        db='attraction',         
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection

# 讀取 JSON 資料
with open('data/taipei-attractions.json', encoding='utf-8') as f:
    data = json.load(f)

# 檢查資料是否包含 'result' 和 'results'
if 'result' in data and 'results' in data['result']:
    results = data['result']['results']
else:
    raise ValueError("JSON 格式錯誤，缺少 'result' 或 'results'")

# 連接資料庫
connection = get_db_connection()
try:
    with connection.cursor() as cursor:
        # 建立 attractions 資料表
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS attractions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) UNIQUE,  # 加上 UNIQUE 避免重複
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

        # 插入資料前檢查是否已經存在
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

                # 新增檢查邏輯：確保資料不重複
                check_sql = "SELECT COUNT(*) FROM attractions WHERE name = %s"
                cursor.execute(check_sql, (name,))
                (count,) = cursor.fetchone().values()

                if count == 0:  # 只有當資料不存在時才插入
                    insert_sql = """
                    INSERT INTO attractions (name, category, description, address, transport, mrt, latitude, longitude, images)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(insert_sql, (name, category, description, address, transport, mrt, latitude, longitude, json.dumps(images)))

        connection.commit()
        print("資料匯入成功")
except Exception as e:
    print("資料匯入失敗：", e)
finally:
    connection.close()


# FastAPI 部分
app = FastAPI()

@app.get("/api/attractions")
def get_attractions(page: int = Query(0), keyword: str = Query(None)):
    per_page = 12  # 每頁筆數
    offset = page * per_page
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            if keyword:
                # 確保 keyword 被正確處理，並進行模糊查詢
                sql = "SELECT * FROM attractions WHERE name LIKE %s LIMIT %s OFFSET %s"
                cursor.execute(sql, ('%' + keyword + '%', per_page + 1, offset))
            else:
                sql = "SELECT * FROM attractions LIMIT %s OFFSET %s"
                cursor.execute(sql, (per_page + 1, offset))
            results = cursor.fetchall()

            # 判斷是否還有下一頁資料
            if len(results) > per_page:
                nextPage = page + 1
                results = results[:per_page]
            else:
                nextPage = None

            # 將 images 欄位的 JSON 字串轉回陣列
            for record in results:
                record['images'] = json.loads(record['images'])
        return {"nextPage": nextPage, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()


@app.get("/api/attraction/{attractionId}")
def get_attraction_detail(attractionId: int):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "SELECT * FROM attractions WHERE id = %s"
            cursor.execute(sql, (attractionId,))
            attraction = cursor.fetchone()
            if attraction is None:
                raise HTTPException(status_code=400, detail="景點編號不正確")
            # 將 images 欄位轉回陣列格式
            attraction['images'] = json.loads(attraction['images'])
        return {"data": attraction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()

@app.get("/api/mrts")
def get_mrts():
    try:
        connection = get_db_connection()
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





