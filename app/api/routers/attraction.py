from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
from app.crud.attraction import get_attractions, fetch_mrts, fetch_attraction_detail
from app.schemas.attraction import AttractionListResponse, MRTListResponse
from app.schemas.attraction import AttractionDetailResponse

router = APIRouter()

@router.get("/attractions", response_model=AttractionListResponse)
def get_attractions_endpoint(page: int = Query(0), keyword: Optional[str] = Query(None)):
    try:
        recs, next_page = get_attractions(page, keyword)
        if not recs:
            return JSONResponse(status_code=400, content={
                "error": True,
                "message": "所查詢的頁面不存在"
            })
        return {"nextPage": next_page, "data": recs}
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "error": True,
            "message": f"伺服器內部錯誤：{e}"
        })
@router.get(
    "/attraction/{attraction_id}",
    response_model=AttractionDetailResponse,
    responses={
        400: {"description": "景點編號不正確", "content": {"application/json": {}}},
        500: {"description": "伺服器內部錯誤",   "content": {"application/json": {}}},
        },
    )
def get_attraction_detail(attraction_id: int):
    try:
        record = fetch_attraction_detail(attraction_id)
        if record is None:
            raise HTTPException(
                status_code=400,
                detail={"error": True, "message": "景點編號不正確"}
            )
        return {"data": record}
    except HTTPException as http_exc:
        return JSONResponse(status_code=http_exc.status_code, content=http_exc.detail)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": True, "message": f"伺服器內部錯誤：{e}"}
        ) 


@router.get("/mrts", response_model=MRTListResponse)
def get_mrts_endpoint():
    try:
        mrt_list = fetch_mrts()
        return {"data": mrt_list}
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "error": True,
            "message": f"伺服器內部錯誤：{e}"
        })
