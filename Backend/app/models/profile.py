import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # General info (Employee/Admin/Applicant)
    name = Column(String, nullable=True)
    employee_id_code = Column(String, unique=True, index=True, nullable=True)

    # Applicant details
    business_name = Column(String, nullable=True)
    business_type = Column(String, nullable=True)
    address = Column(String, nullable=True)
    gstin = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    aadhaar = Column(String, nullable=True)
    vintage = Column(String, nullable=True)
    employees_count = Column(Integer, nullable=True)

    # Relationship
    user = relationship("User", back_populates="profile")
