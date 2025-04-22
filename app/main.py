import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import Request
from app.api.routers.user import router as user_router
from app.api.routers.attraction import router as attractions_router
from app.api.routers.booking import router as booking_router
from app.api.routers.order import router as order_router

app = FastAPI()


app.include_router(user_router, prefix="/api", tags=["user"])
app.include_router(attractions_router, prefix="/api", tags=["attraction"])
app.include_router(booking_router, prefix="/api", tags=["booking"])
app.include_router(order_router, prefix="/api", tags=["order"])

base_dir = os.path.dirname(os.path.abspath(__file__))  
static_dir = os.path.join(base_dir, "..", "static")  
image_dir = os.path.join(static_dir, "image")

app.mount("/static", StaticFiles(directory=static_dir), name="static")
app.mount("/image", StaticFiles(directory=image_dir), name="image")

@app.get("/", include_in_schema=False)
async def index(request: Request):
    return FileResponse(os.path.join(static_dir, "index.html"))

@app.get("/attraction/{id}", include_in_schema=False)
async def attraction_page(request: Request, id: int):
    return FileResponse(os.path.join(static_dir, "attraction.html"))

@app.get("/booking", include_in_schema=False)
async def booking_page(request: Request):
    return FileResponse(os.path.join(static_dir, "booking.html"))

@app.get("/thankyou", include_in_schema=False)
async def thankyou_page(request: Request):
    return FileResponse(os.path.join(static_dir, "thankyou.html"))
