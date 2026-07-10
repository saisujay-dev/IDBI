from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.user import User
from app.models.profile import Profile
from app.models.loan import LoanApplication
from app.models.score import Score
from app.schemas.user import EmployeeCreate, EmployeeUpdate
from app.core.security import hash_password
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

class AdminService:
    @staticmethod
    async def create_employee(db: AsyncSession, data: EmployeeCreate) -> User:
        # Check if email exists
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        # Check if employee code exists
        result = await db.execute(select(Profile).where(Profile.employee_id_code == data.employee_id_code))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee code already exists")

        new_user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            role="employee",
            status="active"
        )
        db.add(new_user)
        await db.flush()

        new_profile = Profile(
            user_id=new_user.id,
            name=data.name,
            employee_id_code=data.employee_id_code
        )
        db.add(new_profile)
        await db.commit()

        # Reload with profile
        result = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.id == new_user.id)
        )
        return result.scalar_one()

    @staticmethod
    async def get_employees(db: AsyncSession) -> List[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.role == "employee")
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_employee(db: AsyncSession, emp_id: UUID, data: EmployeeUpdate) -> User:
        result = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.id == emp_id, User.role == "employee")
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        if data.status:
            user.status = data.status
        
        if user.profile:
            if data.name:
                user.profile.name = data.name
            if data.employee_id_code:
                # Check unique
                code_result = await db.execute(
                    select(Profile)
                    .where(Profile.employee_id_code == data.employee_id_code, Profile.user_id != emp_id)
                )
                if code_result.scalar_one_or_none():
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee code already in use")
                user.profile.employee_id_code = data.employee_id_code

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def delete_employee(db: AsyncSession, emp_id: UUID) -> dict:
        result = await db.execute(select(User).where(User.id == emp_id, User.role == "employee"))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        await db.delete(user)
        await db.commit()
        return {"detail": "Employee account deleted successfully"}

    @staticmethod
    async def get_dashboard_analytics(db: AsyncSession) -> dict:
        # Total counts
        total_apps_result = await db.execute(select(func.count(LoanApplication.id)))
        total_apps = total_apps_result.scalar() or 0

        active_emps_result = await db.execute(select(func.count(User.id)).where(User.role == "employee", User.status == "active"))
        active_emps = active_emps_result.scalar() or 0

        active_apps_result = await db.execute(select(func.count(User.id)).where(User.role == "applicant", User.status == "active"))
        active_apps = active_apps_result.scalar() or 0

        # Avg score
        avg_score_result = await db.execute(select(func.avg(Score.overall_score)))
        avg_score = avg_score_result.scalar()
        avg_score_val = round(avg_score) if avg_score is not None else 0

        # Risk categories count
        risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
        risk_result = await db.execute(select(Score.risk_category, func.count(Score.id)).group_by(Score.risk_category))
        for risk, count in risk_result.all():
            if risk in risk_counts:
                risk_counts[risk] = count

        return {
            "total_applications": total_apps,
            "active_employees": active_emps,
            "active_applicants": active_apps,
            "average_score": avg_score_val,
            "risk_distribution": risk_counts
        }
