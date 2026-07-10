import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base

class FinancialData(Base):
    __tablename__ = "financial_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    year_month = Column(String, nullable=False, index=True)

    # Ingested GST & UPI daily feeds
    gst_turnover = Column(Float, default=0.0)
    upi_inflow = Column(Float, default=0.0)

    # Account Aggregator bank transactions
    bank_inflow = Column(Float, default=0.0)
    bank_outflow = Column(Float, default=0.0)
    bank_avg_balance = Column(Float, default=0.0)
    bank_min_balance = Column(Float, default=0.0)
    bank_bounce_incidents = Column(Integer, default=0)
    bank_low_balance_months = Column(Integer, default=0)
    bank_od_cc_utilized = Column(Float, default=0.0)

    # EPFO & Utility payments regularities
    epfo_contributions = Column(Float, default=0.0)
    epfo_employee_count = Column(Integer, default=0)
    utility_monthly_units = Column(Integer, default=0)
    utility_payment_regularity = Column(Float, default=1.0)  # 0.0 to 1.0 ratio
    utility_disconnection_events = Column(Integer, default=0)

    # Relationship
    user = relationship("User", back_populates="financial_records")
