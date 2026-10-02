import uuid
from app.config import settings

def create_mock_razorpay_order(amount_in_rupees: float) -> dict:
    order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
    return {
        "id": order_id,
        "entity": "order",
        "amount": int(amount_in_rupees * 100),
        "currency": "INR",
        "receipt": f"receipt_{uuid.uuid4().hex[:8]}",
        "status": "created",
        "key_id": settings.RAZORPAY_KEY_ID
    }

def verify_mock_razorpay_payment(order_id: str, payment_id: str, success: bool = True) -> dict:
    if success:
        return {
            "status": "SUCCESS",
            "transaction_id": payment_id or f"pay_mock_{uuid.uuid4().hex[:12]}",
            "order_id": order_id,
            "message": "Payment verified successfully"
        }
    else:
        return {
            "status": "FAILED",
            "transaction_id": None,
            "order_id": order_id,
            "message": "Payment simulation failed or was cancelled by user"
        }
