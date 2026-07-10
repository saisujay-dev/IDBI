from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.profile import Profile
from app.models.financial import FinancialData
from app.models.loan import LoanApplication
from app.models.score import Score
from app.schemas.profile import ProfileUpdate
from app.schemas.financial import FinancialDataCreate
from app.schemas.loan import LoanApplicationCreate
from sqlalchemy.orm import selectinload
from typing import List
from app.services.scoring import ScoringService

class ApplicantService:
    @staticmethod
    async def get_profile(db: AsyncSession, user_id: str) -> Profile:
        result = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return profile

    @staticmethod
    async def update_profile(db: AsyncSession, user_id: str, data: ProfileUpdate) -> Profile:
        profile = await ApplicantService.get_profile(db, user_id)
        for field, val in data.model_dump(exclude_unset=True).items():
            setattr(profile, field, val)
        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def add_financial_record(db: AsyncSession, user_id: str, data: FinancialDataCreate) -> FinancialData:
        # Check if record for this year_month already exists
        result = await db.execute(
            select(FinancialData)
            .where(FinancialData.user_id == user_id, FinancialData.year_month == data.year_month)
        )
        record = result.scalar_one_or_none()
        if record:
            # Update existing
            for field, val in data.model_dump().items():
                setattr(record, field, val)
        else:
            # Create new
            record = FinancialData(user_id=user_id, **data.model_dump())
            db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def get_financial_records(db: AsyncSession, user_id: str) -> List[FinancialData]:
        result = await db.execute(
            select(FinancialData)
            .where(FinancialData.user_id == user_id)
            .order_by(FinancialData.year_month.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def apply_for_loan(db: AsyncSession, user_id: str, data: LoanApplicationCreate) -> LoanApplication:
        # Create Loan Application
        loan = LoanApplication(
            user_id=user_id,
            amount=data.amount,
            purpose=data.purpose,
            status="pending"
        )
        db.add(loan)
        await db.flush()  # Populates loan.id

        # Calculate Score dynamically using ScoringService
        await ScoringService.evaluate_application(db, loan)

        await db.commit()
        
        # Load loan with score relationship
        result = await db.execute(
            select(LoanApplication)
            .options(selectinload(LoanApplication.score))
            .where(LoanApplication.id == loan.id)
        )
        return result.scalar_one()

    @staticmethod
    async def get_applications(db: AsyncSession, user_id: str) -> List[LoanApplication]:
        result = await db.execute(
            select(LoanApplication)
            .options(selectinload(LoanApplication.score))
            .where(LoanApplication.user_id == user_id)
            .order_by(LoanApplication.submitted_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_latest_score(db: AsyncSession, user_id: str) -> Score:
        # Find latest application with a score
        result = await db.execute(
            select(Score)
            .join(LoanApplication)
            .where(LoanApplication.user_id == user_id)
            .order_by(Score.created_at.desc())
        )
        score = result.scalar_one_or_none()
        if not score:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No credit score calculated yet.")
        return score
