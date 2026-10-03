import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.booking import Booking, Payment
from app.models.parking import ParkingLot, ParkingSlot
from app.websocket.manager import manager

def reserve_parking_capacity(
    user_id: int,
    parking_lot_id: int,
    start_time: datetime,
    duration_hours: int,
    vehicle_number: str = "TN-09-SP-2026",
    payment_method: str = "RAZORPAY",
    db: Session = None
):
    """
    Feature 3 & 4: Civilian reserves PARKING CAPACITY/TIME, NOT a fixed physical slot.
    Capacity check ensures active bookings do not exceed reservable_capacity (total_slots - buffer_capacity).
    """
    lot = db.query(ParkingLot).filter(ParkingLot.id == parking_lot_id).first()
    if not lot:
        raise ValueError("Parking lot not found")

    if not lot.is_live or lot.verification_status != "APPROVED":
        raise ValueError("This parking facility is currently undergoing owner verification and is not yet open for public bookings.")

    # Calculate time range
    now = datetime.now(timezone.utc)
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    
    paid_end_time = start_time + timedelta(hours=duration_hours)
    grace_end_time = paid_end_time + timedelta(minutes=15)

    # Check active bookings for this lot during the requested window
    active_count = db.query(Booking).filter(
        Booking.parking_lot_id == lot.id,
        Booking.status.in_(["UPCOMING", "ACTIVE", "EXTENDED"]),
        Booking.start_time < paid_end_time,
        Booking.paid_end_time > start_time
    ).count()

    reservable_cap = lot.reservable_capacity or max(1, lot.total_slots - 2)

    if active_count >= reservable_cap:
        raise ValueError(f"Parking facility has reached max reservable capacity ({reservable_cap} slots) for the selected timeframe.")

    booking_code = f"SP-{datetime.now(timezone.utc).strftime('%Y%m%m%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
    total_amount = lot.price_per_hour * duration_hours

    booking = Booking(
        booking_id=booking_code,
        user_id=user_id,
        parking_lot_id=lot.id,
        slot_id=0,  # No fixed slot assigned at booking time!
        assigned_position_id=None,
        assigned_position_name=None,
        is_buffer_assigned=False,
        vehicle_number=vehicle_number or "TN-09-SP-2026",
        payment_method=payment_method,
        booking_date=start_time.strftime("%Y-%m-%d"),
        duration_hours=duration_hours,
        start_time=start_time,
        paid_end_time=paid_end_time,
        buffer_end_time=grace_end_time,
        grace_end_time=grace_end_time,
        status="UPCOMING",
        overstay_status="NONE",
        amount=total_amount,
        payment_id=f"pay_{booking_code.lower()}"
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking

async def assign_dynamic_position_on_arrival(booking_id: int, db: Session):
    """
    Feature 3 & 4: Assigns an available physical parking position dynamically when the vehicle arrives.
    Primary Buffer Use Case: If regular slots are full due to an overstaying vehicle,
    automatically assigns a protected Buffer Space so the reservation is preserved.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")

    if booking.assigned_position_id:
        # Already assigned
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.assigned_position_id).first()
        return {
            "success": True,
            "assigned_position_name": booking.assigned_position_name,
            "is_buffer_assigned": booking.is_buffer_assigned,
            "slot_id": slot.id if slot else None,
            "message": f"Position already assigned: {booking.assigned_position_name}"
        }

    lot_id = booking.parking_lot_id

    # 1. Look for standard available slot (is_buffer == False)
    standard_slot = db.query(ParkingSlot).filter(
        ParkingSlot.parking_lot_id == lot_id,
        ParkingSlot.is_buffer == False,
        ParkingSlot.status == "available"
    ).first()

    assigned_slot = None
    is_buffer_used = False

    if standard_slot:
        assigned_slot = standard_slot
    else:
        # 2. PRIMARY BUFFER USE CASE: Regular slots occupied/affected by overstays.
        # Assign a protected Buffer Space (is_buffer == True)!
        buffer_slot = db.query(ParkingSlot).filter(
            ParkingSlot.parking_lot_id == lot_id,
            ParkingSlot.is_buffer == True,
            ParkingSlot.status == "available"
        ).first()

        if buffer_slot:
            assigned_slot = buffer_slot
            is_buffer_used = True
        else:
            raise ValueError("All physical parking positions (including protected buffer spaces) are currently occupied.")

    # Mark slot status to 'occupied'
    assigned_slot.status = "occupied"
    
    pos_name = f"{assigned_slot.slot_number} ({'Protected Buffer Space' if is_buffer_used else 'Standard Slot'})"

    booking.slot_id = assigned_slot.id
    booking.assigned_position_id = assigned_slot.id
    booking.assigned_position_name = pos_name
    booking.is_buffer_assigned = is_buffer_used
    booking.status = "ACTIVE"

    db.commit()
    db.refresh(booking)

    # Broadcast WebSocket position assignment
    await manager.broadcast({
        "event": "POSITION_ASSIGNED",
        "booking_id": booking.id,
        "booking_code": booking.booking_id,
        "lot_id": lot_id,
        "assigned_position": pos_name,
        "is_buffer": is_buffer_used,
        "slot_id": assigned_slot.id,
        "slot_number": assigned_slot.slot_number
    })

    return {
        "success": True,
        "booking_id": booking.id,
        "assigned_position_name": pos_name,
        "is_buffer_assigned": is_buffer_used,
        "slot_id": assigned_slot.id,
        "slot_number": assigned_slot.slot_number,
        "message": f"Vehicle arrived. Dynamically assigned to {pos_name}."
    }
