from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.parking import ParkingSlot
from app.models.sensor import Sensor
from app.models.booking import Booking
from app.websocket.manager import manager

async def update_slot_sensor_status(
    db: Session,
    slot_id: int,
    status_val: Optional[str] = None,
    mag_val: Optional[float] = None,
    vehicle_detected: Optional[bool] = None,
    device_id_in: Optional[str] = None
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        return None

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    # 1. Determine physical sensor vehicle detection state
    if vehicle_detected is not None:
        veh_det = vehicle_detected
    elif status_val:
        veh_det = (status_val.lower() == "occupied")
    else:
        veh_det = False

    # 2. Check for active or upcoming booking for this slot right now
    active_booking = db.query(Booking).filter(
        Booking.slot_id == slot.id,
        Booking.status.in_(["ACTIVE", "CONFIRMED", "PAID", "UPCOMING"]),
        Booking.booking_date == today_str
    ).first()

    # 3. Combine Physical Sensor state with Booking state
    if veh_det:
        combined_status = "occupied"
    elif active_booking:
        combined_status = "reserved"
    else:
        combined_status = "available"

    slot.status = combined_status

    # 4. Update or Create Sensor entity
    dev_id = device_id_in or slot.sensor_id or f"ESP32-MAG-{slot.parking_lot_id:02d}-{slot.slot_number}"
    slot.sensor_id = dev_id

    final_mag = mag_val if mag_val is not None else (48.5 if veh_det else 15.2)

    if not slot.sensor:
        sensor = Sensor(
            slot_id=slot.id,
            device_id=dev_id,
            magnetic_value=final_mag,
            vehicle_detected=veh_det,
            last_updated=now
        )
        db.add(sensor)
    else:
        slot.sensor.device_id = dev_id
        slot.sensor.vehicle_detected = veh_det
        slot.sensor.magnetic_value = final_mag
        slot.sensor.last_updated = now

    db.commit()
    db.refresh(slot)

    # 5. Broadcast real-time update via WebSocket manager
    try:
        await manager.broadcast({
            "type": "SLOT_UPDATE",
            "data": {
                "slot_id": slot.id,
                "parking_lot_id": slot.parking_lot_id,
                "slot_number": slot.slot_number,
                "status": slot.status,
                "vehicle_detected": veh_det,
                "magnetic_value": final_mag,
                "last_updated": now.isoformat()
            }
        })
    except Exception as ws_err:
        print(f"[WebSocket Alert] Could not broadcast sensor update: {ws_err}")

    return slot
