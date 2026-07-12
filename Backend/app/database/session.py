from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Clean database URL by removing sslmode if present, because asyncpg doesn't support sslmode parameter in URL
database_url = settings.DATABASE_URL
connect_args = {}

if "postgresql+asyncpg" in database_url:
    # asyncpg uses ssl=True instead of sslmode=require
    connect_args["ssl"] = True
    if "sslmode=" in database_url:
        import urllib.parse as urlparse
        url_parts = list(urlparse.urlparse(database_url))
        query = dict(urlparse.parse_qsl(url_parts[4]))
        query.pop('sslmode', None)
        url_parts[4] = urlparse.urlencode(query)
        database_url = urlparse.urlunparse(url_parts)

engine = create_async_engine(database_url, connect_args=connect_args, echo=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
