import math
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.loan import LoanApplication
from app.models.score import Score
from app.models.financial import FinancialData
from app.models.profile import Profile
from app.services.huggingface import HuggingFaceService

# Math helper utilities
def clamp(v: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    return max(min_val, min(max_val, v))

def avg(arr: List[float]) -> float:
    if not arr:
        return 0.0
    return sum(arr) / len(arr)

def std_dev(arr: List[float]) -> float:
    if not arr:
        return 0.0
    mean_val = avg(arr)
    variance = sum((v - mean_val) ** 2 for v in arr) / len(arr)
    return math.sqrt(variance)

def coefficient_of_variation(arr: List[float]) -> float:
    mean_val = avg(arr)
    if mean_val == 0:
        return 1.0
    return std_dev(arr) / mean_val

def trend_slope(arr: List[float]) -> float:
    n = len(arr)
    if n <= 1:
        return 0.0
    x_mean = (n - 1) / 2.0
    y_mean = avg(arr)
    num = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(arr))
    den = sum((i - x_mean) ** 2 for i in range(n))
    slope = num / den if den != 0 else 0.0
    return clamp(slope / (y_mean or 1.0), -1.0, 1.0)

class ScoringService:
    @staticmethod
    async def evaluate_application(db: AsyncSession, loan: LoanApplication) -> Score:
        # 1. Fetch Financial Data for the user
        result = await db.execute(
            select(FinancialData)
            .where(FinancialData.user_id == loan.user_id)
            .order_by(FinancialData.year_month.asc())
        )
        records = list(result.scalars().all())

        # If no records exist, return a fallback baseline score
        if not records:
            score = Score(
                loan_application_id=loan.id,
                overall_score=350,
                cash_flow_score=300,
                revenue_score=300,
                compliance_score=300,
                operations_score=300,
                resilience_score=300,
                risk_category="HIGH",
                recommendation="REQUEST_MORE_DATA",
                underwriter_note="Baseline score assigned. No monthly financial telemetry found for applicant."
            )
            db.add(score)
            return score

        # 2. Extract monthly vectors (limit to last 12 months)
        recent_records = records[-12:]
        gst_turnovers = [r.gst_turnover for r in recent_records]
        upi_inflows = [r.upi_inflow for r in recent_records]
        bank_inflows = [r.bank_inflow for r in recent_records]
        bank_outflows = [r.bank_outflow for r in recent_records]
        employee_counts = [r.epfo_employee_count for r in recent_records]
        utility_units = [r.utility_monthly_units for r in recent_records]
        utility_regularities = [r.utility_payment_regularity for r in recent_records]

        # 3. Compute Sub-scores

        # --- Cash Flow Score ---
        bank_margins = []
        for inf, outf in zip(bank_inflows, bank_outflows):
            if inf == 0:
                bank_margins.append(0.0)
            else:
                bank_margins.append((inf - outf) / inf)
        avg_net_margin = avg(bank_margins)
        upi_trend = trend_slope(upi_inflows)
        payer_diversification = 0.8  # Default baseline for MVP
        avg_monthly_inflow = avg(bank_inflows)
        annual_inflow = avg_monthly_inflow * 12
        inflow_to_loan_ratio = clamp(annual_inflow / loan.amount, 0.0, 3.0) / 3.0

        cash_flow_raw = (
            clamp((avg_net_margin + 0.1) / 0.5) * 0.35 +
            clamp((upi_trend + 1.0) / 2.0) * 0.25 +
            payer_diversification * 0.20 +
            inflow_to_loan_ratio * 0.20
        )
        cash_flow_score = clamp(cash_flow_raw)

        # --- Revenue Consistency ---
        non_zero_gst = [g for g in gst_turnovers if g > 0]
        cv = coefficient_of_variation(non_zero_gst) if non_zero_gst else 1.0
        cv_score = clamp(1.0 - cv)
        activeness_score = len(non_zero_gst) / len(gst_turnovers)
        alignment_correlation = 0.8  # Default correlation baseline
        revenue_raw = cv_score * 0.40 + activeness_score * 0.35 + alignment_correlation * 0.25
        revenue_score = clamp(revenue_raw)

        # --- Compliance Behavior ---
        gst_compliance_rate = 0.95  # Default compliance rate
        delay_penalty = 1.0  # Default delays penalty
        epfo_filings = [r.epfo_contributions for r in recent_records]
        epfo_regularity = len([e for e in epfo_filings if e > 0]) / len(epfo_filings)
        epfo_missing_months = len([e for e in epfo_filings if e == 0])
        epfo_missing_penalty = clamp(1.0 - epfo_missing_months / 12.0)
        compliance_raw = gst_compliance_rate * 0.30 + delay_penalty * 0.30 + epfo_regularity * 0.25 + epfo_missing_penalty * 0.15
        compliance_score = clamp(compliance_raw)

        # --- Operational Continuity ---
        emp_trend = trend_slope(employee_counts)
        emp_trend_score = clamp((emp_trend + 1.0) / 2.0)
        emp_cv = coefficient_of_variation(employee_counts) if len(set(employee_counts)) > 1 else 0.0
        emp_stability = clamp(1.0 - emp_cv)
        util_trend = trend_slope(utility_units)
        util_trend_score = clamp((util_trend + 1.0) / 2.0)
        util_regularity = avg(utility_regularities)
        disconnections = sum(r.utility_disconnection_events for r in recent_records)
        disconnection_penalty = clamp(1.0 - disconnections * 0.3)
        operations_raw = emp_trend_score * 0.25 + emp_stability * 0.25 + util_trend_score * 0.20 + util_regularity * 0.20 + disconnection_penalty * 0.10
        operations_score = clamp(operations_raw)

        # --- Financial Resilience ---
        avg_balance = avg([r.bank_avg_balance for r in recent_records])
        balance_ratio = clamp(avg_balance / (avg_monthly_inflow or 1.0), 0.0, 0.5) / 0.5
        low_balance_months = sum(r.bank_low_balance_months for r in recent_records)
        low_balance_penalty = clamp(1.0 - low_balance_months / 6.0)
        bounce_incidents = sum(r.bank_bounce_incidents for r in recent_records)
        bounce_penalty = clamp(1.0 - bounce_incidents / 10.0)
        od_utilized = avg([r.bank_od_cc_utilized for r in recent_records])
        od_penalty = clamp(1.0 - od_utilized)
        resilience_raw = balance_ratio * 0.30 + low_balance_penalty * 0.30 + bounce_penalty * 0.25 + od_penalty * 0.15
        resilience_score = clamp(resilience_raw)

        # 4. Cross Validation Checks (GST vs actual bank inflows)
        total_gst = sum(gst_turnovers)
        total_bank = sum(bank_inflows)
        total_upi = sum(upi_inflows)
        
        upi_div = abs(total_gst - total_upi) / (total_gst or 1.0)
        bank_div = abs(total_gst - total_bank) / (total_gst or 1.0)
        avg_divergence = (upi_div + bank_div) / 2.0
        
        is_flagged = avg_divergence > 0.40
        fraud_penalty = clamp(avg_divergence * 0.20, 0.0, 0.20) if is_flagged else 0.0

        # 5. Composite Score Calculation
        composite_raw = (
            cash_flow_score * 0.25 +
            revenue_score * 0.20 +
            compliance_score * 0.20 +
            operations_score * 0.20 +
            resilience_score * 0.15
        )
        penalized_score = clamp(composite_raw * (1.0 - fraud_penalty))
        overall_score_val = int(round(penalized_score * 1000.0))

        # 6. Risk Band & Recommendation Classification
        if overall_score_val >= 700:
            risk_band = "LOW"
            recommendation = "APPROVE"
        elif overall_score_val >= 450:
            risk_band = "MEDIUM"
            recommendation = "APPROVE_CONDITIONS"
        else:
            risk_band = "HIGH"
            recommendation = "DECLINE"

        # Apply overrides
        if is_flagged:
            recommendation = "REVIEW_MANUALLY"

        # Generate AI explanation
        sub_scores_map = {
            "cash_flow": int(round(cash_flow_score * 1000.0)),
            "revenue": int(round(revenue_score * 1000.0)),
            "compliance": int(round(compliance_score * 1000.0)),
            "operations": int(round(operations_score * 1000.0)),
            "resilience": int(round(resilience_score * 1000.0)),
        }
        ai_exp = HuggingFaceService.generate_score_explanation(
            overall_score_val,
            sub_scores_map,
            risk_band,
            recommendation
        )

        # Save score object to database
        score = Score(
            loan_application_id=loan.id,
            overall_score=overall_score_val,
            cash_flow_score=sub_scores_map["cash_flow"],
            revenue_score=sub_scores_map["revenue"],
            compliance_score=sub_scores_map["compliance"],
            operations_score=sub_scores_map["operations"],
            resilience_score=sub_scores_map["resilience"],
            risk_category=risk_band,
            recommendation=recommendation,
            cross_val_divergence=float(round(avg_divergence * 100.0, 1)),
            cross_val_flagged=is_flagged,
            underwriter_note=f"Evaluation complete. Risk classification: {risk_band}. GST-Inflow divergence: {round(avg_divergence * 100, 1)}%.",
            ai_explanation=ai_exp
        )
        db.add(score)
        return score
