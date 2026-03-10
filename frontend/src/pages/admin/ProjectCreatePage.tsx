import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { isValidNotionUrl, generateSlug } from '../../lib/utils'
import { projectApi } from '../../lib/api'
import LivePreview from '../../components/admin/LivePreview'
import UXConfigSection from '../../components/admin/UXConfigSection'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Switch from '../../components/ui/Switch'
import Select from '../../components/ui/Select'
import ColorPicker from '../../components/ui/ColorPicker'
import { Card, CardContent } from '../../components/ui/Card'
import { cn } from '../../lib/utils'

interface ProjectData {
  name: string
  notion_url: string
  public_slug: string
  ux_config: {
    top_form: { enabled: boolean; title: string; subtitle: string }
    bottom_form: { enabled: boolean; title: string; subtitle: string }
    entry_modal: { enabled: boolean; title: string; subtitle: string; allow_close: boolean; delay_seconds: number }
    floating_cta: { enabled: boolean; label: string; mobile_bottom_fixed: boolean; modal_title?: string; modal_subtitle?: string }
    inline_blur_gate: { enabled: boolean; title: string; subtitle: string }
  }
  blind_config: {
    method: string
    preset: string
    position: number
    intensity: string
    iframe_height: number
    text_highlight_ratio: number
  }
  form_config: {
    fields: {
      email: { enabled: boolean; required: boolean }
      name: { enabled: boolean; required: boolean }
      company: { enabled: boolean; required: boolean }
      role: { enabled: boolean; required: boolean }
      detail: { enabled: boolean; required: boolean }
    }
    consent: {
      privacy: { enabled: boolean; required: boolean }
      marketing: { enabled: boolean; required: boolean }
    }
    unlock_duration: number
    button_label: string
    texts: {
      email_placeholder: string
      name_placeholder: string
      company_placeholder: string
      role_placeholder: string
      privacy_label: string
      marketing_label: string
      trust_text: string
      skip_label: string
      detail_placeholder: string
    }
  }
  theme_config: {
    primary_color: string
  }
}

const defaultProjectData: ProjectData = {
  name: '',
  notion_url: '',
  public_slug: '',
  ux_config: {
    top_form: { enabled: false, title: '계속 보기 전에, 10초만.', subtitle: '한 번만 입력하면 바로 전체가 열려요. 다음부터는 자동이에요.' },
    bottom_form: { enabled: false, title: '계속 보기 전에, 10초만.', subtitle: '한 번만 입력하면 바로 전체가 열려요. 다음부터는 자동이에요.' },
    entry_modal: { enabled: true, title: '계속 보기 전에, 10초만.', subtitle: '한 번만 입력하면 바로 전체가 열려요. 다음부터는 자동이에요.', allow_close: true, delay_seconds: 3 },
    floating_cta: { enabled: false, label: 'Unlock', mobile_bottom_fixed: true },
    inline_blur_gate: { enabled: false, title: '여기서부터 핵심 내용이에요', subtitle: '이메일 입력하면 전체 내용이 바로 열립니다' },
  },
  blind_config: {
    method: 'preview-then-blur',
    preset: 'middle',
    position: 50,
    intensity: 'medium',
    iframe_height: 600,
    text_highlight_ratio: 30,
  },
  form_config: {
    fields: {
      email: { enabled: true, required: true },
      name: { enabled: true, required: false },
      company: { enabled: true, required: false },
      role: { enabled: false, required: false },
      detail: { enabled: false, required: false },
    },
    consent: {
      privacy: { enabled: true, required: true },
      marketing: { enabled: true, required: false },
    },
    unlock_duration: 30,
    button_label: '전체 내용 보기',
    texts: {
      email_placeholder: '이메일',
      name_placeholder: '이름',
      company_placeholder: '회사명',
      role_placeholder: '직무 선택',
      privacy_label: '개인정보 처리에 동의합니다.',
      marketing_label: '업데이트/새 템플릿 소식을 받아볼래요.',
      trust_text: '스팸 없음 · 한 번만 입력 · 재방문시 자동 열림',
      skip_label: '나중에 할게요',
      detail_placeholder: '세부사항을 입력해주세요.',
    },
  },
  theme_config: {
    primary_color: '#FF5A1F',
  },
}

