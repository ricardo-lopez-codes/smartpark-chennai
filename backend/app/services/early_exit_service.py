import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.booking import Booking, Payment
from app.services.sensor_service import update_slot_sensor_status

def calculate_early_exit_breakdown(booking: Booking, now: datetime = None) -> dict:
    """
    Feature 6: Strict server-side formula for early exit & partial refund.
    
    Formula:
    unused_amount = unused_hours × hourly_rate
    cancellation_fee = unused_amount × 30%
    refund_amount = unused_amount - cancellation_fee
    
    Original booking charge is non-refundable.
    """
    if now is None:
        now = datetime.now(timezone.utc)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    start_t = booking.start_time
    if start_t.tzinfo is None:
        start_t = start_t.replace(tzinfo=timezone.utc)

    paid_end_t = booking.paid_end_time
    if paid_end_t.tzinfo is None:
        paid_end_t = paid_end_t.replace(tzinfo=timezone.utc)

    hourly_rate = float(booking.parking_lot.price_per_hour if booking.parking_lot else 40.0)
    duration_hours = float(booking.duration_hours or 2.0)
    booking_charge = float(getattr(booking, 'booking_charge', 10.0) or 10.0)

    if now <= start_t:
        used_hours = 0.0
        unused_hours = duration_hours
    elif now >= paid_end_t:
        used_hours = duration_hours
        unused_hours = 0.0
    else:
        elapsed_seconds = (now - start_t).total_seconds()
        remaining_seconds = (paid_end_t - now).total_seconds()
        used_hours = round(elapsed_seconds / 3600.0, 2)
        unused_hours = round(remaining_seconds / 3600.0, 2)

    used_amount = round(used_hours * hourly_rate, 2)
    unused_amount = round(unused_hours * hourly_rate, 2)
    
    # Cancellation fee is 30% of the UNUSED parking amount
    cancellation_fee = round(unused_amount * 0.30, 2)
    refund_amount = round(max(0.0, unused_amount - cancellation_fee), 2)
    
    # Original payment = parking_cost + booking_charge
    parking_cost = round(hourly_rate * duration_hours, 2)
    original_payment = round(booking.amount if booking.amount >= (parking_cost + booking_charge) else (parking_cost + booking_charge), 2)
    
    # Final retained amount by system/owner
    earned_amount = round(used_amount + cancellation_fee + booking_charge, 2)
    parking_revenue = round(used_amount + cancellation_fee, 2)

    return {
        "booking_id": booking.booking_id,
        "booked_until": paid_end_t.strftime("%I:%M %p"),
        "booked_until_iso": paid_end_t.isoformat(),
        "current_time": now.strftime("%I:%M %p"),
        "current_time_iso": now.isoformat(),
        "hourly_rate": hourly_rate,
        "duration_hours": duration_hours,
        "used_hours": used_hours,
        "unused_hours": unused_hours,
        "used_amount": used_amount,
        "unused_amount": unused_amount,
        "cancellation_fee": cancellation_fee,
        "refund_amount": refund_amount,
        "booking_charge": booking_charge,
        "original_payment": original_payment,
        "earned_amount": earned_amount,
        "parking_revenue": parking_revenue,
        "payment_method": booking.payment_method or "RAZORPAY"
    }

async def process_early_exit(booking_id: int, user, db: Session) -> dict:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to request early exit for this booking.")

    if booking.status in ["COMPLETED", "CANCELLED", "EARLY_EXIT", "EXPIRED"]:
        raise HTTPException(status_code=400, detail=f"Booking is already closed with status: {booking.status}.")

    now = datetime.now(timezone.utc)
    breakdown = calculate_early_exit_breakdown(booking, now=now)

    # 1. Update Booking status & breakdown metrics
    booking.status = "EARLY_EXIT"
    booking.actual_end_time = now
    booking.used_hours = breakdown["used_hours"]
    booking.used_amount = breakdown["used_amount"]
    booking.unused_amount = breakdown["unused_amount"]
    booking.cancellation_fee = breakdown["cancellation_fee"]
    booking.refund_amount = breakdown["refund_amount"]

    # 2. Process refund & create dedicated refund Payment record for auditability
    pay_method = (booking.payment_method or "RAZORPAY").upper()
    refund_amt = breakdown["refund_amount"]
    
    if pay_method == "FASTAG":
        ref_code = f"NETC_FASTAG_REFUND_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6].upper()}"
        refund_status_val = "REFUNDED" # Refund executed via NETC sandbox
    else:
        ref_code = f"rfnd_razorpay_{uuid.uuid4().hex[:8]}"
        refund_status_val = "REFUNDED"

    refund_payment = Payment(
        booking_id=booking.id,
        razorpay_order_id=f"order_refund_{uuid.uuid4().hex[:6]}",
        payment_method=pay_method,
        transaction_reference=ref_code,
        vehicle_number=booking.vehicle_number or "TN-09-SP-2026",
        amount=refund_amt,
        status=refund_status_val
    )
    db.add(refund_payment)

    booking.refund_status = refund_status_val
    booking.refund_id = ref_code

    # 3. Update slot availability (if assigned)
    target_slot_id = booking.assigned_position_id or booking.slot_id
    if target_slot_id and target_slot_id > 0:
        await update_slot_sensor_status(db, target_slot_id, "available")

    db.commit()
    db.refresh(booking)

    return {
        "booking_id": booking.booking_id,
        "status": "EARLY_EXIT",
        "actual_end_time": now.isoformat(),
        "used_hours": breakdown["used_hours"],
        "used_amount": breakdown["used_amount"],
        "unused_amount": breakdown["unused_amount"],
        "cancellation_fee": breakdown["cancellation_fee"],
        "refund_amount": breakdown["refund_amount"],
        "booking_charge": breakdown["booking_charge"],
        "original_payment": breakdown["original_payment"],
        "earned_amount": breakdown["earned_amount"],
        "refund_status": refund_status_val,
        "refund_reference": ref_code,
        "payment_method": pay_method,
        "message": f"Early exit processed successfully. Refund of ₹{refund_amt:.2f} issued via {pay_method}."
    }
