from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.parking import ParkingLot, ParkingSlot
from app.models.user import User
from app.services.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin Owner Verification"])

class DocReviewRequest(BaseModel):
    action: str  # APPROVE or REJECT
    notes: Optional[str] = "Document verified by administrative team."

class PhysicalVerificationRequest(BaseModel):
    verifier_name: str
    verified_capacity: int
    notes: Optional[str] = "Physical facility inspected on-site. Barrier gates, signage, and magnetometer sensors confirmed operational."
    action: str  # APPROVE or REJECT

@router.get("/verifications")
def get_all_owner_verifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 5: Get all owner parking lots for admin 2-stage verification review.
    """
    lots = db.query(ParkingLot).all()
    results = []
    for lot in lots:
        owner = db.query(User).filter(User.id == lot.owner_id).first() if lot.owner_id else None
        results.append({
            "id": lot.id,
            "name": lot.name,
            "address": lot.address,
            "owner_name": owner.name if owner else (lot.contact_person or "N/A"),
            "owner_email": owner.email if owner else (lot.email or "N/A"),
            "owner_phone": owner.phone if owner else (lot.phone or "N/A"),
            "total_slots": lot.total_slots,
            "buffer_capacity": lot.buffer_capacity,
            "reservable_capacity": lot.reservable_capacity,
            "verification_status": lot.verification_status or "DOCUMENT_VERIFICATION_PENDING",
            "is_live": lot.is_live,
            "document_info": lot.document_info or "Commercial Authorization & Property License",
            "document_submitted_at": lot.document_submitted_at.isoformat() if lot.document_submitted_at else None,
            "doc_verified_at": lot.doc_verified_at.isoformat() if lot.doc_verified_at else None,
            "doc_notes": lot.doc_notes,
            "physical_verified_at": lot.physical_verified_at.isoformat() if lot.physical_verified_at else None,
            "physical_verifier_name": lot.physical_verifier_name,
            "physical_verification_notes": lot.physical_verification_notes,
            "verified_capacity": lot.verified_capacity,
            "inspection_appointment_date": lot.inspection_appointment_date.isoformat() if lot.inspection_appointment_date else None,
            "inspection_appointment_time": lot.inspection_appointment_time,
            "inspection_appointment_contact": lot.inspection_appointment_contact,
            "inspection_appointment_notes": lot.inspection_appointment_notes
        })
    return results

@router.post("/verifications/{lot_id}/documents")
def review_owner_documents(
    lot_id: int,
    req: DocReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 5 - Stage 1: Admin reviews and approves/rejects submitted ownership documents.
    """
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found.")

    now = datetime.now(timezone.utc)
    if req.action.upper() == "APPROVE":
        lot.verification_status = "PHYSICAL_VERIFICATION_PENDING"
        lot.doc_verified_at = now
        lot.doc_notes = req.notes or "Stage 1 Document verification completed successfully."
        db.commit()
        return {
            "success": True,
            "lot_id": lot.id,
            "verification_status": lot.verification_status,
            "message": "Stage 1 Document Verification APPROVED. Transitioned to PHYSICAL_VERIFICATION_PENDING."
        }
    else:
        lot.verification_status = "DOCUMENTS_REJECTED"
        lot.doc_notes = req.notes or "Documents rejected due to incomplete commercial authorization proofs."
        lot.is_live = False
        db.commit()
        return {
            "success": False,
            "lot_id": lot.id,
            "verification_status": lot.verification_status,
            "message": "Stage 1 Documents REJECTED."
        }

@router.post("/verifications/{lot_id}/physical")
def record_physical_verification(
    lot_id: int,
    req: PhysicalVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 5 - Stage 2: Admin records on-site physical facility inspection.
    Once BOTH Stage 1 (documents) and Stage 2 (physical) pass, lot becomes APPROVED / LIVE!
    """
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found.")

    now = datetime.now(timezone.utc)
    if req.action.upper() == "APPROVE":
        lot.verification_status = "APPROVED"
        lot.is_live = True
        lot.physical_verified_at = now
        lot.physical_verifier_name = req.verifier_name
        lot.verified_capacity = req.verified_capacity or lot.total_slots
        lot.physical_verification_notes = req.notes or "On-site physical inspection passed. Facility confirmed operational."
        
        # Ensure capacity fields are set
        lot.total_slots = req.verified_capacity or lot.total_slots
        lot.buffer_capacity = 2
        lot.reservable_capacity = max(1, lot.total_slots - 2)

        db.commit()
        return {
            "success": True,
            "lot_id": lot.id,
            "verification_status": lot.verification_status,
            "is_live": lot.is_live,
            "total_slots": lot.total_slots,
            "reservable_capacity": lot.reservable_capacity,
            "buffer_capacity": lot.buffer_capacity,
            "message": "Stage 2 Physical Verification APPROVED! Parking facility is now LIVE and publicly bookable."
        }
    else:
        lot.verification_status = "REJECTED"
        lot.is_live = False
        lot.physical_verified_at = now
        lot.physical_verifier_name = req.verifier_name
        lot.physical_verification_notes = req.notes or "Physical inspection failed."
        db.commit()
        return {
            "success": False,
            "lot_id": lot.id,
            "verification_status": lot.verification_status,
            "message": "Stage 2 Physical Verification REJECTED."
        }
