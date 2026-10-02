from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.booking import Booking, Payment
from app.models.user import User
from app.schemas.booking import PaymentInit, PaymentVerify
from app.services.auth import get_current_user
from app.services.payment_service import create_mock_razorpay_order, verify_mock_razorpay_payment

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/create")
def create_payment_order(
    payment_in: PaymentInit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == payment_in.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking record not found.")

    order_data = create_mock_razorpay_order(payment_in.amount)

    payment = Payment(
        booking_id=booking.id,
        razorpay_order_id=order_data["id"],
        amount=payment_in.amount,
        status="PENDING"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "payment_id": payment.id,
        "order_id": order_data["id"],
        "amount": payment_in.amount,
        "currency": "INR",
        "key_id": order_data["key_id"]
    }

@router.post("/verify")
def verify_payment(
    verify_in: PaymentVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.razorpay_order_id == verify_in.razorpay_order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found.")

    result = verify_mock_razorpay_payment(
        order_id=verify_in.razorpay_order_id,
        payment_id=verify_in.razorpay_payment_id,
        success=verify_in.simulate_success
    )

    if result["status"] == "SUCCESS":
        payment.status = "SUCCESS"
        payment.razorpay_payment_id = result["transaction_id"]
        db.commit()
        return {"success": True, "message": "Payment verified successfully", "payment_id": payment.razorpay_payment_id}
    else:
        payment.status = "FAILED"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed or was cancelled.")
