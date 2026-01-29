import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Copy,
  Users,
  Trash2,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeft,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { projectApi } from '../../lib/api'
import { useToast } from '../../contexts/ToastContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Switch from '../../components/ui/Switch'
import Select from '../../components/ui/Select'
import ColorPicker from '../../components/ui/ColorPicker'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import LivePreview from '../../components/admin/LivePreview'
import UXConfigSection from '../../components/admin/UXConfigSection'
import { cn } from '../../lib/utils'

export default function ProjectEditPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [project, setProject] = useState<any>(null)

  // 설정 패널 섹션 열림/닫힘 상태
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    ux: true,
    blind: false,
    form: false,
    theme: false,
    og: false,
    webhook: false,
  })

  // 모바일에서 설정 패널 표시 여부
  const [showSettings, setShowSettings] = useState(true)

  // 헤더 이름 인라인 수정
  const [isEditingHeaderName, setIsEditingHeaderName] = useState(false)
  const [headerNameInput, setHeaderNameInput] = useState('')

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const response = await projectApi.get(projectId!)
      setProject(response.data)
    } catch (error) {
      addToast({ type: 'error', message: '프로젝트를 불러오지 못했습니다.' })
      navigate('/admin/projects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await projectApi.update(projectId!, project)
      addToast({ type: 'success', message: '저장되었습니다.' })
    } catch (error: any) {
      let message = '저장에 실패했습니다.'
      const detail = error.response?.data?.detail
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        const field = detail[0]?.loc?.slice(-1)[0] || ''
        const errorMsg = detail[0]?.msg || ''
        message = field ? `${field}: ${errorMsg}` : errorMsg
      }
      addToast({ type: 'error', message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?\n수집된 Signal 데이터도 함께 삭제됩니다.')) {
      return
    }

    try {
      await projectApi.delete(projectId!)
      addToast({ type: 'success', message: '프로젝트가 삭제되었습니다.' })
      navigate('/admin/projects')
    } catch (error) {
      addToast({ type: 'error', message: '삭제에 실패했습니다.' })
    }
  }

  const copyShareLink = () => {
    const link = `${window.location.origin}/v/${project.public_slug}`
    navigator.clipboard.writeText(link)
    addToast({ type: 'success', message: '링크가 복사되었습니다.' })
  }

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-4xl">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 md:left-64 md:top-0 flex flex-col overflow-hidden bg-white" style={{ height: '100vh' }}>
      {/* 헤더 */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-3 border-b border-gray-200 bg-white z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/projects')}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">목록</span>
          </button>
          {isEditingHeaderName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={headerNameInput}
                onChange={(e) => setHeaderNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setProject({ ...project, name: headerNameInput })
                    setIsEditingHeaderName(false)
                  } else if (e.key === 'Escape') {
                    setIsEditingHeaderName(false)
                  }
                }}
                className="px-2 py-1 text-lg font-display font-bold border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button
                onClick={() => {
                  setProject({ ...project, name: headerNameInput })
                  setIsEditingHeaderName(false)
                }}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="확인"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditingHeaderName(false)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="취소"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-lg font-display font-bold text-text-primary truncate max-w-[200px] sm:max-w-none">
                {project.name}
              </h1>
              <button
                onClick={() => {
                  setHeaderNameInput(project.name)
                  setIsEditingHeaderName(true)
                }}
                className="p-1 text-gray-400 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all"
                title="이름 수정"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
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

          <Link to={`/admin/projects/${projectId}/leads`}>
            <Button variant="outline" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              <span className="hidden sm:inline">신호</span> ({project.lead_count})
            </Button>
          </Link>
          <a href={`/v/${project.public_slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
              <span className="hidden sm:inline">새 탭</span>
            </Button>
          </a>
          <Button onClick={handleSave} isLoading={isSaving} size="sm" leftIcon={<Save className="w-4 h-4" />}>
            저장
          </Button>
        </div>
      </div>

      {/* 메인 컨텐츠: 좌측 미리보기 + 우측 설정 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 좌측: 실시간 미리보기 (60%) */}
        <div
          className={cn(
            'flex-1 lg:flex-[6] bg-gray-50 overflow-y-auto overflow-x-hidden',
            !showSettings && 'flex-1'
          )}
        >
          <LivePreview
            notionUrl={project.notion_url}
            uxConfig={project.ux_config}
            blindConfig={project.blind_config}
            formConfig={project.form_config}
            themeConfig={project.theme_config}
          />
        </div>

        {/* 우측: 설정 패널 (40%) */}
        <div
          className={cn(
            'lg:flex-[4] w-full lg:w-auto lg:max-w-md border-l border-gray-200 bg-white overflow-y-auto overflow-x-hidden',
            'transition-all duration-300',
            showSettings ? 'block' : 'hidden lg:block'
          )}
        >
          <div className="h-full">
            <div className="p-4 space-y-4" style={{ minHeight: '1200px' }}>
            {/* 공유 링크 */}
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-muted mb-1">공유 링크</p>
                    <p className="text-sm text-text-primary font-mono truncate">
                      /v/{project.public_slug}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyShareLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 기본 정보 */}
            <SettingsSection
              title="프로젝트 기본 정보"
              isOpen={openSections.basic}
              onToggle={() => toggleSection('basic')}
            >
              <div className="space-y-4">
                <Input
                  label="프로젝트 이름"
                  value={project.name}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                />
                <Input
                  label="Notion URL"
                  value={project.notion_url}
                  onChange={(e) => setProject({ ...project, notion_url: e.target.value })}
                />
              </div>
            </SettingsSection>

            {/* UX 패턴 */}
            <SettingsSection
              title="폼을 어디에 보여줄까요?"
              isOpen={openSections.ux}
              onToggle={() => toggleSection('ux')}
            >
              <UXConfigSection
                uxConfig={project.ux_config}
                onUpdate={(updates) =>
                  setProject({
                    ...project,
                    ux_config: { ...project.ux_config, ...updates },
                  })
                }
              />
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
                    { value: 'none', label: '없음 (리드 입력 선택사항)' },
                    { value: 'section-blur', label: '전체 블러' },
                    { value: 'preview-then-blur', label: '프리뷰 + 블러' },
                    { value: 'random-text-highlight', label: '랜덤 텍스트 하이라이트' },
                  ]}
                  value={project.blind_config?.method || 'preview-then-blur'}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      blind_config: { ...project.blind_config, method: e.target.value },
                    })
                  }
                />
                {project.blind_config?.method === 'random-text-highlight' && (
                  <Input
                    label="가릴 단어 비율 (%)"
                    type="number"
                    placeholder="30"
                    min="0"
                    max="100"
                    value={project.blind_config?.text_highlight_ratio?.toString() || '30'}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        blind_config: {
                          ...project.blind_config,
                          text_highlight_ratio: parseInt(e.target.value) || 30,
                        },
                      })
                    }
                    helperText="0-100% 사이의 값으로 설정하세요. 높을수록 더 많은 텍스트가 가려집니다."
                  />
                )}
                <Select
                  label="블러 강도"
                  options={[
                    { value: 'light', label: '약함' },
                    { value: 'medium', label: '중간' },
                    { value: 'strong', label: '강함' },
                  ]}
                  value={project.blind_config?.intensity || 'medium'}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      blind_config: { ...project.blind_config, intensity: e.target.value },
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
                  value={project.blind_config?.preset || 'middle'}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      blind_config: { ...project.blind_config, preset: e.target.value },
                    })
                  }
                />
                <Input
                  label="콘텐츠 영역 높이 (px)"
                  type="number"
                  placeholder="600"
                  value={project.blind_config?.iframe_height?.toString() || '600'}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      blind_config: {
                        ...project.blind_config,
                        iframe_height: parseInt(e.target.value) || 600,
                      },
                    })
                  }
                  helperText="Notion 콘텐츠가 표시될 영역의 높이를 설정합니다"
                />
              </div>
            </SettingsSection>

            {/* 수집 필드 */}
            <SettingsSection
              title="어떤 정보를 수집할까요?"
              isOpen={openSections.form}
              onToggle={() => toggleSection('form')}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-text-primary">이메일</span>
                  <span className="text-xs text-text-muted">필수</span>
                </div>
                <Switch
                  label="이름"
                  checked={project.form_config?.fields?.name?.enabled ?? false}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      form_config: {
                        ...project.form_config,
                        fields: {
                          ...project.form_config?.fields,
                          name: { ...project.form_config?.fields?.name, enabled: e.target.checked },
                        },
                      },
                    })
                  }
                />
                <Switch
                  label="회사명"
                  checked={project.form_config?.fields?.company?.enabled ?? false}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      form_config: {
                        ...project.form_config,
                        fields: {
                          ...project.form_config?.fields,
                          company: { ...project.form_config?.fields?.company, enabled: e.target.checked },
                        },
                      },
                    })
                  }
                />
                <Switch
                  label="직무"
                  checked={project.form_config?.fields?.role?.enabled ?? false}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      form_config: {
                        ...project.form_config,
                        fields: {
                          ...project.form_config?.fields,
                          role: { ...project.form_config?.fields?.role, enabled: e.target.checked },
                        },
                      },
                    })
                  }
                />
                <Switch
                  label="마케팅 수신 동의"
                  checked={project.form_config?.consent?.marketing?.enabled ?? false}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      form_config: {
                        ...project.form_config,
                        consent: {
                          ...project.form_config?.consent,
                          marketing: { ...project.form_config?.consent?.marketing, enabled: e.target.checked },
                        },
                      },
                    })
                  }
                />
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
                  value={project.theme_config?.primary_color || '#FF5A1F'}
                  onChange={(color) =>
                    setProject({
                      ...project,
                      theme_config: {
                        ...project.theme_config,
                        primary_color: color,
                      },
                    })
                  }
                  helperText="버튼, 링크, 강조 색상에 사용됩니다"
                />
              </div>
            </SettingsSection>

            {/* OG 메타 태그 */}
            <SettingsSection
              title="OG 메타 태그 (공유 미리보기)"
              isOpen={openSections.og}
              onToggle={() => toggleSection('og')}
            >
              <div className="space-y-4">
                <Input
                  label="og:title"
                  placeholder={project.name || '페이지 제목'}
                  value={project.og_title || ''}
                  onChange={(e) => setProject({ ...project, og_title: e.target.value })}
                  helperText="SNS 공유 시 표시될 제목 (비워두면 프로젝트 이름 사용)"
                />
                <Input
                  label="og:description"
                  placeholder="페이지 설명을 입력하세요"
                  value={project.og_description || ''}
                  onChange={(e) => setProject({ ...project, og_description: e.target.value })}
                  helperText="SNS 공유 시 표시될 설명"
                />
                <Input
                  label="og:image"
                  placeholder="https://example.com/image.png"
                  value={project.og_image || ''}
                  onChange={(e) => setProject({ ...project, og_image: e.target.value })}
                  helperText="SNS 공유 시 표시될 이미지 URL (권장: 1200x630px)"
                />
              </div>
            </SettingsSection>

            {/* Webhook */}
            <SettingsSection
              title="Webhook"
              isOpen={openSections.webhook}
              onToggle={() => toggleSection('webhook')}
            >
              <div className="space-y-4">
                <Input
                  label="Webhook URL"
                  placeholder="https://..."
                  value={project.webhook_url || ''}
                  onChange={(e) => setProject({ ...project, webhook_url: e.target.value })}
                  helperText="새 Signal이 들어올 때 JSON 데이터를 전송해요"
                />
                <Input
                  label="Slack Webhook URL"
                  placeholder="https://hooks.slack.com/..."
                  value={project.slack_webhook_url || ''}
                  onChange={(e) => setProject({ ...project, slack_webhook_url: e.target.value })}
                  helperText="Slack 채널에 알림을 전송합니다"
                />
                <Input
                  label="Discord Webhook URL"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={project.discord_webhook_url || ''}
                  onChange={(e) => setProject({ ...project, discord_webhook_url: e.target.value })}
                  helperText="Discord 채널에 임베드 알림을 전송합니다"
                />
              </div>
            </SettingsSection>

            {/* 위험 구역 */}
            <Card className="border-red-200">
              <CardHeader className="py-3">
                <h3 className="text-sm font-semibold text-red-600">위험 구역</h3>
              </CardHeader>
              <CardContent className="py-3">
                <p className="text-xs text-text-secondary mb-3">
                  프로젝트를 삭제하면 수집된 모든 신호 데이터도 함께 삭제됩니다.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  프로젝트 삭제
                </Button>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
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
