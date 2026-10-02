from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.parking import ParkingArea, ParkingLot, ParkingSlot
from app.models.sensor import Sensor
from app.schemas.user import (
    UserCreate,
    OwnerRegisterCreate,
    UserLogin,
    UserResponse,
    Token,
    ProfileUpdate,
    ForgotPasswordRequest,
    PasswordResetConfirm
)
from app.services.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register/civilian", response_model=Token)
def register_civilian(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        password_hash=get_password_hash(user_in.password),
        vehicle_number=user_in.vehicle_number or "TN-09-AB-1234",
        role="civilian"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=Token)
def register_unified(payload: dict, db: Session = Depends(get_db)):
    role = payload.get("role", "civilian")
    if role == "owner" or "company_name" in payload or "person_name" in payload:
        try:
            owner_in = OwnerRegisterCreate(**payload)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid owner registration parameters: {str(e)}"
            )
        return register_owner(owner_in, db)
    else:
        try:
            user_in = UserCreate(**payload)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid civilian registration parameters: {str(e)}"
            )
        return register_civilian(user_in, db)

@router.post("/register/owner", response_model=Token)
def register_owner(owner_in: OwnerRegisterCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == owner_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # 1. Create Owner User
    user = User(
        name=owner_in.person_name,
        email=owner_in.email,
        phone=owner_in.phone,
        password_hash=get_password_hash(owner_in.password),
        vehicle_number="N/A (Owner)",
        role="owner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Resolve Area
    area = db.query(ParkingArea).filter(ParkingArea.name.ilike(f"%{owner_in.area_name or 'Anna Nagar'}%")).first()
    if not area:
        area = ParkingArea(name=owner_in.area_name or "Anna Nagar")
        db.add(area)
        db.commit()
        db.refresh(area)

    # 3. Create ParkingLot owned by user
    lot = ParkingLot(
        area_id=area.id,
        name=owner_in.company_name,
        address=owner_in.address or f"{area.name}, South Chennai",
        latitude=13.0850,
        longitude=80.2101,
        total_slots=owner_in.number_of_slots,
        price_per_hour=owner_in.price_per_hour or 40.0,
        parking_type="Owner Commercial Space",
        opening_time=owner_in.opening_time or "06:00",
        closing_time=owner_in.closing_time or "23:00",
        slot_prefix=owner_in.slot_prefix or "A",
        slot_start_num=owner_in.slot_start_num or 1,
        slot_end_num=owner_in.slot_end_num or owner_in.number_of_slots,
        owner_id=user.id,
        phone=owner_in.phone,
        email=owner_in.email
    )
    db.add(lot)
    db.commit()
    db.refresh(lot)

    # 4. Generate Slot Range (e.g. A1 to A20)
    prefix = owner_in.slot_prefix or "A"
    start_num = owner_in.slot_start_num or 1
    end_num = owner_in.slot_end_num or (start_num + owner_in.number_of_slots - 1)

    for i in range(start_num, end_num + 1):
        slot_num = f"{prefix}{i}"
        slot = ParkingSlot(
            parking_lot_id=lot.id,
            slot_number=slot_num,
            status="available",
            zone=f"Zone {prefix}",
            price_per_hour=owner_in.price_per_hour or 40.0,
            sensor_id=f"ESP32-MAG-{lot.id:02d}-{slot_num}"
        )
        db.add(slot)
        db.commit()
        db.refresh(slot)

        # Attach IoT sensor
        sensor = Sensor(
            slot_id=slot.id,
            device_id=slot.sensor_id,
            magnetic_value=15.2,
            vehicle_detected=False
        )
        db.add(sensor)

    db.commit()

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        return {
            "message": "If an account exists with this email, password reset instructions have been generated.",
            "success": True
        }
    
    mock_token = f"reset_token_{user.id}_2026"
    return {
        "message": f"Password reset token generated for {user.email}.",
        "reset_token": mock_token,
        "success": True
    }

@router.post("/reset-password")
def reset_password(req: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now log in with your new password.", "success": True}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_profile(profile_in: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.phone is not None:
        current_user.phone = profile_in.phone
    if profile_in.vehicle_number is not None:
        current_user.vehicle_number = profile_in.vehicle_number

    db.commit()
    db.refresh(current_user)
    return current_user
