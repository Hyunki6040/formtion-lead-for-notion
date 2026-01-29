"""
Project 스키마
프로젝트 관련 요청/응답 모델
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl


# UX 패턴 설정 스키마
class TopBottomFormConfig(BaseModel):
    """Top/Bottom 폼 설정"""

    enabled: bool = False
    title: str = ""
    subtitle: str = ""


class EntryModalConfig(BaseModel):
    """Entry Modal 설정"""

    enabled: bool = False
    title: str = ""
    subtitle: str = ""
    allow_close: bool = True
    delay_seconds: int = 0


class FloatingCtaConfig(BaseModel):
    """Floating CTA 설정"""

    enabled: bool = True
    label: str = "Unlock"
    mobile_bottom_fixed: bool = True
    modal_title: str = ""
    modal_subtitle: str = ""


class InlineBlurGateConfig(BaseModel):
    """Inline Blur Gate 설정"""

    enabled: bool = False
    title: str = ""
    subtitle: str = ""


class UXConfig(BaseModel):
    """UX 패턴 설정"""

    top_form: TopBottomFormConfig = TopBottomFormConfig()
    bottom_form: TopBottomFormConfig = TopBottomFormConfig()
    entry_modal: EntryModalConfig = EntryModalConfig()
    floating_cta: FloatingCtaConfig = FloatingCtaConfig()
    inline_blur_gate: InlineBlurGateConfig = InlineBlurGateConfig()


# 블라인드 설정 스키마
class KeywordBlackoutConfig(BaseModel):
    """키워드 블랙아웃 설정"""

    enabled: bool = False
    keywords: List[str] = []
    case_sensitive: bool = False


class BlindConfig(BaseModel):
    """블라인드 설정"""

    method: str = Field(
        default="preview-then-blur",
        pattern="^(none|section-blur|preview-then-blur|keyword-blackout|random-text-highlight)$",
    )
    preset: str = Field(default="middle", pattern="^(top|middle|bottom)$")
    position: int = Field(default=30, ge=0, le=100)
    intensity: str = Field(default="medium", pattern="^(light|medium|strong)$")
    preview_height: int = Field(default=3, ge=1, le=10)
    text_highlight_ratio: Optional[int] = Field(default=30, ge=0, le=100)
    iframe_height: int = Field(default=600, ge=200, le=10000)
    keyword_blackout: KeywordBlackoutConfig = KeywordBlackoutConfig()


# 폼 설정 스키마
class FormFieldConfig(BaseModel):
    """개별 폼 필드 설정"""

    enabled: bool = False
    required: bool = False
    options: Optional[List[str]] = None
    label: Optional[str] = None


class FormFieldsConfig(BaseModel):
    """폼 필드 설정"""

    email: FormFieldConfig = FormFieldConfig(enabled=True, required=True)
    name: FormFieldConfig = FormFieldConfig()
    company: FormFieldConfig = FormFieldConfig()
    role: FormFieldConfig = FormFieldConfig(
        options=["CEO/Founder", "마케팅 담당자", "세일즈 담당자", "기타"]
    )


class ConsentConfig(BaseModel):
    """동의 옵션 설정"""

    enabled: bool = True
    required: bool = True


class ConsentOptionsConfig(BaseModel):
    """동의 옵션 설정"""

    privacy: ConsentConfig = ConsentConfig()
    marketing: ConsentConfig = ConsentConfig(enabled=False, required=False)


class FormConfig(BaseModel):
    """폼 설정"""

    fields: FormFieldsConfig = FormFieldsConfig()
    consent: ConsentOptionsConfig = ConsentOptionsConfig()
    unlock_duration: int = Field(default=30, ge=1, le=365)
    button_label: str = "Unlock"


class ThemeConfig(BaseModel):
    """테마 설정"""

    primary_color: str = Field(default="#FF5A1F", pattern="^#[0-9A-Fa-f]{6}$")


# 프로젝트 요청/응답 스키마
class ProjectCreate(BaseModel):
    """프로젝트 생성 요청"""

    name: str = Field(..., max_length=100)
    notion_url: str = Field(..., max_length=500)
    public_slug: Optional[str] = Field(None, max_length=50, pattern="^[a-zA-Z0-9-]+$")
    ux_config: Optional[UXConfig] = None
    blind_config: Optional[BlindConfig] = None
    form_config: Optional[FormConfig] = None
    theme_config: Optional[ThemeConfig] = None
    webhook_url: Optional[str] = Field(None, max_length=500)
    slack_webhook_url: Optional[str] = Field(None, max_length=500)
    discord_webhook_url: Optional[str] = Field(None, max_length=500)
    og_title: Optional[str] = Field(None, max_length=200)
    og_description: Optional[str] = Field(None, max_length=500)
    og_image: Optional[str] = Field(None, max_length=1000)


class ProjectUpdate(BaseModel):
    """프로젝트 수정 요청"""

    name: Optional[str] = Field(None, max_length=100)
    notion_url: Optional[str] = Field(None, max_length=500)
    ux_config: Optional[UXConfig] = None
    blind_config: Optional[BlindConfig] = None
    form_config: Optional[FormConfig] = None
    theme_config: Optional[ThemeConfig] = None
    webhook_url: Optional[str] = Field(None, max_length=500)
    slack_webhook_url: Optional[str] = Field(None, max_length=500)
    discord_webhook_url: Optional[str] = Field(None, max_length=500)
    og_title: Optional[str] = Field(None, max_length=200)
    og_description: Optional[str] = Field(None, max_length=500)
    og_image: Optional[str] = Field(None, max_length=1000)


class ProjectResponse(BaseModel):
    """프로젝트 상세 응답"""

    project_id: str
    name: str
    notion_url: str
    public_slug: str
    ux_config: dict
    blind_config: dict
    form_config: dict
    theme_config: Optional[dict] = None
    webhook_url: Optional[str] = None
    slack_webhook_url: Optional[str] = None
    discord_webhook_url: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    lead_count: int = 0

    class Config:
        from_attributes = True


class ProjectListItem(BaseModel):
    """프로젝트 목록 아이템"""

    project_id: str
    name: str
    notion_url: str
    public_slug: str
    created_at: datetime
    lead_count: int = 0

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """프로젝트 목록 응답"""

    projects: List[ProjectListItem]


class ProjectPublicResponse(BaseModel):
    """공개 프로젝트 응답 (공유 링크용)"""

    project_id: str
    name: str  # 프로젝트 이름 (북마크 기본값으로 사용)
    notion_url: str
    ux_config: dict
    blind_config: dict
    form_config: dict
    theme_config: Optional[dict] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None

    class Config:
        from_attributes = True


class URLCheckResponse(BaseModel):
    """URL 소유권 확인 응답"""

    is_occupied: bool = False  # URL이 이미 점유되었는지
    owner_hint: Optional[str] = None  # 소유자 이메일 힌트 (예: "j***@gmail.com")
    is_own: bool = False  # 로그인한 사용자 본인의 URL인지
    project_id: Optional[str] = None  # 본인 URL인 경우 프로젝트 ID


