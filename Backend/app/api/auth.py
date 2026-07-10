from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.user import UserRegister, UserLogin, UserOut, Token
from app.services.auth import AuthService
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(register_data: UserRegister, db: AsyncSession = Depends(get_db)):
    return await AuthService.register_applicant(db, register_data)

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    token = await AuthService.authenticate_user(db, login_data.email, login_data.password)
    return Token(access_token=token, token_type="bearer")

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
async def logout():
    return {"detail": "Successfully logged out"}
