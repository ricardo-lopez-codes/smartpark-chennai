import random
from typing import Optional, List
from datetime import datetime, timedelta, timezone, date, time
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.booking import Booking, Payment
from app.models.parking import ParkingLot, ParkingSlot
from app.models.user import User
from app.services.sensor_service import update_slot_sensor_status

def generate_booking_id() -> str:
    today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    rand_num = random.randint(100, 999)
    return f"SP-{today_str}-{rand_num}"

def format_booking_response(booking: Booking, now: datetime = None) -> dict:
    if now is None:
        now = datetime.now(timezone.utc)
    
    start_t = booking.start_time
    if start_t.tzinfo is None:
        start_t = start_t.replace(tzinfo=timezone.utc)
        
    paid_end_t = booking.paid_end_time
    if paid_end_t.tzinfo is None:
        paid_end_t = paid_end_t.replace(tzinfo=timezone.utc)
        
    buffer_end_t = booking.buffer_end_time
    if buffer_end_t.tzinfo is None:
        buffer_end_t = buffer_end_t.replace(tzinfo=timezone.utc)

    # Dynamic status calculation based on current timestamp
    if booking.status in ["UPCOMING", "ACTIVE", "EXTENDED"]:
        if now < start_t:
            computed_status = "UPCOMING"
            rem_seconds = 0
            seconds_until_start = int((start_t - now).total_seconds())
        elif now >= start_t and now < paid_end_t:
            computed_status = "EXTENDED" if booking.status == "EXTENDED" else "ACTIVE"
            rem_seconds = int((paid_end_t - now).total_seconds())
            seconds_until_start = 0
        else:
            computed_status = "EXPIRED"
            rem_seconds = 0
            seconds_until_start = 0
    else:
        computed_status = booking.status
        rem_seconds = 0
        seconds_until_start = 0

    slot_num = "Assigned on arrival"
    if booking.assigned_position_name:
        slot_num = booking.assigned_position_name
    elif booking.slot:
        slot_num = booking.slot.slot_number

    grace_end_t = booking.grace_end_time or (paid_end_t + timedelta(minutes=15))
    if grace_end_t.tzinfo is None:
        grace_end_t = grace_end_t.replace(tzinfo=timezone.utc)

    return {
        "id": booking.id,
        "booking_id": booking.booking_id,
        "user_id": booking.user_id,
        "parking_lot_id": booking.parking_lot_id,
        "slot_id": booking.slot_id,
        "booking_date": booking.booking_date or start_t.strftime("%Y-%m-%d"),
        "duration_hours": booking.duration_hours or 2,
        "parking_lot_name": booking.parking_lot.name if booking.parking_lot else "PARK-A-LOT Facility",
        "parking_address": booking.parking_lot.address if booking.parking_lot else "South Chennai",
        "area_name": booking.parking_lot.area.name if booking.parking_lot and booking.parking_lot.area else "South Chennai",
        "slot_number": slot_num,
        "assigned_position_name": booking.assigned_position_name,
        "is_buffer_assigned": booking.is_buffer_assigned,
        "vehicle_number": booking.vehicle_number or "TN-09-SP-2026",
        "payment_method": booking.payment_method or "RAZORPAY",
        "start_time": start_t,
        "paid_end_time": paid_end_t,
        "buffer_end_time": buffer_end_t,
        "grace_end_time": grace_end_t,
        "actual_end_time": booking.actual_end_time,
        "remaining_seconds": rem_seconds,
        "seconds_until_start": seconds_until_start,
        "status": computed_status,
        "overstay_status": booking.overstay_status or "NONE",
        "overstay_duration_minutes": booking.overstay_duration_minutes or 0,
        "security_action_required": booking.security_action_required or False,
        "security_action_taken": booking.security_action_taken or False,
        "security_action_notes": booking.security_action_notes,
        "amount": booking.amount,
        "booking_charge": getattr(booking, 'booking_charge', 10.0) or 10.0,
        "used_hours": booking.used_hours,
        "used_amount": booking.used_amount,
        "unused_amount": booking.unused_amount,
        "cancellation_fee": booking.cancellation_fee,
        "refund_amount": booking.refund_amount,
        "refund_status": booking.refund_status or "NONE",
        "refund_id": booking.refund_id,
        "payment_id": booking.payment_id,
        "created_at": booking.created_at,
        "latitude": booking.parking_lot.latitude if booking.parking_lot else 13.0,
        "longitude": booking.parking_lot.longitude if booking.parking_lot else 80.2,
        "opening_time": booking.parking_lot.opening_time if booking.parking_lot else "06:00",
        "closing_time": booking.parking_lot.closing_time if booking.parking_lot else "23:00"
    }

def check_slot_availability_for_range(
    db: Session,
    slot_id: int,
    req_start: datetime,
    req_buffer_end: datetime,
    is_current_slot_check: bool = False
) -> str:
    # 1. Check database for overlapping reservations
    overlapping = db.query(Booking).filter(
        Booking.slot_id == slot_id,
        Booking.status.in_(["UPCOMING", "ACTIVE", "EXTENDED"]),
        Booking.start_time < req_buffer_end,
        Booking.buffer_end_time > req_start
    ).first()

    if overlapping:
        return "reserved"

    # 2. If it's a current live check for today right now, inspect IoT sensor
    if is_current_slot_check:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
        if slot:
            if slot.status in ["occupied", "unavailable"]:
                return slot.status

    return "available"

