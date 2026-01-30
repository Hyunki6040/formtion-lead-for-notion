"""
인증 API
회원가입, 로그인, 현재 사용자 정보
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserResponse
from app.services.webhook import send_discord_signup_notification

router = APIRouter(prefix="/api/auth", tags=["인증"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    사용자 회원가입

    - 이메일 중복 확인
    - 비밀번호 해싱
    - JWT 토큰 발급
    """
    # 이메일 중복 확인
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 가입된 이메일입니다.",
        )

    # 사용자 생성
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Discord 알림 전송 (백그라운드, 실패해도 가입은 완료)
    try:
        await send_discord_signup_notification(
            user_email=user.email,
            user_name=user.name,
        )
    except Exception:
        pass  # 알림 실패해도 가입 프로세스에 영향 없음

    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.user_id})

    return TokenResponse(
        user_id=user.user_id,
        email=user.email,
        name=user.name,
        token=access_token,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    사용자 로그인

    - 이메일/비밀번호 확인
    - JWT 토큰 발급
    """
    # 사용자 조회
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    # 마지막 로그인 시간 업데이트
    user.last_login_at = datetime.utcnow()
    await db.commit()

    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.user_id})

    return TokenResponse(
        user_id=user.user_id,
        email=user.email,
        name=user.name,
        token=access_token,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    현재 로그인한 사용자 정보 조회
    """
    return current_user






