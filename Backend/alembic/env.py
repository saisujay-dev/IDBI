import asyncio
import sys
import os
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# Insert the project root directory into sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.database.base import Base
# Import all SQLAlchemy models to register them on Base.metadata
from app.models.user import User
from app.models.profile import Profile
from app.models.financial import FinancialData
from app.models.loan import LoanApplication
from app.models.score import Score

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Dynamically set the sqlalchemy.url option from settings
# Dynamically set the sqlalchemy.url option from settings after removing sslmode if present
database_url = settings.DATABASE_URL
connect_args = {}

if "postgresql+asyncpg" in database_url:
    connect_args["ssl"] = True
    if "sslmode=" in database_url:
        import urllib.parse as urlparse
        url_parts = list(urlparse.urlparse(database_url))
        query = dict(urlparse.parse_qsl(url_parts[4]))
        query.pop('sslmode', None)
        url_parts[4] = urlparse.urlencode(query)
        database_url = urlparse.urlunparse(url_parts)

config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
