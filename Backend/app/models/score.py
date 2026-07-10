import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base

class Score(Base):
    __tablename__ = "scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loan_application_id = Column(UUID(as_uuid=True), ForeignKey("loan_applications.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Core credit scores
    overall_score = Column(Integer, nullable=False)
    cash_flow_score = Column(Integer, nullable=False)
    revenue_score = Column(Integer, nullable=False)
    compliance_score = Column(Integer, nullable=False)
    operations_score = Column(Integer, nullable=False)
    resilience_score = Column(Integer, nullable=False)

    # Categories
    risk_category = Column(String, nullable=False)  # LOW, MEDIUM, HIGH
    recommendation = Column(String, nullable=False)  # APPROVE, APPROVE_CONDITIONS, REVIEW_MANUALLY, REQUEST_MORE_DATA, DECLINE

    # Integrity metrics
    cross_val_divergence = Column(Float, default=0.0)
    cross_val_flagged = Column(Boolean, default=False)

    # Descriptive text fields
    underwriter_note = Column(Text, nullable=True)
    ai_explanation = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    loan_application = relationship("LoanApplication", back_populates="score")