async def create_booking(
    db: Session,
    user: User,
    parking_lot_id: int,
    slot_id: Optional[int] = None,
    duration_hours: int = 2,
    booking_date_str: str = None,
    start_time_str: str = None,
    vehicle_number: str = "TN-09-SP-2026",
    payment_method: str = "RAZORPAY"
) -> Booking:
    if duration_hours < 1 or duration_hours > 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking duration must be between 1 and 8 hours."
        )

    lot = db.query(ParkingLot).filter(ParkingLot.id == parking_lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found.")

    # Check owner verification status
    if lot.verification_status and lot.verification_status != "APPROVED":
        raise HTTPException(
            status_code=403,
            detail="This parking lot is currently undergoing owner verification and is not yet open for public bookings."
        )

    now = datetime.now(timezone.utc)

    # Parse Date & Time
    if booking_date_str and start_time_str:
        try:
            date_parts = [int(x) for x in booking_date_str.split("-")]
            time_parts = [int(x) for x in start_time_str.split(":")]
            start_t = datetime(date_parts[0], date_parts[1], date_parts[2], time_parts[0], time_parts[1], tzinfo=timezone.utc)
        except Exception:
            start_t = now
            booking_date_str = now.strftime("%Y-%m-%d")
    else:
        start_t = now
        booking_date_str = now.strftime("%Y-%m-%d")

    paid_end_t = start_t + timedelta(hours=duration_hours)
    buffer_end_t = paid_end_t + timedelta(minutes=15)

    # CAPACITY CHECK (Feature 3 & 4)
    # Check active bookings for this lot during the requested window
    active_count = db.query(Booking).filter(
        Booking.parking_lot_id == lot.id,
        Booking.status.in_(["UPCOMING", "ACTIVE", "EXTENDED"]),
        Booking.start_time < paid_end_t,
        Booking.paid_end_time > start_t
    ).count()

    reservable_cap = lot.reservable_capacity if (lot.reservable_capacity is not None and lot.reservable_capacity > 0) else max(1, lot.total_slots - 2)

    if active_count >= reservable_cap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Parking facility has reached max reservable capacity ({reservable_cap} slots) for the selected timeframe."
        )

    # If slot_id was provided (legacy/direct), resolve slot, otherwise leave None for dynamic entry assignment
    target_slot = None
    if slot_id and slot_id > 0:
        target_slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()

    parking_fee = lot.price_per_hour * duration_hours
    booking_charge_val = 10.0
    total_amount = parking_fee + booking_charge_val

    b_id = generate_booking_id()
    booking_status = "UPCOMING" if start_t > now + timedelta(minutes=5) else "ACTIVE"

    booking = Booking(
        booking_id=b_id,
        user_id=user.id,
        parking_lot_id=lot.id,
        slot_id=target_slot.id if target_slot else 0,
        assigned_position_id=target_slot.id if target_slot else None,
        assigned_position_name=target_slot.slot_number if target_slot else None,
        vehicle_number=vehicle_number or user.vehicle_number or "TN-09-SP-2026",
        payment_method=payment_method or "RAZORPAY",
        booking_date=booking_date_str,
        duration_hours=duration_hours,
        start_time=start_t,
        paid_end_time=paid_end_t,
        buffer_end_time=buffer_end_t,
        grace_end_time=buffer_end_t,
        status=booking_status,
        overstay_status="NONE",
        amount=total_amount,
        booking_charge=booking_charge_val,
        payment_id=f"pay_{b_id.lower()}"
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    if target_slot and booking_status == "ACTIVE":
        await update_slot_sensor_status(db, target_slot.id, "reserved")

    return booking

    return booking

async def extend_booking(db: Session, booking_id: int, user: User, additional_hours: int = 1) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.user_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to extend this booking.")

    if booking.status not in ["UPCOMING", "ACTIVE", "EXTENDED"]:
        raise HTTPException(status_code=400, detail="Only active bookings can be extended.")

    new_paid_end = booking.paid_end_time + timedelta(hours=additional_hours)
    new_buffer_end = new_paid_end + timedelta(hours=1)

    booking.paid_end_time = new_paid_end
    booking.buffer_end_time = new_buffer_end
    booking.status = "EXTENDED"
    booking.amount += booking.parking_lot.price_per_hour * additional_hours

    db.commit()
    db.refresh(booking)

    return booking

async def cancel_booking(db: Session, booking_id: int, user: User) -> dict:
    from app.services.early_exit_service import process_early_exit
    res = await process_early_exit(booking_id=booking_id, user=user, db=db)
    return {
        "booking_id": res["booking_id"],
        "original_amount": res["original_payment"],
        "cancellation_fee": res["cancellation_fee"],
        "refund_amount": res["refund_amount"],
        "status": res["status"]
    }

async def check_and_expire_booking(db: Session, booking: Booking):
    now = datetime.now(timezone.utc)
    paid_end_t = booking.paid_end_time.replace(tzinfo=timezone.utc) if booking.paid_end_time.tzinfo is None else booking.paid_end_time
    start_t = booking.start_time.replace(tzinfo=timezone.utc) if booking.start_time.tzinfo is None else booking.start_time
    
    # Transition UPCOMING to ACTIVE when start_time arrives
    if booking.status == "UPCOMING" and now >= start_t and now < paid_end_t:
        booking.status = "ACTIVE"
        db.commit()

    if now >= paid_end_t and booking.status in ["UPCOMING", "ACTIVE", "EXTENDED"]:
        booking.status = "EXPIRED"
        booking.actual_end_time = now
        db.commit()

        slot = booking.slot
        if slot and slot.sensor:
            if slot.sensor.vehicle_detected:
                await update_slot_sensor_status(db, slot.id, "occupied")
            else:
                await update_slot_sensor_status(db, slot.id, "available")
        else:
            await update_slot_sensor_status(db, slot.id, "available")
