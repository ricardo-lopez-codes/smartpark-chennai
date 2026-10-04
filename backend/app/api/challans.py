from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.user import User
from app.models.challan import FineChallan
from app.schemas.challan import FineChallanResponse, PayChallanRequest
from app.services.auth import get_current_user

router = APIRouter(prefix="/challans", tags=["Fine Challans"])

@router.get("/me", response_model=List[FineChallanResponse])
@router.get("/my-challans", response_model=List[FineChallanResponse])
def get_my_challans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns list of fine challans/bills issued to the logged-in civilian user.
    """
    challans = db.query(FineChallan).filter(FineChallan.user_id == current_user.id).order_by(FineChallan.issued_at.desc()).all()
    return challans

@router.post("/{challan_id}/pay", response_model=FineChallanResponse)
def pay_fine_challan(
    challan_id: str,
    payload: PayChallanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Pays an outstanding fine challan using wallet balance or demo payment.
    """
    challan = db.query(FineChallan).filter(FineChallan.challan_id == challan_id, FineChallan.user_id == current_user.id).first()
    if not challan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fine challan '{challan_id}' not found."
        )

    if challan.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fine challan is already paid."
        )

    # Process wallet deduction if user has balance
    if current_user.wallet_balance >= challan.fine_amount:
        current_user.wallet_balance = round(current_user.wallet_balance - challan.fine_amount, 2)

    now = datetime.now(timezone.utc)
    challan.status = "PAID"
    challan.paid_at = now
    challan.payment_reference = f"PAY-CH-WALLET-{int(now.timestamp())}"

    db.commit()
    db.refresh(challan)
    return challan
