from fastapi import APIRouter, Depends
from app.crud.order import create_order, fetch_order
from app.schemas.order import (
    OrderRequest,
    OrderCreateResponse,
    OrderGetResponse,
    OrderGetData,
    OrderContact,
    TripInfo,
    AttractionInfo,
)
from app.api.deps import get_current_user

router = APIRouter(tags=["order"])

@router.post("/order", response_model=OrderCreateResponse)
def create_order_endpoint(
    body: OrderRequest,
    user=Depends(get_current_user)
):
    order_no, pay_result = create_order(user["id"], body)
    return {"data": {"number": order_no, "payment": pay_result}}

@router.get("/order/{orderNumber}", response_model=OrderGetResponse)
def get_order_endpoint(
    orderNumber: str,
    user=Depends(get_current_user)
):
    row = fetch_order(orderNumber, user["id"])
    if not row:
        return {"data": None}

    attraction = AttractionInfo(
        id=row["attraction_id"],
        name=row["attraction_name"],
        address=row["attraction_address"],
        image=row["attraction_image"]
    )
    trip = TripInfo(
        attraction=attraction,
        date=row["date"],
        time=row["time"]
    )
    contact = OrderContact(
        name=row["contact_name"],
        email=row["contact_email"],
        phone=row["contact_phone"]
    )
    data = OrderGetData(
        number=row["number"],
        price=row["price"],
        trip=trip,
        contact=contact,
        status=row["status"]
    )
    return {"data": data}
