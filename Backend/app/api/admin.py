from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.user import UserOut, EmployeeCreate, EmployeeUpdate
from app.services.admin import AdminService
from app.dependencies.roles import require_admin
from app.models.user import User
from typing import List
from uuid import UUID

router = APIRouter(prefix="/admin", tags=["Admin Tools"])

@router.post("/create-employee", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_employee(
    emp_data: EmployeeCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return await AdminService.create_employee(db, emp_data)

@router.get("/employees", response_model=List[UserOut])
async def get_employees(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return await AdminService.get_employees(db)

@router.put("/employees/{id}", response_model=UserOut)
async def update_employee(
    id: UUID,
    emp_data: EmployeeUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return await AdminService.update_employee(db, id, emp_data)

@router.delete("/employees/{id}")
async def delete_employee(
    id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return await AdminService.delete_employee(db, id)

@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return await AdminService.get_dashboard_analytics(db)
