from pydantic import BaseModel
from uuid import UUID

class FinancialDataCreate(BaseModel):
    year_month: str
    gst_turnover: float = 0.0
    upi_inflow: float = 0.0
    bank_inflow: float = 0.0
    bank_outflow: float = 0.0
    bank_avg_balance: float = 0.0
    bank_min_balance: float = 0.0
    bank_bounce_incidents: int = 0
    bank_low_balance_months: int = 0
    bank_od_cc_utilized: float = 0.0
    epfo_contributions: float = 0.0
    epfo_employee_count: int = 0
    utility_monthly_units: int = 0
    utility_payment_regularity: float = 1.0
    utility_disconnection_events: int = 0

class FinancialDataOut(FinancialDataCreate):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True
