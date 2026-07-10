from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class LoanApplicationCreate(BaseModel):
    amount: float
    purpose: str

class ScoreOut(BaseModel):
    id: UUID
    overall_score: int
    cash_flow_score: int
    revenue_score: int
    compliance_score: int
    operations_score: int
    resilience_score: int
    risk_category: str
    recommendation: str
    cross_val_divergence: float
    cross_val_flagged: bool
    underwriter_note: Optional[str] = None
    ai_explanation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LoanApplicationOut(BaseModel):
    id: UUID
    user_id: UUID
    amount: float
    purpose: str
    status: str
    submitted_at: datetime
    updated_at: datetime
    score: Optional[ScoreOut] = None

    class Config:
        from_attributes = True

class ReviewAction(BaseModel):
    underwriter_note: Optional[str] = None
