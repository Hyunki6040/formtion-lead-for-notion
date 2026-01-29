"""
프로젝트 API
프로젝트 CRUD, 공개 프로젝트 조회
"""

import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.lead import Lead
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectListItem,
    ProjectPublicResponse,
    URLCheckResponse,
)
from app.api.deps import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/projects", tags=["프로젝트"])


def generate_slug(length: int = 8) -> str:
    """랜덤 슬러그 생성"""
    return secrets.token_urlsafe(length)[:length]


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    프로젝트 목록 조회

    - 현재 사용자의 프로젝트만 조회
    - 삭제된 프로젝트 제외
    """
    try:
        # 프로젝트 조회
        projects_query = (
            select(Project)
            .where(Project.owner_id == current_user.user_id)
            .where(Project.deleted_at.is_(None))
            .order_by(Project.created_at.desc())
        )
        
        projects_result = await db.execute(projects_query)
        project_list = projects_result.scalars().all()

        # 각 프로젝트의 리드 수 조회
        projects = []
        for project in project_list:
            # 리드 수 조회
            lead_count_result = await db.execute(
                select(func.count(Lead.lead_id)).where(Lead.project_id == project.project_id)
            )
            lead_count = lead_count_result.scalar() or 0
            
            projects.append(
                ProjectListItem(
                    project_id=project.project_id,
                    name=project.name,
                    notion_url=project.notion_url,
                    public_slug=project.public_slug,
                    created_at=project.created_at,
                    lead_count=lead_count,
                )
            )

        return ProjectListResponse(projects=projects)
    except Exception as e:
        # 에러 로깅
        import traceback
        print(f"프로젝트 목록 조회 에러: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"프로젝트 목록을 불러오는 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    프로젝트 상세 조회

    - 소유자만 조회 가능
    """
    # 프로젝트 조회
    query = (
        select(
            Project,
            func.count(Lead.lead_id).label("lead_count"),
        )
        .outerjoin(Lead, Project.project_id == Lead.project_id)
        .where(Project.project_id == project_id)
        .where(Project.owner_id == current_user.user_id)
        .where(Project.deleted_at.is_(None))
        .group_by(Project.project_id)
    )

    result = await db.execute(query)
    row = result.first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트를 찾을 수 없습니다.",
        )

    project = row[0]
    lead_count = row[1]

    return ProjectResponse(
        project_id=project.project_id,
        name=project.name,
        notion_url=project.notion_url,
        public_slug=project.public_slug,
        ux_config=project.ux_config,
        blind_config=project.blind_config,
        form_config=project.form_config,
        theme_config=project.theme_config or {"primary_color": "#FF5A1F"},
        webhook_url=project.webhook_url,
        slack_webhook_url=project.slack_webhook_url,
        discord_webhook_url=project.discord_webhook_url,
        og_title=project.og_title,
        og_description=project.og_description,
        og_image=project.og_image,
        created_at=project.created_at,
        updated_at=project.updated_at,
        lead_count=lead_count,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    프로젝트 생성

    - public_slug 자동 생성 (미입력 시)
    - 슬러그 중복 확인
    """
    # 슬러그 처리
    public_slug = project_data.public_slug or generate_slug()

    # 슬러그 중복 확인 및 재생성 (최대 10번 시도)
    for _ in range(10):
        result = await db.execute(
            select(Project).where(Project.public_slug == public_slug).where(Project.deleted_at.is_(None))
        )
        if not result.scalar_one_or_none():
            break
        # 중복 시 랜덤 슬러그 재생성
        public_slug = generate_slug(12)
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="슬러그 생성에 실패했습니다. 다시 시도해주세요.",
        )

    # 설정 데이터 변환 (Pydantic 모델이면 dict로, 이미 dict면 그대로 사용)
    def to_dict(config):
        if config is None:
            return None
        if hasattr(config, "model_dump"):
            return config.model_dump()
        if isinstance(config, dict):
            return config
        return config

    # 프로젝트 생성
    project = Project(
        owner_id=current_user.user_id,
        name=project_data.name,
        notion_url=project_data.notion_url,
        public_slug=public_slug,
        ux_config=to_dict(project_data.ux_config),
        blind_config=to_dict(project_data.blind_config),
        form_config=to_dict(project_data.form_config),
        theme_config=to_dict(project_data.theme_config),
        webhook_url=project_data.webhook_url,
        slack_webhook_url=project_data.slack_webhook_url,
        discord_webhook_url=project_data.discord_webhook_url,
        og_title=project_data.og_title,
        og_description=project_data.og_description,
        og_image=project_data.og_image,
    )

    # None인 설정은 기본값 사용
    if project.ux_config is None:
        project.ux_config = {
            "top_form": {"enabled": False, "title": "", "subtitle": ""},
            "bottom_form": {"enabled": True, "title": "이 템플릿, 바로 써도 됩니다.", "subtitle": "짧게 입력하면 블러가 즉시 풀립니다."},
            "entry_modal": {"enabled": False, "title": "", "subtitle": "", "allow_close": True, "delay_seconds": 0},
            "floating_cta": {"enabled": True, "label": "Unlock", "mobile_bottom_fixed": True},
            "inline_blur_gate": {"enabled": False, "title": "", "subtitle": ""},
        }
    if project.blind_config is None:
        project.blind_config = {
            "method": "preview-then-blur",
            "preset": "middle",
            "position": 30,
            "intensity": "medium",
            "preview_height": 3,
            "iframe_height": 600,
            "text_highlight_ratio": 30,
            "keyword_blackout": {"enabled": False, "keywords": [], "case_sensitive": False},
        }
    if project.form_config is None:
        project.form_config = {
            "fields": {
                "email": {"enabled": True, "required": True},
                "name": {"enabled": False, "required": False},
                "company": {"enabled": False, "required": False},
                "role": {"enabled": False, "required": False, "options": ["CEO/Founder", "마케팅 담당자", "세일즈 담당자", "기타"]},
            },
            "consent": {
                "privacy": {"enabled": True, "required": True},
                "marketing": {"enabled": False, "required": False},
            },
            "unlock_duration": 30,
            "button_label": "Unlock",
        }

    db.add(project)
    await db.commit()
    await db.refresh(project)

    return ProjectResponse(
        project_id=project.project_id,
        name=project.name,
        notion_url=project.notion_url,
        public_slug=project.public_slug,
        ux_config=project.ux_config,
        blind_config=project.blind_config,
        form_config=project.form_config,
        theme_config=project.theme_config or {"primary_color": "#FF5A1F"},
        webhook_url=project.webhook_url,
        slack_webhook_url=project.slack_webhook_url,
        discord_webhook_url=project.discord_webhook_url,
        og_title=project.og_title,
        og_description=project.og_description,
        og_image=project.og_image,
        created_at=project.created_at,
        updated_at=project.updated_at,
        lead_count=0,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    프로젝트 수정

    - 소유자만 수정 가능
    - 부분 업데이트 지원
    """
    # 프로젝트 조회
    result = await db.execute(
        select(Project)
        .where(Project.project_id == project_id)
        .where(Project.owner_id == current_user.user_id)
        .where(Project.deleted_at.is_(None))
    )
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트를 찾을 수 없습니다.",
        )

    # 업데이트
    update_data = project_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            if hasattr(value, "model_dump"):
                value = value.model_dump()
            setattr(project, field, value)

    await db.commit()
    await db.refresh(project)

    # 리드 수 조회
    lead_count_result = await db.execute(
        select(func.count(Lead.lead_id)).where(Lead.project_id == project_id)
    )
    lead_count = lead_count_result.scalar() or 0

    return ProjectResponse(
        project_id=project.project_id,
        name=project.name,
        notion_url=project.notion_url,
        public_slug=project.public_slug,
        ux_config=project.ux_config,
        blind_config=project.blind_config,
        form_config=project.form_config,
        theme_config=project.theme_config or {"primary_color": "#FF5A1F"},
        webhook_url=project.webhook_url,
        slack_webhook_url=project.slack_webhook_url,
        discord_webhook_url=project.discord_webhook_url,
        og_title=project.og_title,
        og_description=project.og_description,
        og_image=project.og_image,
        created_at=project.created_at,
        updated_at=project.updated_at,
        lead_count=lead_count,
    )


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    프로젝트 삭제 (Soft delete)

    - 소유자만 삭제 가능
    """
    from datetime import datetime

    # 프로젝트 조회
    result = await db.execute(
        select(Project)
        .where(Project.project_id == project_id)
        .where(Project.owner_id == current_user.user_id)
        .where(Project.deleted_at.is_(None))
    )
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트를 찾을 수 없습니다.",
        )

    # Soft delete
    project.deleted_at = datetime.utcnow()
    await db.commit()

    return {"success": True}


@router.get("/slug/check/{slug}")
async def check_slug_availability(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    슬러그 중복 확인

    - 인증 불필요 (공개 API)
    - 사용 가능한 슬러그인지 확인
    """
    if not slug or len(slug) < 2:
        return {"available": False, "message": "슬러그는 최소 2자 이상이어야 합니다."}
    
    # 슬러그 형식 검증 (영문, 숫자, 하이픈만 허용)
    import re
    if not re.match(r'^[a-z0-9-]+$', slug):
        return {"available": False, "message": "영문, 숫자, 하이픈만 사용할 수 있습니다."}
    
    # 슬러그 중복 확인
    result = await db.execute(
        select(Project).where(Project.public_slug == slug).where(Project.deleted_at.is_(None))
    )
    existing_project = result.scalar_one_or_none()
    
    if existing_project:
        return {"available": False, "message": "이미 사용 중인 슬러그입니다."}
    
    return {"available": True, "message": "사용 가능한 슬러그입니다."}


