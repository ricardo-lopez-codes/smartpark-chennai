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
    device_id_in: Optional[str] = None,
    rssi: Optional[float] = None,
    snr: Optional[float] = None,
    packet_count: Optional[int] = None,
    heartbeat: Optional[bool] = None,
    status_msg: Optional[str] = None,
    timestamp_ms: Optional[int] = None
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        return None

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    # 1. Determine physical sensor vehicle detection state
    raw_status = (status_val or "").upper().strip()
    if vehicle_detected is not None:
        veh_det = vehicle_detected
    elif raw_status:
        veh_det = (raw_status == "OCCUPIED")
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
            rssi=rssi if rssi is not None else -65.0,
            snr=snr if snr is not None else 9.5,
            packet_count=packet_count or 0,
            heartbeat=heartbeat if heartbeat is not None else False,
            status_message=status_msg or (raw_status or "OK"),
            latest_status=raw_status or ("OCCUPIED" if veh_det else "EMPTY"),
            timestamp_ms=timestamp_ms,
            last_updated=now
        )
        db.add(sensor)
    else:
        slot.sensor.device_id = dev_id
        slot.sensor.vehicle_detected = veh_det
        slot.sensor.magnetic_value = final_mag
        if rssi is not None:
            slot.sensor.rssi = rssi
        if snr is not None:
            slot.sensor.snr = snr
        if packet_count is not None:
            slot.sensor.packet_count = packet_count
        if heartbeat is not None:
            slot.sensor.heartbeat = heartbeat
        if status_msg is not None:
            slot.sensor.status_message = status_msg
        if raw_status:
            slot.sensor.latest_status = raw_status
        if timestamp_ms is not None:
            slot.sensor.timestamp_ms = timestamp_ms
        slot.sensor.last_updated = now

    db.commit()
    db.refresh(slot)

    # 5. Broadcast real-time update via WebSocket manager
    try:
        ws_payload = {
            "type": "IOT_SENSOR_UPDATE",
            "data": {
                "device_id": dev_id,
                "slot_id": slot.id,
                "parking_lot_id": slot.parking_lot_id,
                "slot_number": slot.slot_number,
                "slot": slot.slot_number,
                "status": "OCCUPIED" if veh_det else "AVAILABLE",
                "slot_status": "OCCUPIED" if veh_det else "AVAILABLE",
                "online": True,
                "vehicle_detected": veh_det,
                "magnetic_value": final_mag,
                "rssi": slot.sensor.rssi if slot.sensor else rssi,
                "snr": slot.sensor.snr if slot.sensor else snr,
                "packet_count": slot.sensor.packet_count if slot.sensor else packet_count,
                "heartbeat": heartbeat,
                "last_updated": now.isoformat()
            }
        }
        await manager.broadcast(ws_payload)
    except Exception as ws_err:
        print(f"[WebSocket Alert] Could not broadcast sensor update: {ws_err}")

    return slot
