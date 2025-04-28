from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, JSON, Date
from sqlalchemy.orm import relationship
from app.core.database import Base 

class MRT(Base):
    __tablename__ = "attraction_mrt"
    id = Column(Integer, primary_key=True, index=True)
    mrt = Column(String(255), unique=True)
    attractions = relationship("Attraction", back_populates="mrt")

class Attraction(Base):
    __tablename__ = "attractions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    category = Column(String(255))
    description = Column(Text)
    address = Column(String(255))
    transport = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    images = Column(JSON)
    attraction_mrt_id = Column(Integer, ForeignKey("attraction_mrt.id"))
    mrt = relationship("MRT", back_populates="attractions")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    attraction_id = Column(Integer, ForeignKey("attractions.id"))
    date = Column(Date)
    time = Column(String)
    price = Column(Integer)

    attraction = relationship("Attraction") 