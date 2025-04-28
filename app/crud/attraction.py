import json
import re
import logging
from typing import Optional, Tuple, List, Dict
from app.db.session import get_db_connection

logging.basicConfig(level=logging.INFO)


def _parse_image_field(raw_field: Optional[str]) -> List[str]:
    """兼容 JSON 陣列字串 或 純文字網址串"""
    if not raw_field:
        return []
    raw_str = raw_field.strip()
    if raw_str.startswith('[') and raw_str.endswith(']'):
        try:
            return json.loads(raw_str)
        except json.JSONDecodeError:
            logging.warning("Invalid JSON in image field, fallback to regex extraction")
    return re.findall(r'https?://[^\s]+?\.(?:jpg|jpeg|png|gif)', raw_str, flags=re.IGNORECASE)


def get_attractions(page: int = 0, keyword: Optional[str] = None) -> Tuple[List[Dict], Optional[int]]:
    per_page = 12
    offset = page * per_page
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            logging.info(f"Query page={page}, keyword={keyword}")
            if keyword:
                sql = """
                    SELECT a.*, m.mrt
                    FROM attractions a
                    LEFT JOIN attraction_mrt m ON a.attraction_mrt_id=m.id
                    WHERE a.name LIKE %s OR m.mrt LIKE %s
                    LIMIT %s OFFSET %s
                """
                cur.execute(sql, (f"%{keyword}%", f"%{keyword}%", per_page + 1, offset))
            else:
                sql = """
                    SELECT a.*, m.mrt
                    FROM attractions a
                    LEFT JOIN attraction_mrt m ON a.attraction_mrt_id=m.id
                    LIMIT %s OFFSET %s
                """
                cur.execute(sql, (per_page + 1, offset))

            rows = cur.fetchall()
            if not rows:
                return [], None

            next_page = page + 1 if len(rows) > per_page else None
            rows = rows[:per_page]

            out: List[Dict] = []
            for r in rows:
                raw_imgs = r.get('images') or r.get('file') or ''
                urls = _parse_image_field(raw_imgs)

                try:
                    lat = float(r.get('latitude', 0))
                except (TypeError, ValueError):
                    lat = 0.0
                try:
                    lng = float(r.get('longitude', 0))
                except (TypeError, ValueError):
                    lng = 0.0

                out.append({
                    'id': r.get('id'),
                    'name': r.get('name'),
                    'category': r.get('category'),
                    'description': r.get('description'),
                    'address': r.get('address'),
                    'transport': r.get('transport'),
                    'mrt': r.get('mrt'),
                    'lat': lat,
                    'lng': lng,
                    'images': urls
                })

            return out, next_page

    except Exception as e:
        logging.error(f"get_attractions error: {e}")
        return [], None

    finally:
        conn.close()


def fetch_attraction_detail(attraction_id: int) -> Optional[Dict]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            sql = """
                SELECT
                a.id, a.name, a.category, a.description,
                a.address, a.transport, a.latitude, a.longitude,
                a.images AS raw_images,
                m.mrt
                FROM attractions a
                LEFT JOIN attraction_mrt m ON a.attraction_mrt_id = m.id
                WHERE a.id = %s
            """

            cur.execute(sql, (attraction_id,))
            row = cur.fetchone()
            if not row:
                return None

        images = _parse_image_field(row.pop('raw_images', ''))
        try:
            lat = float(row.pop('latitude', 0))
        except (TypeError, ValueError):
            lat = 0.0
        try:
            lng = float(row.pop('longitude', 0))
        except (TypeError, ValueError):
            lng = 0.0

        return {**row, 'lat': lat, 'lng': lng, 'images': images}

    except Exception as e:
        logging.error(f"fetch_attraction_detail error: {e}")
        return None

    finally:
        conn.close()


def fetch_mrts() -> List[str]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            sql = """
                SELECT m.mrt, COUNT(*) as count
                FROM attraction_mrt m
                LEFT JOIN attractions a ON a.attraction_mrt_id = m.id
                GROUP BY m.mrt
                ORDER BY count DESC
            """
            cur.execute(sql)
            results = cur.fetchall()
            return [row['mrt'] for row in results]
    except Exception as e:
        logging.error(f"fetch_mrts error: {e}")
        return []
    finally:
        conn.close()
