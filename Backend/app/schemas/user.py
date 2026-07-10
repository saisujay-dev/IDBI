from typing import Optional
from pydantic import BaseModel, EmailStr
from uuid import UUID
from app.schemas.profile import ProfileOut

# User schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    status: str
    profile: Optional[ProfileOut] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    employee_id_code: str

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    employee_id_code: Optional[str] = None
    status: Optional[str] = None
