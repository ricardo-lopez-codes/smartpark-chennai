import random
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

    # Calculate remaining seconds based on status
    if now < start_t:
        rem_seconds = int((paid_end_t - start_t).total_seconds())
    else:
        rem_seconds = int((paid_end_t - now).total_seconds())
        if rem_seconds < 0:
            rem_seconds = 0

    return {
        "id": booking.id,
        "booking_id": booking.booking_id,
        "user_id": booking.user_id,
        "parking_lot_id": booking.parking_lot_id,
        "slot_id": booking.slot_id,
        "booking_date": booking.booking_date or start_t.strftime("%Y-%m-%d"),
        "duration_hours": booking.duration_hours or 2,
        "parking_lot_name": booking.parking_lot.name,
        "parking_address": booking.parking_lot.address,
        "area_name": booking.parking_lot.area.name if booking.parking_lot and booking.parking_lot.area else "South Chennai",
        "slot_number": booking.slot.slot_number,
        "start_time": start_t,
        "paid_end_time": paid_end_t,
        "buffer_end_time": buffer_end_t,
        "actual_end_time": booking.actual_end_time,
        "remaining_seconds": rem_seconds,
        "status": booking.status,
        "amount": booking.amount,
        "payment_id": booking.payment_id,
        "created_at": booking.created_at,
        "latitude": booking.parking_lot.latitude,
        "longitude": booking.parking_lot.longitude,
        "opening_time": booking.parking_lot.opening_time,
        "closing_time": booking.parking_lot.closing_time
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
    slot_id: int,
    duration_hours: int,
    booking_date_str: str = None,
    start_time_str: str = None
) -> Booking:
    if duration_hours < 1 or duration_hours > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking duration must be between 1 and 5 hours."
        )

    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Parking slot not found.")

    lot = db.query(ParkingLot).filter(ParkingLot.id == parking_lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found.")

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

    # Operating hours check
    open_h, open_m = [int(x) for x in lot.opening_time.split(":")]
    close_h, close_m = [int(x) for x in lot.closing_time.split(":")]

    paid_end_t = start_t + timedelta(hours=duration_hours)
    buffer_end_t = paid_end_t + timedelta(hours=1)

    # Check if start_time is before opening or paid_end is after closing
    start_time_obj = start_t.time()
    closing_time_obj = time(close_h, close_m)
    opening_time_obj = time(open_h, open_m)

    if start_time_obj < opening_time_obj or paid_end_t.time() > closing_time_obj:
        if paid_end_t.hour > close_h or (paid_end_t.hour == close_h and paid_end_t.minute > close_m):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parking duration exceeds operating hours ({lot.opening_time} – {lot.closing_time})."
            )

    # DOUBLE BOOKING PROTECTION CHECK
    calc_status = check_slot_availability_for_range(
        db=db,
        slot_id=slot.id,
        req_start=start_t,
        req_buffer_end=buffer_end_t,
        is_current_slot_check=(abs((start_t - now).total_seconds()) < 1800)
    )

    if calc_status != "available":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Sorry, this slot was just booked by another user. Please select another slot."
        )

    parking_fee = lot.price_per_hour * duration_hours
    service_fee = 10.0
    total_amount = parking_fee + service_fee

    b_id = generate_booking_id()

    booking_status = "UPCOMING" if start_t > now + timedelta(minutes=5) else "ACTIVE"

    booking = Booking(
        booking_id=b_id,
        user_id=user.id,
        parking_lot_id=lot.id,
        slot_id=slot.id,
        booking_date=booking_date_str,
        duration_hours=duration_hours,
        start_time=start_t,
        paid_end_time=paid_end_t,
        buffer_end_time=buffer_end_t,
        status=booking_status,
        amount=total_amount,
        payment_id=f"pay_razorpay_{b_id}"
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    if booking_status == "ACTIVE":
        await update_slot_sensor_status(db, slot.id, "reserved")

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
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.user_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to cancel this booking.")

    if booking.status in ["COMPLETED", "CANCELLED", "EXPIRED"]:
        raise HTTPException(status_code=400, detail=f"Booking is already {booking.status}.")

    hourly_rate = booking.parking_lot.price_per_hour
    cancellation_fee = hourly_rate
    original_amount = booking.amount
    refund_amount = max(0.0, original_amount - cancellation_fee)

    booking.status = "CANCELLED"
    booking.actual_end_time = datetime.now(timezone.utc)

    db.commit()

    await update_slot_sensor_status(db, booking.slot_id, "available")

    return {
        "booking_id": booking.booking_id,
        "original_amount": original_amount,
        "cancellation_fee": cancellation_fee,
        "refund_amount": refund_amount,
        "status": "CANCELLED"
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
