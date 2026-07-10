from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.models.profile import Profile
from app.schemas.user import UserRegister
from app.core.security import hash_password, verify_password, create_access_token
from sqlalchemy.orm import selectinload

class AuthService:
    @staticmethod
    async def register_applicant(db: AsyncSession, register_data: UserRegister) -> User:
        # Check if email exists
        result = await db.execute(select(User).where(User.email == register_data.email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )

        # Create new User
        new_user = User(
            email=register_data.email,
            password_hash=hash_password(register_data.password),
            role="applicant",
            status="active"
        )
        db.add(new_user)
        await db.flush()  # Populates user ID

        # Create linked Applicant Profile
        new_profile = Profile(
            user_id=new_user.id,
            name=register_data.name
        )
        db.add(new_profile)
        await db.commit()
        
        # Reload user with profile relationship populated
        result = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.id == new_user.id)
        )
        return result.scalar_one()

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> str:
        result = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.email == email)
        )
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect email or password"
            )
        
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User account is {user.status}"
            )

        # Update last login time
        user.last_login = datetime.utcnow()
        await db.commit()

        # Issue access token
        return create_access_token(subject=user.id)
