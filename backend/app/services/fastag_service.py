import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.booking import Booking, Payment

def process_fastag_payment(booking_id: int, amount: float, vehicle_number: str, db: Session):
    """
    Simulates a FASTag / NETC toll tag deduction sandbox transaction.
    Associates the payment with the vehicle VRN and returns transaction metadata.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")

    vrn = vehicle_number.strip().upper() if vehicle_number else "TN-09-SP-2026"
    
    # Generate realistic NETC FASTag transaction reference
    txn_ref = f"NETC_FASTAG_TXN_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6].upper()}"

    # Record Payment in DB
    payment = Payment(
        booking_id=booking.id,
        razorpay_order_id=f"order_fastag_{uuid.uuid4().hex[:6]}",
        payment_method="FASTAG",
        transaction_reference=txn_ref,
        vehicle_number=vrn,
        amount=amount,
        status="SUCCESS"
    )
    db.add(payment)

    # Update Booking record
    booking.payment_method = "FASTAG"
    booking.vehicle_number = vrn
    booking.payment_id = txn_ref
    
    db.commit()
    db.refresh(payment)
    db.refresh(booking)

    return {
        "success": True,
        "payment_method": "FASTAG",
        "status": "SUCCESS",
        "transaction_reference": txn_ref,
        "amount": amount,
        "vehicle_number": vrn,
        "timestamp": payment.created_at.isoformat(),
        "message": f"FASTag payment of ₹{amount:.2f} successfully debited for vehicle {vrn} via NETC Sandbox."
    }

def refund_fastag_payment(payment_id: int, db: Session):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise ValueError("Payment record not found")
    
    payment.status = "REFUNDED"
    db.commit()
    return {
        "success": True,
        "status": "REFUNDED",
        "transaction_reference": payment.transaction_reference,
        "message": f"FASTag refund initiated for reference {payment.transaction_reference}"
    }
