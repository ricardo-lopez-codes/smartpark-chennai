from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.parking import ParkingSlot
from app.schemas.parking import SlotResponse

router = APIRouter(prefix="/slots", tags=["Slots"])

@router.get("/{id}", response_model=SlotResponse)
def get_slot(id: int, db: Session = Depends(get_db)):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    return slot

@router.get("/{id}/status")
def get_slot_status(id: int, db: Session = Depends(get_db)):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    return {
        "id": slot.id,
        "slot_number": slot.slot_number,
        "status": slot.status,
        "magnetic_value": slot.sensor.magnetic_value if slot.sensor else 15.2,
        "vehicle_detected": slot.sensor.vehicle_detected if slot.sensor else False
    }
