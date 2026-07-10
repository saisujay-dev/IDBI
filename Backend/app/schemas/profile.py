from typing import Optional
from pydantic import BaseModel
from uuid import UUID

class ProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    name: Optional[str] = None
    employee_id_code: Optional[str] = None
    
    # Applicant details
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    aadhaar: Optional[str] = None
    vintage: Optional[str] = None
    employees_count: Optional[int] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    aadhaar: Optional[str] = None
    vintage: Optional[str] = None
    employees_count: Optional[int] = None
