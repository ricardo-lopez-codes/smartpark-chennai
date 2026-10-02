from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class ParkingArea(Base):
    __tablename__ = "parking_areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    
    lots = relationship("ParkingLot", back_populates="area", cascade="all, delete-orphan")

class ParkingLot(Base):
    __tablename__ = "parking_lots"

    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("parking_areas.id"), nullable=False)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_slots = Column(Integer, default=0)
    price_per_hour = Column(Float, default=40.0)
    parking_type = Column(String, default="Covered / Multi-level")
    opening_time = Column(String, default="06:00", nullable=False)
    closing_time = Column(String, default="23:00", nullable=False)
    slot_prefix = Column(String, default="A", nullable=True)
    slot_start_num = Column(Integer, default=1, nullable=True)
    slot_end_num = Column(Integer, default=20, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    phone = Column(String, nullable=True, default="+91 44 2434 1122")
    email = Column(String, nullable=True, default="contact@smartpark.in")
    description = Column(String, nullable=True, default="Multi-level covered smart parking facility with automated sensor monitoring and 24/7 security.")
    facilities = Column(String, nullable=True, default="CCTV, EV Charging, Security, Covered Parking, Accessible Parking")
    max_duration_hours = Column(Integer, default=8)
    extension_buffer_hours = Column(Integer, default=1)
    cancellation_policy = Column(String, default="Full refund minus 1 hour parking fee if cancelled before start time.")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    area = relationship("ParkingArea", back_populates="lots")
    slots = relationship("ParkingSlot", back_populates="parking_lot", cascade="all, delete-orphan")

class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(Integer, primary_key=True, index=True)
    parking_lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    slot_number = Column(String, nullable=False)
    # Statuses: available, occupied, reserved, selected, unavailable
    status = Column(String, default="available", nullable=False)
    sensor_id = Column(String, nullable=True)
    slot_type = Column(String, default="Car")
    zone = Column(String, default="Zone A")
    floor = Column(String, default="Ground Floor")
    price_per_hour = Column(Float, nullable=True)

    parking_lot = relationship("ParkingLot", back_populates="slots")
    sensor = relationship("Sensor", back_populates="slot", uselist=False, cascade="all, delete-orphan")

