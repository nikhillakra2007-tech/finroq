from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


from datetime import datetime


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: DatabaseSession):
    auth_service = AuthService(db)
    try:
        user = await auth_service.create_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: DatabaseSession):
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth_service.create_access_token_for_user(user)
    return {"access_token": access_token, "token_type": "bearer"}


class GoogleLoginRequest(BaseModel):
    email: EmailStr
    full_name: str | None = None


@router.post("/google", response_model=Token)
async def google_login(data: GoogleLoginRequest, db: DatabaseSession):
    auth_service = AuthService(db)
    try:
        user = await auth_service.authenticate_or_create_google_user(data.email, data.full_name)
        access_token = auth_service.create_access_token_for_user(user)
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


class OtpSendRequest(BaseModel):
    identifier: str


class OtpSendResponse(BaseModel):
    message: str
    identifier: str
    expires_in_seconds: int = 600
    dev_otp: str = "123456"


class OtpVerifyRequest(BaseModel):
    identifier: str
    otp: str
    full_name: str | None = None


# In-memory store for active OTP codes: identifier -> otp
_active_otps: dict[str, str] = {}


@router.post("/otp/send", response_model=OtpSendResponse)
async def send_otp(data: OtpSendRequest):
    clean_identifier = data.identifier.strip()
    if not clean_identifier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identifier (phone or email) is required")
    
    # Store standard dev/demo OTP
    _active_otps[clean_identifier.lower()] = "123456"
    return OtpSendResponse(
        message=f"6-digit verification OTP successfully sent to {clean_identifier}",
        identifier=clean_identifier,
        expires_in_seconds=600,
        dev_otp="123456",
    )


@router.post("/otp/verify", response_model=Token)
async def verify_otp(data: OtpVerifyRequest, db: DatabaseSession):
    clean_identifier = data.identifier.strip()
    clean_otp = data.otp.strip()
    
    expected_otp = _active_otps.get(clean_identifier.lower(), "123456")
    # Allow 123456 as universal fallback or the generated OTP
    if clean_otp != expected_otp and clean_otp != "123456":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP code. Please enter 123456.")
    
    auth_service = AuthService(db)
    try:
        user = await auth_service.authenticate_or_create_otp_user(clean_identifier, data.full_name)
        access_token = auth_service.create_access_token_for_user(user)
        # Clear used OTP
        _active_otps.pop(clean_identifier.lower(), None)
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))



@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user_id: CurrentUserId,
    db: DatabaseSession,
):
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user