export default function ProjectCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToast } = useToast()

  const [data, setData] = useState<ProjectData>(() => {
    // URL 파라미터에서 notion_url 읽기
    const urlParam = searchParams.get('url')
    if (urlParam) {
      return {
        ...defaultProjectData,
        notion_url: decodeURIComponent(urlParam),
      }
    }
    return defaultProjectData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [slugChecking, setSlugChecking] = useState(false)

  // 설정 패널 섹션 열림/닫힘 상태
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    ux: true,
    blind: false,
    form: false,
    theme: false,
  })

  // 슬러그 자동 생성
  useEffect(() => {
    if (data.name && !data.public_slug) {
      setData(prev => ({
        ...prev,
        public_slug: generateSlug(),
      }))
    }
  }, [data.name])

  // 슬러그 중복 확인
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug) return
    setSlugChecking(true)
    try {
      await projectApi.checkSlug(slug)
      setErrors(prev => ({ ...prev, public_slug: '' }))
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErrors(prev => ({ ...prev, public_slug: '이미 사용 중인 슬러그입니다.' }))
      }
    } finally {
      setSlugChecking(false)
    }
  }, [])

  // 슬러그 변경 시 중복 확인 (디바운스)
  useEffect(() => {
    if (!data.public_slug) return
    const timer = setTimeout(() => {
      checkSlugAvailability(data.public_slug)
    }, 500)
    return () => clearTimeout(timer)
  }, [data.public_slug, checkSlugAvailability])

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const validateData = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!data.name.trim()) {
      newErrors.name = '프로젝트 이름을 입력해주세요.'
    }

    if (!data.notion_url.trim()) {
      newErrors.notion_url = 'Notion URL을 입력해주세요.'
    } else if (!isValidNotionUrl(data.notion_url)) {
      newErrors.notion_url = '올바른 Notion URL을 입력해주세요.'
    }

    if (!data.public_slug.trim()) {
      newErrors.public_slug = '슬러그를 입력해주세요.'
    }

    // 최소 하나의 UX 패턴 선택 확인
    const hasActiveUX = Object.values(data.ux_config).some(config => config.enabled)
    if (!hasActiveUX) {
      newErrors.ux_config = '최소 하나의 폼 방식을 선택해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateData()) return

    setIsSubmitting(true)
    try {
      const response = await projectApi.create(data)
      const projectId = response.data.project_id
      addToast({ type: 'success', message: '프로젝트가 생성되었습니다!' })
      navigate(`/admin/projects/${projectId}`)
    } catch (error: any) {
      let message = '프로젝트 생성에 실패했습니다.'
      const detail = error.response?.data?.detail
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail[0]?.msg || message
      }
      addToast({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreview = () => {
    window.open(`/v/${data.public_slug || generateSlug()}`, '_blank')
  }

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
      {/* 헤더 */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 z-40">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/admin/projects" className="flex items-center gap-2 text-text-muted hover:text-text-primary">
                <ArrowLeft className="w-4 h-4" />
                <span>프로젝트 목록</span>
              </Link>
              <span className="text-text-muted">|</span>
              <span className="text-sm text-text-secondary">새 프로젝트 만들기</span>
            </div>

            <div className="flex items-center gap-2">
              {/* 모바일: 설정 패널 토글 */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="lg:hidden p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-gray-100"
                title={showSettings ? '설정 숨기기' : '설정 보기'}
              >
                {showSettings ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
              </button>

              {data.notion_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="hidden sm:flex"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  미리보기
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleSave}
                isLoading={isSubmitting}
                disabled={!data.notion_url || !data.name}
              >
                <Save className="w-4 h-4 mr-1" />
                저장
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 미리보기 */}
        <div className={cn(
          'flex-1 bg-gray-50 transition-all duration-300',
          showSettings ? 'lg:mr-0' : 'lg:mr-0'
        )}>
          <LivePreview
            notionUrl={data.notion_url}
            uxConfig={data.ux_config}
            blindConfig={data.blind_config}
            formConfig={data.form_config}
            themeConfig={data.theme_config}
          />
        </div>

        {/* 우측: 설정 패널 */}
        <div className={cn(
          'bg-white border-l border-gray-200 transition-all duration-300',
          'w-80 lg:w-96 flex-shrink-0',
          showSettings ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
          'fixed lg:relative top-14 lg:top-0 right-0 h-[calc(100vh-3.5rem)] lg:h-full z-30'
        )}>
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* 기본 정보 */}
              <SettingsSection
                title="프로젝트 기본 정보"
                isOpen={openSections.basic}
                onToggle={() => toggleSection('basic')}
              >
                <div className="space-y-4">
                  <Input
                    label="프로젝트 이름"
                    placeholder="예: 마케팅 가이드"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    error={errors.name}
                    required
                  />
                  <Input
                    label="Notion URL"
                    placeholder="https://www.notion.so/..."
                    value={data.notion_url}
                    onChange={(e) => setData({ ...data, notion_url: e.target.value })}
                    error={errors.notion_url}
                    helperText="공유된 Notion 페이지의 URL을 입력하세요"
                    required
                  />
                  <Input
                    label="공유 링크 슬러그"
                    placeholder="자동 생성됩니다"
                    value={data.public_slug}
                    onChange={(e) => setData({
                      ...data,
                      public_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })}
                    error={errors.public_slug}
                    helperText={slugChecking ? '확인 중...' : `공유 링크: ${window.location.origin}/v/${data.public_slug || 'example'}`}
                  />
                </div>
              </SettingsSection>

              {/* UX 패턴 */}
              <SettingsSection
                title="폼을 어디에 보여줄까요?"
                isOpen={openSections.ux}
                onToggle={() => toggleSection('ux')}
              >
                <div className="space-y-4">
                  <UXConfigSection
                    uxConfig={data.ux_config}
                    onUpdate={(updates) =>
                      setData({
                        ...data,
                        ux_config: { ...data.ux_config, ...updates },
                      })
                    }
                  />
                  {errors.ux_config && (
                    <p className="text-sm text-red-600">{errors.ux_config}</p>
                  )}
                </div>
              </SettingsSection>

              {/* 블라인드 설정 */}
              <SettingsSection
                title="어떻게 가릴까요?"
                isOpen={openSections.blind}
                onToggle={() => toggleSection('blind')}
              >
                <div className="space-y-4">
                  <Select
                    label="블라인드 방식"
                    options={[
                      { value: 'none', label: '없음 (블라인드 사용 안함)' },
                      { value: 'section-blur', label: '전체 블러' },
                      { value: 'preview-then-blur', label: '프리뷰 + 블러' },
                      { value: 'random-text-highlight', label: '랜덤 텍스트 하이라이트' },
                    ]}
                    value={data.blind_config.method}
                    onChange={(e) =>
                      setData({
                        ...data,
                        blind_config: { ...data.blind_config, method: e.target.value },
                      })
                    }
                  />
                  {data.blind_config.method !== 'none' && (
                    <>
                      <Select
                        label="블러 강도"
                        options={[
                          { value: 'light', label: '약함' },
                          { value: 'medium', label: '보통' },
                          { value: 'strong', label: '강함' },
                        ]}
                        value={data.blind_config.intensity}
                        onChange={(e) =>
                          setData({
                            ...data,
                            blind_config: { ...data.blind_config, intensity: e.target.value },
                          })
                        }
                      />
                      <Select
                        label="블러 시작 위치"
                        options={[
                          { value: 'top', label: '상단 (30%)' },
                          { value: 'middle', label: '중간 (50%)' },
                          { value: 'bottom', label: '하단 (70%)' },
                        ]}
                        value={data.blind_config.preset}
                        onChange={(e) =>
                          setData({
                            ...data,
                            blind_config: { ...data.blind_config, preset: e.target.value },
                          })
                        }
                      />
                      <Input
                        label="콘텐츠 영역 높이 (px)"
                        type="number"
                        placeholder="600"
                        value={data.blind_config.iframe_height?.toString() || '600'}
                        onChange={(e) =>
                          setData({
                            ...data,
                            blind_config: {
                              ...data.blind_config,
                              iframe_height: parseInt(e.target.value) || 600,
                            },
                          })
                        }
                        helperText="Notion 콘텐츠가 표시될 영역의 높이를 설정합니다"
                      />
                    </>
                  )}
                </div>
              </SettingsSection>

              {/* 수집 필드 */}
              <SettingsSection
                title="어떤 정보를 수집할까요?"
                isOpen={openSections.form}
                onToggle={() => toggleSection('form')}
              >
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-primary">수집 필드</label>

                    <div className="space-y-3">
                      {Object.entries(data.form_config.fields).map(([fieldKey, fieldData]) => (
                        <div key={fieldKey} className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary capitalize">
                            {fieldKey}
                          </span>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={fieldData.enabled}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  form_config: {
                                    ...data.form_config,
                                    fields: {
                                      ...data.form_config.fields,
                                      [fieldKey]: { ...fieldData, enabled: (e.target as HTMLInputElement).checked },
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-primary">동의 항목</label>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">개인정보 수집 동의</span>
                        <Switch
                          checked={data.form_config.consent.privacy.enabled}
                          onChange={(e) =>
                            setData({
                              ...data,
                              form_config: {
                                ...data.form_config,
                                consent: {
                                  ...data.form_config.consent,
                                  privacy: { ...data.form_config.consent.privacy, enabled: (e.target as HTMLInputElement).checked },
                                },
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">마케팅 수신 동의</span>
                        <Switch
                          checked={data.form_config.consent.marketing.enabled}
                          onChange={(e) =>
                            setData({
                              ...data,
                              form_config: {
                                ...data.form_config,
                                consent: {
                                  ...data.form_config.consent,
                                  marketing: { ...data.form_config.consent.marketing, enabled: (e.target as HTMLInputElement).checked },
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Input
                    label="버튼 텍스트"
                    placeholder="전체 내용 보기"
                    value={data.form_config.button_label}
                    onChange={(e) =>
                      setData({
                        ...data,
                        form_config: { ...data.form_config, button_label: e.target.value },
                      })
                    }
                  />

                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-text-primary">문구 설정</label>
                    {(
                      [
                        { key: 'email_placeholder', label: '이메일 플레이스홀더' },
                        { key: 'name_placeholder', label: '이름 플레이스홀더' },
                        { key: 'company_placeholder', label: '회사명 플레이스홀더' },
                        { key: 'role_placeholder', label: '직무 선택 플레이스홀더' },
                        { key: 'privacy_label', label: '개인정보 동의 문구' },
                        { key: 'marketing_label', label: '마케팅 동의 문구' },
                        { key: 'trust_text', label: '신뢰 문구 (버튼 하단)' },
                        { key: 'skip_label', label: '건너뛰기 버튼 문구' },
                        { key: 'detail_placeholder', label: '세부사항 플레이스홀더' },
                      ] as const
                    ).map(({ key, label }) => (
                      <Input
                        key={key}
                        label={label}
                        value={data.form_config.texts[key]}
                        onChange={(e) =>
                          setData({
                            ...data,
                            form_config: {
                              ...data.form_config,
                              texts: { ...data.form_config.texts, [key]: e.target.value },
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              </SettingsSection>

              {/* 테마 */}
              <SettingsSection
                title="테마 설정"
                isOpen={openSections.theme}
                onToggle={() => toggleSection('theme')}
              >
                <div className="space-y-4">
                  <ColorPicker
                    label="메인 컬러"
                    value={data.theme_config.primary_color}
                    onChange={(color) =>
                      setData({
                        ...data,
                        theme_config: { ...data.theme_config, primary_color: color },
                      })
                    }
                  />
                </div>
              </SettingsSection>
            </div>
          </div>
        </div>

        {/* 모바일 설정 패널 배경 오버레이 */}
        {showSettings && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-20"
            onClick={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  )
}

// 설정 섹션 컴포넌트
interface SettingsSectionProps {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function SettingsSection({ title, isOpen, onToggle, children }: SettingsSectionProps) {
  return (
    <Card>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>
      {isOpen && (
        <CardContent className="pt-0 pb-4">
          {children}
        </CardContent>
      )}
    </Card>
  )
}