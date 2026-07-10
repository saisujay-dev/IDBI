from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.loan import LoanApplicationOut, ReviewAction
from app.services.employee import EmployeeService
from app.dependencies.roles import require_employee
from app.models.user import User
from typing import List
from uuid import UUID

router = APIRouter(prefix="/employee", tags=["Employee Tools"])

@router.get("/applications", response_model=List[LoanApplicationOut])
async def get_applications(
    current_user: User = Depends(require_employee),
    db: AsyncSession = Depends(get_db)
):
    return await EmployeeService.get_applications(db)

@router.get("/application/{id}", response_model=LoanApplicationOut)
async def get_application(
    id: UUID,
    current_user: User = Depends(require_employee),
    db: AsyncSession = Depends(get_db)
):
    return await EmployeeService.get_application_by_id(db, id)

@router.post("/application/{id}/approve", response_model=LoanApplicationOut)
async def approve_application(
    id: UUID,
    action: ReviewAction,
    current_user: User = Depends(require_employee),
    db: AsyncSession = Depends(get_db)
):
    return await EmployeeService.review_loan(db, id, "approved", action.underwriter_note)

@router.post("/application/{id}/reject", response_model=LoanApplicationOut)
async def reject_application(
    id: UUID,
    action: ReviewAction,
    current_user: User = Depends(require_employee),
    db: AsyncSession = Depends(get_db)
):
    return await EmployeeService.review_loan(db, id, "declined", action.underwriter_note)

@router.post("/application/{id}/manual-review", response_model=LoanApplicationOut)
async def manual_review_application(
    id: UUID,
    action: ReviewAction,
    current_user: User = Depends(require_employee),
    db: AsyncSession = Depends(get_db)
):
    return await EmployeeService.review_loan(db, id, "manual_review_required", action.underwriter_note)
