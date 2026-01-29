"""
Project 모델
리드 수집 프로젝트 정보
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from uuid import uuid4

from app.core.database import Base


class Project(Base):
    """프로젝트 테이블"""

    __tablename__ = "projects"

    # Primary Key
    project_id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))

    # Foreign Key
    owner_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)

    # 프로젝트 정보
    name = Column(String(100), nullable=False, default="Untitled Project")
    notion_url = Column(String(500), nullable=False)
    public_slug = Column(String(50), unique=True, nullable=False, index=True)

    # 설정 (JSON)
    ux_config = Column(
        JSON,
        nullable=False,
        default={
            "top_form": {"enabled": False, "title": "", "subtitle": ""},
            "bottom_form": {"enabled": True, "title": "이 템플릿, 바로 써도 됩니다.", "subtitle": "짧게 입력하면 블러가 즉시 풀립니다."},
            "entry_modal": {
                "enabled": False,
                "title": "",
                "subtitle": "",
                "allow_close": True,
                "delay_seconds": 0,
            },
            "floating_cta": {
                "enabled": True,
                "label": "Unlock",
                "mobile_bottom_fixed": True,
            },
            "inline_blur_gate": {"enabled": False, "title": "", "subtitle": ""},
        },
    )

    blind_config = Column(
        JSON,
        nullable=False,
        default={
            "method": "preview-then-blur",
            "preset": "middle",
            "position": 30,
            "intensity": "medium",
            "preview_height": 3,
            "iframe_height": 600,
            "text_highlight_ratio": 30,
            "keyword_blackout": {
                "enabled": False,
                "keywords": [],
                "case_sensitive": False,
            },
        },
    )

    form_config = Column(
        JSON,
        nullable=False,
        default={
            "fields": {
                "email": {"enabled": True, "required": True},
                "name": {"enabled": False, "required": False},
                "company": {"enabled": False, "required": False},
                "role": {
                    "enabled": False,
                    "required": False,
                    "options": ["CEO/Founder", "마케팅 담당자", "세일즈 담당자", "기타"],
                },
            },
            "consent": {
                "privacy": {"enabled": True, "required": True},
                "marketing": {"enabled": False, "required": False},
            },
            "unlock_duration": 30,
            "button_label": "Unlock",
        },
    )

    theme_config = Column(
        JSON,
        nullable=False,
        default={
            "primary_color": "#FF5A1F",  # FORMTION Orange (기본값)
        },
    )

    # Webhook 설정
    webhook_url = Column(String(500), nullable=True)
    slack_webhook_url = Column(String(500), nullable=True)
    discord_webhook_url = Column(String(500), nullable=True)

    # OG 메타 태그 설정
    og_title = Column(String(200), nullable=True)
    og_description = Column(String(500), nullable=True)
    og_image = Column(String(1000), nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    # 관계
    owner = relationship("User", back_populates="projects")
    leads = relationship("Lead", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project(project_id={self.project_id}, name={self.name})>"


