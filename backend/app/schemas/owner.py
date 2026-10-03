from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class SlotCreate(BaseModel):
    slot_number: str
    slot_type: Optional[str] = "Car"
    zone: Optional[str] = "Zone A"
    floor: Optional[str] = "Ground Floor"
    price_per_hour: Optional[float] = None
    status: Optional[str] = "available"
    sensor_id: Optional[str] = None

class SlotUpdate(BaseModel):
    slot_number: Optional[str] = None
    slot_type: Optional[str] = None
    zone: Optional[str] = None
    floor: Optional[str] = None
    price_per_hour: Optional[float] = None
    status: Optional[str] = None
    sensor_id: Optional[str] = None

class LotUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    price_per_hour: Optional[float] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    facilities: Optional[str] = None
    max_duration_hours: Optional[int] = None
    cancellation_policy: Optional[str] = None

class OwnerLotSettingsResponse(BaseModel):
    owner_id: int
    parking_lot_id: int
    company_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: str
    total_slots: int
    slot_prefix: str = "A"
    slot_start: int = 1
    slot_end: int = 20
    opening_time: str = "06:00"
    closing_time: str = "23:00"
    price_per_hour: float = 40.0
    facilities: List[str] = []
    description: Optional[str] = None
    cancellation_policy: Optional[str] = None

    class Config:
        from_attributes = True

class OwnerLotSettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    total_slots: Optional[int] = None
    slot_prefix: Optional[str] = None
    slot_start: Optional[int] = None
    slot_end: Optional[int] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    price_per_hour: Optional[float] = None
    facilities: Optional[List[str]] = None
    description: Optional[str] = None
    cancellation_policy: Optional[str] = None

class NotificationMarkRead(BaseModel):
    notification_id: Optional[str] = None

class OwnerDocumentSubmission(BaseModel):
    commercial_license: str
    property_deed_ref: str
    gstin: Optional[str] = None
    govt_id_type: Optional[str] = "Aadhaar / PAN"
    govt_id_number: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    additional_notes: Optional[str] = None

class OwnerAppointmentScheduling(BaseModel):
    appointment_date: str  # YYYY-MM-DD
    appointment_time: str  # e.g. 10:00 AM - 12:00 PM
    contact_person: Optional[str] = None
    contact_phone: str
    site_instructions: Optional[str] = None

