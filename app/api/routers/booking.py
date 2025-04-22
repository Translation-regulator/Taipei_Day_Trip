from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.booking import BookingModel, BookingOkResponse, BookingGetResponse
from app.crud.booking import get_booking_for_user, upsert_booking, delete_booking_for_user

router = APIRouter(tags=["booking"])

@router.get(
    "/booking",
    response_model=BookingGetResponse,
    responses={403: {"description": "未登入系統，拒絕存取"}}
)
def get_booking(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = get_booking_for_user(user["id"], db)
    if res.get("status") != "success":
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="後端錯誤")
    return {"data": res["data"]}


@router.post(
    "/booking",
    response_model=BookingOkResponse,
    responses={
        400: {"description": "建立失敗，輸入不正確或其他原因"},
        403: {"description": "未登入系統，拒絕存取"},
        500: {"description": "伺服器內部錯誤"},
    },
)
def create_booking(
    booking: BookingModel,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        upsert_booking(
            user_id=user["id"],
            attraction_id=booking.attractionId,
            date=booking.date,
            time=booking.time,
            price=booking.price,
            db=db
        )
        return {"ok": True}

    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": True, "message": str(e)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": True, "message": f"伺服器內部錯誤：{e}"},
        )


@router.delete(
    "/booking",
    response_model=BookingOkResponse,
    responses={403: {"description": "未登入系統，拒絕存取"}}
)
def delete_booking(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    delete_booking_for_user(user["id"], db)
    return {"ok": True}
