import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.profile import Profile
from app.core.security import hash_password
from app.api.auth import router as auth_router
from app.api.applicant import router as applicant_router
from app.api.employee import router as employee_router
from app.api.admin import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bootstrap default Super Admin account on startup
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(User).where(User.email == "admin@idbi.co.in"))
            admin = result.scalar_one_or_none()
            if not admin:
                logger.info("Seeding default Super Admin user (ADMIN-001 / password123)...")
                super_admin = User(
                    email="admin@idbi.co.in",
                    password_hash=hash_password("password123"),
                    role="super_admin",
                    status="active"
                )
                db.add(super_admin)
                await db.flush()
                
                profile = Profile(
                    user_id=super_admin.id,
                    name="Super Admin",
                    employee_id_code="ADMIN-001"
                )
                db.add(profile)
                await db.commit()
                logger.info("Super Admin user bootstrapped successfully!")
        except Exception as e:
            logger.error(f"Error during startup database bootstrap seeding: {e}")
    yield

app = FastAPI(
    title="MSME Financial Health Assessment API",
    description="Backend scoring engine and credit underwriting decision intelligence APIs.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

# Wire subrouters
app.include_router(auth_router)
app.include_router(applicant_router)
app.include_router(employee_router)
app.include_router(admin_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "MSME Financial Health Card API Engine"
    }
