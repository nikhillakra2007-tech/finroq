import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, AsyncEngine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.pool import NullPool
from app.db.session import Base
from app.core.config import settings
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.db.models import User


TEST_DATABASE_URL = settings.database_url_async.replace('finroq', 'finroq_test')


@pytest_asyncio.fixture(scope="session")
async def test_engine() -> AsyncEngine:
    """Create a fresh test database and tables for the test session."""
    admin_engine = create_async_engine(
        settings.database_url_async.replace('/finroq', '/postgres'),
        isolation_level='AUTOCOMMIT',
        poolclass=NullPool,
    )
    async with admin_engine.connect() as conn:
        await conn.execute(text('DROP DATABASE IF EXISTS finroq_test WITH (FORCE)'))
        await conn.execute(text('CREATE DATABASE finroq_test'))
    await admin_engine.dispose()

    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()

    async with admin_engine.connect() as conn:
        await conn.execute(text('DROP DATABASE IF EXISTS finroq_test WITH (FORCE)'))
    await admin_engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine: AsyncEngine) -> AsyncSession:
    """Create an isolated database session for each test.

    Service code calls ``session.commit()``. To keep the outer transaction
    open so it can be rolled back at teardown (giving each test full
    isolation without changing application logic), commit is made flush-only.
    """
    async_session = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        trans = await session.begin()

        async def _commit_flush_only():
            await session.flush()

        session.commit = _commit_flush_only  # type: ignore[method-assign]
        try:
            yield session
        finally:
            try:
                await trans.rollback()
            except Exception:
                pass


@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncClient:
    """Create an async test client with database override."""
    from app.api.deps import get_db
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url='http://test') as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture
def owner_id() -> str:
    """Provide a test owner ID for unit tests."""
    return 'test-user-001'


import uuid


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user within the isolated session transaction."""
    unique_email = f'test_{uuid.uuid4().hex[:8]}@example.com'
    user = User(
        email=unique_email,
        hashed_password=get_password_hash('password123'),
        full_name='Test User',
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def other_user(db_session: AsyncSession) -> User:
    """Create another test user within the isolated session transaction."""
    unique_email = f'other_{uuid.uuid4().hex[:8]}@example.com'
    user = User(
        email=unique_email,
        hashed_password=get_password_hash('password123'),
        full_name='Other User',
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture
def auth_token(test_user: User) -> str:
    """Create a valid JWT token for testing."""
    return create_access_token(data={"sub": str(test_user.id), "email": test_user.email})


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """Create authorization headers with JWT token."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def other_auth_token(other_user: User) -> str:
    return create_access_token(data={"sub": str(other_user.id), "email": other_user.email})


@pytest.fixture
def other_auth_headers(other_auth_token: str) -> dict:
    return {"Authorization": f"Bearer {other_auth_token}"}