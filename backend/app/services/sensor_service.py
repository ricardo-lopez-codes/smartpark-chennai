from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.parking import ParkingSlot
from app.models.sensor import Sensor
from app.websocket.manager import manager

async def update_slot_sensor_status(db: Session, slot_id: int, status_val: str, mag_val: float = None):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        return None

    slot.status = status_val
    vehicle_det = (status_val == "occupied")

    if not slot.sensor:
        device_id = f"ESP32-MAG-{slot.parking_lot_id:02d}-{slot.slot_number}"
        sensor = Sensor(
            slot_id=slot.id,
            device_id=device_id,
            magnetic_value=mag_val if mag_val is not None else (48.5 if vehicle_det else 15.2),
            vehicle_detected=vehicle_det
        )
        db.add(sensor)
    else:
        slot.sensor.vehicle_detected = vehicle_det
        slot.sensor.magnetic_value = mag_val if mag_val is not None else (48.5 if vehicle_det else 15.2)
        slot.sensor.last_updated = datetime.now(timezone.utc)

    db.commit()
    db.refresh(slot)

    # Broadcast via WebSocket
    await manager.broadcast({
        "type": "SLOT_UPDATE",
        "data": {
            "slot_id": slot.id,
            "parking_lot_id": slot.parking_lot_id,
            "slot_number": slot.slot_number,
            "status": slot.status,
            "vehicle_detected": vehicle_det,
            "magnetic_value": slot.sensor.magnetic_value if slot.sensor else 15.2
        }
    })

    return slot
