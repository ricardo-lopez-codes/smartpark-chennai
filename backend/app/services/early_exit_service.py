import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.booking import Booking, Payment
from app.services.sensor_service import update_slot_sensor_status

def calculate_early_exit_breakdown(booking: Booking, now: datetime = None) -> dict:
    """
    Feature 6 & Wallet Refund Policy:
    Refunds are issued 100% EXCLUSIVELY VIA PARK-A-LOT WALLET with 0% cancellation fee.
    """
    if now is None:
        now = datetime.now()
    if now.tzinfo is not None:
        now = now.replace(tzinfo=None)

    start_t = booking.start_time
    if start_t and start_t.tzinfo is not None:
        start_t = start_t.replace(tzinfo=None)

    paid_end_t = booking.paid_end_time
    if paid_end_t and paid_end_t.tzinfo is not None:
        paid_end_t = paid_end_t.replace(tzinfo=None)

    hourly_rate = float(booking.parking_lot.price_per_hour if booking.parking_lot else 40.0)
    duration_hours = float(booking.duration_hours or 2.0)
    booking_charge = float(getattr(booking, 'booking_charge', 10.0) or 10.0)

    if start_t and now <= start_t:
        used_hours = 0.0
        unused_hours = duration_hours
    elif paid_end_t and now >= paid_end_t:
        used_hours = duration_hours
        unused_hours = 0.0
    elif start_t and paid_end_t:
        elapsed_seconds = (now - start_t).total_seconds()
        remaining_seconds = (paid_end_t - now).total_seconds()
        used_hours = max(0.0, round(elapsed_seconds / 3600.0, 2))
        unused_hours = max(0.0, round(remaining_seconds / 3600.0, 2))
    else:
        used_hours = 0.0
        unused_hours = duration_hours

    used_amount = round(used_hours * hourly_rate, 2)
    unused_amount = round(unused_hours * hourly_rate, 2)
    
    # Wallet refund policy: 100% refund, 0 cancellation fee
    cancellation_fee = 0.0
    refund_amount = unused_amount
    
    # Original payment = parking_cost + booking_charge
    parking_cost = round(hourly_rate * duration_hours, 2)
    original_payment = round(booking.amount if booking.amount >= (parking_cost + booking_charge) else (parking_cost + booking_charge), 2)
    
    earned_amount = round(used_amount + booking_charge, 2)
    parking_revenue = round(used_amount, 2)

    return {
        "booking_id": booking.booking_id,
        "booked_until": paid_end_t.strftime("%I:%M %p") if paid_end_t else "N/A",
        "booked_until_iso": paid_end_t.isoformat() if paid_end_t else None,
        "current_time": now.strftime("%I:%M %p"),
        "current_time_iso": now.isoformat(),
        "hourly_rate": hourly_rate,
        "duration_hours": duration_hours,
        "used_hours": used_hours,
        "unused_hours": unused_hours,
        "used_amount": used_amount,
        "unused_amount": unused_amount,
        "cancellation_fee": 0.0,
        "refund_amount": refund_amount,
        "cash_cancellation_fee": 0.0,
        "cash_refund_amount": refund_amount,
        "wallet_cancellation_fee": 0.0,
        "wallet_refund_amount": refund_amount,
        "booking_charge": booking_charge,
        "original_payment": original_payment,
        "earned_amount": earned_amount,
        "parking_revenue": parking_revenue,
        "payment_method": booking.payment_method or "RAZORPAY",
        "refund_type": "WALLET"
    }

async def process_early_exit(booking_id: int, user, db: Session, refund_option: str = "WALLET", is_cancellation: bool = False) -> dict:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to request cancellation for this booking.")

    if booking.status in ["COMPLETED", "CANCELLED", "EARLY_EXIT", "EXPIRED"]:
        raise HTTPException(status_code=400, detail=f"Booking is already closed with status: {booking.status}.")

    if (booking.refund_status and booking.refund_status not in ["NONE", ""]) or (booking.refund_amount and booking.refund_amount > 0):
        raise HTTPException(status_code=400, detail="A refund has already been issued for this booking.")

    now = datetime.now()
    if now.tzinfo is not None:
        now = now.replace(tzinfo=None)

    breakdown = calculate_early_exit_breakdown(booking, now=now)

    final_status = "CANCELLED" if is_cancellation else "EARLY_EXIT"
    booking.status = final_status
    booking.actual_end_time = now
    booking.used_hours = breakdown["used_hours"]
    booking.used_amount = breakdown["used_amount"]
    booking.unused_amount = breakdown["unused_amount"]

    # Refund policy: Always credit 100% unused amount directly to user's PARK-A-LOT Wallet
    cancellation_fee = 0.0
    refund_amt = breakdown["refund_amount"]
    refund_type_val = "WALLET"
    refund_status_val = "REFUNDED_TO_WALLET"
    ref_code = f"WALLET_REFUND_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6].upper()}"

    booking_user = booking.user or db.query(User).filter(User.id == booking.user_id).first()
    if booking_user:
        new_bal = round((booking_user.wallet_balance or 0.0) + refund_amt, 2)
        booking_user.wallet_balance = new_bal
        booking_user.wallet_credits = int(new_bal)

    if is_cancellation:
        msg = f"Booking cancelled. Full refund of ₹{refund_amt:.2f} credited to your PARK-A-LOT Wallet!"
    else:
        msg = f"Full 100% refund of ₹{refund_amt:.2f} credited to your PARK-A-LOT Wallet with ₹0 cancellation fee!"

    booking.cancellation_fee = cancellation_fee
    booking.refund_amount = refund_amt
    booking.refund_type = refund_type_val
    booking.refund_status = refund_status_val
    booking.refund_id = ref_code

    pay_method = (booking.payment_method or "RAZORPAY").upper()
    refund_payment = Payment(
        booking_id=booking.id,
        razorpay_order_id=f"order_refund_{uuid.uuid4().hex[:6]}",
        payment_method=refund_type_val,
        transaction_reference=ref_code,
        vehicle_number=booking.vehicle_number or "TN-09-SP-2026",
        amount=refund_amt,
        status=refund_status_val
    )
    db.add(refund_payment)

    # 3. Update slot availability (if assigned)
    target_slot_id = booking.assigned_position_id or booking.slot_id
    if target_slot_id and target_slot_id > 0:
        await update_slot_sensor_status(db, target_slot_id, "available")

    db.commit()
    db.refresh(booking)

    try:
        from app.models.notification import create_owner_notification
        create_owner_notification(
            db=db,
            parking_lot_id=booking.parking_lot_id,
            title="Early Exit & Wallet Refund",
            message=f"Booking {booking.booking_id} ended early. Refund of ₹{refund_amt:.2f} credited to customer wallet.",
            notif_type="early_exit",
            severity="info"
        )
    except Exception as e:
        print(f"Failed to create owner notification: {e}")

    return {
        "booking_id": booking.booking_id,
        "status": booking.status,
        "actual_end_time": now.isoformat(),
        "used_hours": breakdown["used_hours"],
        "used_amount": breakdown["used_amount"],
        "unused_amount": breakdown["unused_amount"],
        "cancellation_fee": cancellation_fee,
        "refund_amount": refund_amt,
        "booking_charge": breakdown["booking_charge"],
        "original_payment": breakdown["original_payment"],
        "earned_amount": breakdown["earned_amount"],
        "refund_status": refund_status_val,
        "refund_type": refund_type_val,
        "refund_reference": ref_code,
        "payment_method": pay_method,
        "message": msg
    }
