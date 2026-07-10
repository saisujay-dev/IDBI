from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.schemas.financial import FinancialDataCreate, FinancialDataOut
from app.schemas.loan import LoanApplicationCreate, LoanApplicationOut, ScoreOut
from app.services.applicant import ApplicantService
from app.dependencies.roles import require_applicant
from app.models.user import User
from typing import List

router = APIRouter(prefix="/applicant", tags=["Applicant Tools"])

@router.get("/profile", response_model=ProfileOut)
async def get_profile(
    current_user: User = Depends(require_applicant),
    db: AsyncSession = Depends(get_db)
):
    return await ApplicantService.get_profile(db, current_user.id)

@router.put("/profile", response_model=ProfileOut)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(require_applicant),
    db: AsyncSession = Depends(get_db)
):
    return await ApplicantService.update_profile(db, current_user.id, profile_data)

@router.post("/financial-data", response_model=FinancialDataOut)
async def add_financial(
    financial_data: FinancialDataCreate,
    current_user: User = Depends(require_applicant),
    db: AsyncSession = Depends(get_db)
):
    return await ApplicantService.add_financial_record(db, current_user.id, financial_data)

@router.get("/financial-data", response_model=List[FinancialDataOut])
async def get_financials(
    current_user: User = Depends(require_applicant),
    db: AsyncSession = Depends(get_db)
):
    return await ApplicantService.get_financial_records(db, current_user.id)

@router.post("/apply-loan", response_model=LoanApplicationOut, status_code=status.HTTP_201_CREATED)
async def apply_loan(
    loan_data: LoanApplicationCreate,
    current_user: User = Depends(require_applicant),
    db: AsyncSession = Depends(get_db)
):
    return await ApplicantService.apply_for_loan(db, current_user.id, loan_data)

@router.get("/applications", response_model=List[LoanApplicationOut])
async def get_loans(
    current_user: User = Depends(require_applicant),
    db: AsyncSession = Depends(get_db)
):
    return await ApplicantService.get_applications(db, current_user.id)

@router.get("/score", response_model=ScoreOut)
async def get_score(
    current_user: User = Depends(require_applicant),
    db: AsyncSession = Depends(get_db)
):
    return await ApplicantService.get_latest_score(db, current_user.id)
