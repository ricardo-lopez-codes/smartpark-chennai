from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    vehicle_number: Optional[str] = "TN-09-AB-1234"
    role: Optional[str] = "civilian"

class UserCreate(UserBase):
    password: str

class OwnerRegisterCreate(BaseModel):
    company_name: str
    person_name: str
    number_of_slots: int = Field(20, ge=1, le=500)
    slot_prefix: str = "A"
    slot_start_num: int = 1
    slot_end_num: int = 20
    opening_time: str = "06:00"
    closing_time: str = "23:00"
    phone: str
    email: EmailStr
    password: str
    address: Optional[str] = "11th Main Rd, Anna Nagar, Chennai"
    area_name: Optional[str] = "Anna Nagar"
    price_per_hour: Optional[float] = 40.0

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_number: Optional[str] = None
