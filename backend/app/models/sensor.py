from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), unique=True, nullable=False)
    device_id = Column(String, nullable=False, index=True)
    magnetic_value = Column(Float, default=15.2)  # dummy microtesla / mag value
    vehicle_detected = Column(Boolean, default=False)
    rssi = Column(Float, nullable=True, default=-65.0)
    snr = Column(Float, nullable=True, default=9.5)
    packet_count = Column(Integer, default=0)
    heartbeat = Column(Boolean, default=False)
    status_message = Column(String, nullable=True)
    latest_status = Column(String, default="EMPTY")
    timestamp_ms = Column(Integer, nullable=True)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    slot = relationship("ParkingSlot", back_populates="sensor")
