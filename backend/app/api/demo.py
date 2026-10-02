import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.parking import ParkingSlot
from app.models.booking import Booking
from app.schemas.demo import SensorUpdateSchema, JumpTimeSchema, DemoActionSchema
from app.services.sensor_service import update_slot_sensor_status

router = APIRouter(prefix="/demo", tags=["Demo Controls"])

@router.post("/sensor-update")
async def demo_sensor_update(data: SensorUpdateSchema, db: Session = Depends(get_db)):
    slot = await update_slot_sensor_status(
        db=db,
        slot_id=data.slot_id,
        status_val=data.status,
        mag_val=data.magnetic_value
    )
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found.")
    return {"message": f"Slot {slot.slot_number} sensor updated to {slot.status}", "slot_id": slot.id, "status": slot.status}

@router.post("/jump-time")
async def demo_jump_time(data: JumpTimeSchema, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    now = datetime.now(timezone.utc)

    if data.target_state == "15_MIN_REMAINING":
        booking.paid_end_time = now + timedelta(minutes=14, seconds=55)
        booking.buffer_end_time = booking.paid_end_time + timedelta(hours=1)
        booking.status = "ACTIVE"
    elif data.target_state == "EXPIRED":
        booking.paid_end_time = now - timedelta(seconds=10)
        booking.buffer_end_time = now + timedelta(minutes=50)
        booking.status = "EXPIRED"
        booking.actual_end_time = now
        # Slot state dependent on physical sensor
        if booking.slot:
            await update_slot_sensor_status(db, booking.slot_id, "available")
    elif data.target_state == "ACTIVE":
        booking.paid_end_time = now + timedelta(hours=1, minutes=45)
        booking.buffer_end_time = booking.paid_end_time + timedelta(hours=1)
        booking.status = "ACTIVE"

    db.commit()
    db.refresh(booking)

    return {
        "message": f"Booking {booking.booking_id} time adjusted to {data.target_state}",
        "paid_end_time": booking.paid_end_time,
        "remaining_seconds": int((booking.paid_end_time - now).total_seconds())
    }

@router.post("/action")
async def demo_action(data: DemoActionSchema, db: Session = Depends(get_db)):
    action = data.action.upper()

    if action == "RANDOM_SENSOR_TOGGLE":
        slots = db.query(ParkingSlot).filter(ParkingSlot.status.in_(["available", "occupied"])).all()
        if slots:
            target_slot = random.choice(slots)
            new_status = "occupied" if target_slot.status == "available" else "available"
            await update_slot_sensor_status(db, target_slot.id, new_status)
            return {"message": f"Toggled slot {target_slot.slot_number} to {new_status}", "slot_id": target_slot.id}
    
    elif action == "OCCUPY_SLOT" and data.slot_id:
        slot = await update_slot_sensor_status(db, data.slot_id, "occupied")
        return {"message": f"Slot occupied", "slot": slot.slot_number if slot else None}

    elif action == "FREE_SLOT" and data.slot_id:
        slot = await update_slot_sensor_status(db, data.slot_id, "available")
        return {"message": f"Slot set to available", "slot": slot.slot_number if slot else None}

    return {"message": f"Demo action '{data.action}' executed successfully"}
