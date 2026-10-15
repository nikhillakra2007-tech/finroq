from datetime import timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from app.db.models import User


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(self, email: str, password: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def create_user(self, email: str, password: str, full_name: str | None = None) -> User:
        result = await self.db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            raise ValueError("User with this email already exists")
        
        hashed_password = get_password_hash(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate_or_create_google_user(self, email: str, full_name: str | None = None) -> User:
        clean_email = email.strip().lower()
        if not (clean_email.endswith("@gmail.com") or clean_email.endswith("@googlemail.com")):
            raise ValueError("Google sign-in is strictly restricted to valid @gmail.com accounts.")
        
        result = await self.db.execute(select(User).where(User.email == clean_email))
        user = result.scalar_one_or_none()
        if user:
            return user
        
        import secrets
        random_pw = secrets.token_urlsafe(32)
        hashed_password = get_password_hash(random_pw)
        derived_name = full_name or clean_email.split("@")[0].replace(".", " ").title()
        user = User(
            email=clean_email,
            hashed_password=hashed_password,
            full_name=derived_name,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate_or_create_otp_user(self, identifier: str, full_name: str | None = None) -> User:
        clean_identifier = identifier.strip().lower()
        if "@" in clean_identifier:
            email = clean_identifier
        else:
            digits = "".join(c for c in clean_identifier if c.isdigit())
            email = f"phone_{digits or 'user'}@otp.finroq.internal"

        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            return user

        import secrets
        random_pw = secrets.token_urlsafe(32)
        hashed_password = get_password_hash(random_pw)
        derived_name = full_name or (clean_identifier if "@" in clean_identifier else f"+91 {clean_identifier}")
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=derived_name,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    def create_access_token_for_user(self, user: User) -> str:
        return create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=timedelta(minutes=30),
        )

    async def verify_token(self, token: str) -> User | None:
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return await self.get_user_by_id(int(user_id))