from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from app.db.models import Booking


def get_booking_for_user(user_id: int, db: Session):
    """
    取得指定使用者的預定資訊，包含景點詳細資料。
    """
    try:
        booking = (
            db.query(Booking)
            .options(joinedload(Booking.attraction))
            .filter(Booking.user_id == user_id)
            .first()
        )

        if booking:
            data = {
                "id": booking.id,
                "attraction": {
                    "id": booking.attraction.id,
                    "name": booking.attraction.name,
                    "address": booking.attraction.address,
                    "image": booking.attraction.images[0] if isinstance(booking.attraction.images, list) and booking.attraction.images else None,


                },
                "date": booking.date,
                "time": booking.time,
                "price": booking.price,
            }
        else:
            data = None

        return {"data": data, "status": "success"}

    except SQLAlchemyError as e:
        print(f"[DB ERROR] get_booking_for_user: {e}")
        return {"error": "Database error", "status": "failed"}


def upsert_booking(user_id: int, attraction_id: int, date: str, time: str, price: float, db: Session):
    """
    新增或更新使用者的預定資訊。
    """
    try:
        booking = (
            db.query(Booking)
            .filter(Booking.user_id == user_id, Booking.attraction_id == attraction_id)
            .first()
        )

        if booking:
            booking.date = date
            booking.time = time
            booking.price = price
        else:
            booking = Booking(
                user_id=user_id,
                attraction_id=attraction_id,
                date=date,
                time=time,
                price=price,
            )
            db.add(booking)

        db.commit()
        db.refresh(booking)
        return booking

    except SQLAlchemyError as e:
        db.rollback()
        print(f"[DB ERROR] upsert_booking: {e}")
        raise


def delete_booking_for_user(user_id: int, db: Session):
    """
    刪除指定使用者的預定資訊。
    """
    try:
        rows_deleted = db.query(Booking).filter(Booking.user_id == user_id).delete()
        db.commit()

        if rows_deleted == 0:
            return {"error": "No booking found for the user to delete"}
        return {"message": "Booking deleted successfully"}

    except SQLAlchemyError as e:
        db.rollback()
        print(f"[DB ERROR] delete_booking_for_user: {e}")
        return {"error": "Database error during deletion"}
