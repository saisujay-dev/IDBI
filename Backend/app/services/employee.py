from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.loan import LoanApplication
from app.models.score import Score
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

class EmployeeService:
    @staticmethod
    async def get_applications(db: AsyncSession) -> List[LoanApplication]:
        result = await db.execute(
            select(LoanApplication)
            .options(selectinload(LoanApplication.score))
            .order_by(LoanApplication.submitted_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_application_by_id(db: AsyncSession, loan_id: UUID) -> LoanApplication:
        result = await db.execute(
            select(LoanApplication)
            .options(selectinload(LoanApplication.score))
            .where(LoanApplication.id == loan_id)
        )
        loan = result.scalar_one_or_none()
        if not loan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan application not found")
        return loan

    @staticmethod
    async def review_loan(db: AsyncSession, loan_id: UUID, new_status: str, underwriter_note: str = None) -> LoanApplication:
        loan = await EmployeeService.get_application_by_id(db, loan_id)
        loan.status = new_status
        
        if loan.score:
            if underwriter_note:
                loan.score.underwriter_note = underwriter_note
        else:
            # Create default scorecard record if none exists (fallback case)
            score = Score(
                loan_application_id=loan.id,
                overall_score=500,
                cash_flow_score=50,
                revenue_score=50,
                compliance_score=50,
                operations_score=50,
                resilience_score=50,
                risk_category="MEDIUM",
                recommendation="REVIEW_MANUALLY",
                underwriter_note=underwriter_note
            )
            db.add(score)
            
        await db.commit()
        
        # Re-fetch loan with score relationship populated
        result = await db.execute(
            select(LoanApplication)
            .options(selectinload(LoanApplication.score))
            .where(LoanApplication.id == loan_id)
        )
        return result.scalar_one()