# 공개 API (인증 불필요)
public_router = APIRouter(prefix="/api/public/projects", tags=["공개 프로젝트"])


def normalize_notion_url(url: str) -> str:
    """
    Notion URL 정규화 (쿼리 파라미터 제거)

    예: https://notion.so/page-id?v=xxx&pvs=4 -> https://notion.so/page-id
    """
    from urllib.parse import urlparse, urlunparse

    parsed = urlparse(url)
    # 쿼리 파라미터와 프래그먼트 제거
    normalized = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path.rstrip('/'),  # 끝 슬래시도 제거
        '',  # params
        '',  # query
        ''   # fragment
    ))
    return normalized


def mask_email(email: str) -> str:
    """
    이메일 마스킹 (j***@gmail.com 형태)
    """
    if not email or '@' not in email:
        return "***@***.***"

    local, domain = email.split('@', 1)
    if len(local) <= 1:
        masked_local = "*"
    else:
        masked_local = local[0] + "***"

    return f"{masked_local}@{domain}"


@public_router.get("/check-url", response_model=URLCheckResponse)
async def check_url_ownership(
    notion_url: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Notion URL 소유권 확인

    - 인증 없이 호출 가능 (선택적 인증)
    - URL이 이미 점유되었는지 확인
    - 점유된 경우 소유자 힌트 제공
    - 로그인 상태에서 본인 URL인 경우 표시
    """
    # URL 정규화 (쿼리 파라미터 제거)
    normalized_url = normalize_notion_url(notion_url)

    # 해당 URL을 사용하는 프로젝트 조회
    result = await db.execute(
        select(Project)
        .where(Project.deleted_at.is_(None))
    )
    projects = result.scalars().all()

    # 정규화된 URL로 비교
    matching_project = None
    for project in projects:
        if normalize_notion_url(project.notion_url) == normalized_url:
            matching_project = project
            break

    if matching_project is None:
        # URL이 점유되지 않음
        return URLCheckResponse(
            is_occupied=False,
            owner_hint=None,
            is_own=False,
            project_id=None,
        )

    # URL이 점유됨 - 소유자 정보 조회
    owner_result = await db.execute(
        select(User).where(User.user_id == matching_project.owner_id)
    )
    owner = owner_result.scalar_one_or_none()

    # 소유자 이메일 힌트 생성
    owner_hint = mask_email(owner.email) if owner else "***@***.***"

    # 로그인한 사용자가 소유자인지 확인
    is_own = current_user is not None and current_user.user_id == matching_project.owner_id

    return URLCheckResponse(
        is_occupied=True,
        owner_hint=owner_hint,
        is_own=is_own,
        project_id=matching_project.project_id if is_own else None,
    )


@public_router.get("/{slug}", response_model=ProjectPublicResponse)
async def get_public_project(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    공개 프로젝트 조회 (공유 링크용)

    - 인증 불필요
    - 설정만 반환
    - 주의: 이 라우트는 /check-url 뒤에 위치해야 함 (FastAPI 라우트 순서)
    """
    result = await db.execute(
        select(Project)
        .where(Project.public_slug == slug)
        .where(Project.deleted_at.is_(None))
    )
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트를 찾을 수 없습니다.",
        )

    return ProjectPublicResponse(
        project_id=project.project_id,
        name=project.name,
        notion_url=project.notion_url,
        ux_config=project.ux_config,
        blind_config=project.blind_config,
        form_config=project.form_config,
        theme_config=project.theme_config or {"primary_color": "#FF5A1F"},
        og_title=project.og_title,
        og_description=project.og_description,
        og_image=project.og_image,
    )




