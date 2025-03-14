import os
import json
import logging
import pymysql
import re
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
            # 建立 attraction_mrt 資料表
            create_mrt_table_sql = """
            CREATE TABLE IF NOT EXISTS attraction_mrt (
                id INT PRIMARY KEY AUTO_INCREMENT,
                mrt VARCHAR(255) UNIQUE
            );
            """
            cursor.execute(create_mrt_table_sql)

            # 建立 attractions 資料表，並加入 attraction_mrt_id 欄位
            create_attractions_table_sql = """
            CREATE TABLE IF NOT EXISTS attractions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) UNIQUE,
                category VARCHAR(255),
                description TEXT,
                address VARCHAR(255),
                transport TEXT,
                latitude DOUBLE,
                longitude DOUBLE,
                images JSON,
                attraction_mrt_id INT,
                FOREIGN KEY (attraction_mrt_id) REFERENCES attraction_mrt(id)
            );
            """
            cursor.execute(create_attractions_table_sql)

            connection.commit()

            # 資料匯入邏輯
            for item in results:
                if isinstance(item, dict):
                    name = item.get('name', '')
                    category = item.get('CAT', '')
                    description = item.get('description', '')
                    address = item.get('address', '')
                    transport = item.get('direction', '')
                    mrt = item.get('MRT', '') or ''
                    latitude = float(item.get('latitude', 0)) if item.get('latitude') else None
                    longitude = float(item.get('longitude', 0)) if item.get('longitude') else None
                    images = filter_image_urls(item.get('file', ''))

                    # 檢查該景點是否已存在
                    check_sql = "SELECT COUNT(*) as count FROM attractions WHERE name = %s"
                    cursor.execute(check_sql, (name,))
                    result_count = cursor.fetchone()

                    # 若該景點尚未存在，才進行插入
                    if result_count and result_count.get('count', 0) == 0:
                        attraction_mrt_id = None
                        # 只有當 mrt 欄位不為空時才處理
                        if mrt.strip():
                            # 檢查該 MRT 是否已經存在於 attraction_mrt 資料表
                            check_mrt_sql = "SELECT id FROM attraction_mrt WHERE mrt = %s"
                            cursor.execute(check_mrt_sql, (mrt,))
                            mrt_result = cursor.fetchone()
                            if mrt_result:
                                # 若 MRT 存在，使用已存在的 ID
                                attraction_mrt_id = mrt_result['id']
                            else:
                                # 若 MRT 不存在，插入新的 MRT 並取得其 ID
                                insert_mrt_sql = """
                                INSERT INTO attraction_mrt (mrt)
                                VALUES (%s)
                                """
                                cursor.execute(insert_mrt_sql, (mrt,))
                                attraction_mrt_id = cursor.lastrowid  # 取得新插入的 MRT ID

                        # 插入 attractions 資料表
                        insert_sql = """
                        INSERT INTO attractions (name, category, description, address, transport, latitude, longitude, images, attraction_mrt_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """
                        cursor.execute(insert_sql, (
                            name, category, description, address, transport, latitude, longitude, json.dumps(images), attraction_mrt_id
                        ))

            connection.commit()
            logging.info("資料匯入成功")
    except Exception as e:
        logging.error("資料匯入失敗：%s", e)
    finally:
        connection.close()


if __name__ == "__main__":
    import_data()
