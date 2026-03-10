import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { projectApi, leadApi, eventApi } from '../../lib/api'
import { unlockStorage, extractUTMParams } from '../../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import NotionEmbed from '../../components/viewer/NotionEmbed'
import BlurOverlay from '../../components/viewer/BlurOverlay'
import TopBottomForm from '../../components/viewer/TopBottomForm'
import EntryModal from '../../components/viewer/EntryModal'
import FloatingBookmark from '../../components/viewer/FloatingBookmark'
// FloatingCTA is now inline in this component
import LeadForm from '../../components/viewer/LeadForm'

interface ProjectConfig {
  project_id: string
  name: string
  notion_url: string
  ux_config: any
  blind_config: any
  form_config: any
  theme_config?: {
    primary_color?: string
  }
  og_title?: string
  og_description?: string
  og_image?: string
}

export default function ViewerPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [project, setProject] = useState<ProjectConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUnlockOptions, setShowUnlockOptions] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [showUnlockedToast, setShowUnlockedToast] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 프로젝트 로드
  useEffect(() => {
    loadProject()
  }, [slug, isAuthenticated])

  // OG 메타 태그 설정
  useEffect(() => {
    if (!project) return

    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // 페이지 타이틀 설정
    const title = project.og_title || project.name
    document.title = title

    // OG 태그 설정
    updateMetaTag('og:title', title)
    if (project.og_description) {
      updateMetaTag('og:description', project.og_description)
    }
    if (project.og_image) {
      updateMetaTag('og:image', project.og_image)
    }
    updateMetaTag('og:url', window.location.href)
    updateMetaTag('og:type', 'website')

    // 정리 함수
    return () => {
      document.title = 'FORMTION'
    }
  }, [project])

  // 언락 후 카운트다운 타이머
  useEffect(() => {
    if (showUnlockOptions && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showUnlockOptions && countdown === 0) {
      // 카운트다운 완료 시 자동으로 현재 탭에서 계속 보기
      handleContinueInTab()
    }
  }, [showUnlockOptions, countdown])

  // 블러 처리 상태일 때는 Notion 영역만 제한, 전체 페이지는 스크롤 가능
  // (하단 폼이나 플로팅 CTA를 볼 수 있도록)

  const loadProject = async () => {
    try {
      const response = await projectApi.getPublic(slug!)
      setProject(response.data)

      // URL 파라미터로 강제 리셋 (?reset=1)
      if (searchParams.get('reset') === '1') {
        unlockStorage.clearUnlocked(response.data.project_id)
        // URL에서 reset 파라미터 제거
        window.history.replaceState({}, '', window.location.pathname)
      }

      // Unlock 상태 확인 - 로그인 사용자는 자동 언락
      const unlocked = isAuthenticated || unlockStorage.isUnlocked(response.data.project_id)
      setIsUnlocked(unlocked)

      // 페이지 뷰 이벤트
      eventApi.track('page_view', response.data.project_id, {
        utm: extractUTMParams(searchParams),
        unlocked,
        authenticated: isAuthenticated,
      })

      // Entry Modal 표시 - 로그인 사용자는 모달 표시 안함
      if (!unlocked && !isAuthenticated && response.data.ux_config?.entry_modal?.enabled) {
        const delay = response.data.ux_config.entry_modal.delay_seconds || 0
        setTimeout(() => setShowModal(true), delay * 1000)
      }
    } catch (error: any) {
      setError('페이지를 찾을 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 폼 제출 처리
  const handleSubmit = useCallback(async (formData: any, formLocation: string) => {
    if (!project) return

    setIsSubmitting(true)
    try {
      const response = await leadApi.create({
        project_id: project.project_id,
        email: formData.email,
        name: formData.name,
        company: formData.company,
        role: formData.role,
        consent_privacy: formData.consent_privacy,
        consent_marketing: formData.consent_marketing,
        utm_params: extractUTMParams(searchParams),
        form_location: formLocation,
      })

      // 성공 시 Unlock
      const unlockDuration = project.form_config?.unlock_duration || 30
      unlockStorage.setUnlocked(project.project_id, unlockDuration)
      setIsUnlocked(true)
      setShowModal(false)
      // 옵션 선택 화면 표시
      setShowUnlockOptions(true)
      setCountdown(5)

      // 이벤트 추적
      eventApi.track('unlock_success', project.project_id, {
        lead_id: response.data.lead_id,
        form_location: formLocation,
        already_unlocked: response.data.already_unlocked,
      })

      return { success: true }
    } catch (error: any) {
      eventApi.track('unlock_fail', project.project_id, {
        error: error.response?.data?.detail || 'unknown',
        form_location: formLocation,
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [project, searchParams])

  // Key 아이콘 클릭 핸들러 (미리보기처럼 항상 모달 열기)
  const handleKeyClick = () => {
    // 항상 모달 열기 (진입 모달이 활성화되어 있지 않아도)
    setShowModal(true)
  }

  // 현재 탭에서 계속 보기
  const handleContinueInTab = () => {
    setShowUnlockOptions(false)
    setShowUnlockedToast(true)
  }

  // 토스트 3초 후 자동 숨김
  useEffect(() => {
    if (showUnlockedToast) {
      const timer = setTimeout(() => {
        setShowUnlockedToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showUnlockedToast])

  // Notion에서 전체 보기
  const handleViewInNotion = () => {
    if (project) {
      window.open(project.notion_url, '_blank', 'noopener,noreferrer')
    }
    setShowUnlockOptions(false)
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-text-muted">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📄</span>
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            {error || '페이지를 찾을 수 없습니다'}
          </h1>
          <p className="text-text-muted">
            링크가 올바른지 확인해주세요.
          </p>
        </div>
      </div>
    )
  }

  const { ux_config, blind_config, form_config, theme_config } = project
  const primaryColor = theme_config?.primary_color || '#FF5A1F'

  return (
    <div
      className="min-h-screen bg-white relative flex flex-col"
      style={{
        '--project-primary': primaryColor,
      } as React.CSSProperties}
    >
      {/* Top Form - 로그인 사용자에게는 표시 안함, 모바일에서 숨기기 옵션 지원 */}
      {ux_config?.top_form?.enabled && !isUnlocked && !isAuthenticated && !(isMobile && ux_config?.top_form?.hide_on_mobile) && (
        <div className="flex-shrink-0">
          <TopBottomForm
            position="top"
            title={ux_config.top_form.title}
            subtitle={ux_config.top_form.subtitle}
            formConfig={form_config}
            onSubmit={(data) => handleSubmit(data, 'top')}
            isSubmitting={isSubmitting}
            primaryColor={theme_config?.primary_color || '#FF5A1F'}
          />
        </div>
      )}

      {/* Notion Embed + Blur Overlay */}
      <div
        className={`relative overflow-hidden ${isUnlocked || blind_config?.method === 'none' ? '' : 'flex-1'}`}
        style={{
          minHeight: blind_config?.method === 'none' ? 0 : (blind_config?.iframe_height || 600),
          height: blind_config?.method === 'none' ? 'auto' : (isUnlocked ? 'auto' : (blind_config?.iframe_height || 600)),
        }}
      >
        <NotionEmbed
          url={project.notion_url}
          isLocked={!isUnlocked && blind_config?.method !== 'none'}
          height={blind_config?.method === 'none' ? 4000 : (blind_config?.iframe_height || 600)}
          hideComments={blind_config?.method === 'none'}
        />

        {/* 블러 오버레이 - method가 'none'이면 표시하지 않음 */}
        {!isUnlocked && blind_config?.method !== 'none' && (
          <BlurOverlay
            method={blind_config?.method || 'preview-then-blur'}
            intensity={blind_config?.intensity || 'medium'}
            preset={blind_config?.preset || 'middle'}
            position={blind_config?.position || 30}
            primaryColor={primaryColor}
            textHighlightRatio={blind_config?.text_highlight_ratio || 30}
            onKeyClick={handleKeyClick}
          />
        )}

        {/* Unlocked 상태: 옵션 선택 화면 */}
        {isUnlocked && showUnlockOptions && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-white/80 to-white z-10">
            <div className="text-center p-8 max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Unlocked!
              </h2>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                체크인이 완료되었습니다. 전체 콘텐츠를 확인하세요.
              </p>

              {/* 옵션 버튼들 */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleViewInNotion}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors shadow-lg w-full"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933l3.222-.186z"/>
                  </svg>
                  Notion에서 전체 보기
                </button>

                <button
                  onClick={handleContinueInTab}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-medium rounded-xl transition-colors shadow-lg w-full relative overflow-hidden"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    현재 탭에서 계속 보기
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-white/20 rounded-full text-sm font-bold">
                      {countdown}
                    </span>
                  </span>
                  {/* 카운트다운 프로그레스 바 */}
                  <motion.div
                    className="absolute inset-0 bg-black/10"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                  />
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                {countdown}초 후 자동으로 현재 탭에서 계속됩니다
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Form - 로그인 사용자에게는 표시 안함 */}
      {ux_config?.bottom_form?.enabled && !isUnlocked && !isAuthenticated && (
        <div className="flex-shrink-0">
          <TopBottomForm
            position="bottom"
            title={ux_config.bottom_form.title}
            subtitle={ux_config.bottom_form.subtitle}
            formConfig={form_config}
            onSubmit={(data) => handleSubmit(data, 'bottom')}
            isSubmitting={isSubmitting}
            primaryColor={theme_config?.primary_color || '#FF5A1F'}
          />
        </div>
      )}

      {/* Floating CTA - 화면 최하단 중앙 고정, 로그인 사용자에게는 표시 안함 */}
      {ux_config?.floating_cta?.enabled && !isUnlocked && !isAuthenticated && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="fixed z-40 text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 px-6"
          style={{
            backgroundColor: theme_config?.primary_color || '#FF5A1F',
            boxShadow: `0 4px 20px ${theme_config?.primary_color || '#FF5A1F'}4D, 0 2px 8px rgba(0, 0, 0, 0.15)`,
            height: '56px',
            borderRadius: '28px',
            left: '12px',
            right: '12px',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            bottom: '24px',
          }}
          title={ux_config.floating_cta.label || 'Unlock'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <span className="text-base font-semibold">
            {ux_config.floating_cta.label || 'Unlock'}
          </span>
        </motion.button>
      )}

      {/* 플로팅 북마크 버튼 - 언락된 경우 표시 */}
      {isUnlocked && project && (
        <FloatingBookmark
          projectId={project.project_id}
          projectName={project.name}
          primaryColor={primaryColor}
        />
      )}

      {/* Powered By 로고 - fixed로 우측 하단 고정 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        className="fixed right-4 bottom-4 z-[60]"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-gray-50/95 to-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 text-xs group cursor-pointer"
        >
          <motion.span
            className="text-gray-400 group-hover:text-gray-500 transition-colors duration-200"
            animate={{
              opacity: [0.7, 1, 0.7],
              color: ['#9ca3af', '#6b7280', '#9ca3af']
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            Powered by
          </motion.span>
          <motion.span
            className="font-bold"
            animate={{
              color: [
                '#f97316', // 브랜드 오렌지
                '#ea580c', // 조금 더 진한 오렌지
                '#fb923c', // 밝은 오렌지
                '#f97316'  // 다시 브랜드 오렌지로
              ],
              y: [0, -2, 0], // 가벼운 수직 움직임
              scale: [1, 1.02, 1] // 살짝 커졌다가 작아지기
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1 // 애니메이션 사이에 1초 휴식
            }}
            whileHover={{ scale: 1.1, y: -3 }}
          >
            FORMTION
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Entry Modal - 로그인 사용자에게는 표시 안함 */}
      <EntryModal
        isOpen={showModal && !isUnlocked && !isAuthenticated}
        onClose={() => setShowModal(false)}
        title={
          showModal && ux_config?.floating_cta?.modal_title
            ? ux_config.floating_cta.modal_title
            : ux_config?.entry_modal?.title
        }
        subtitle={
          showModal && ux_config?.floating_cta?.modal_subtitle
            ? ux_config.floating_cta.modal_subtitle
            : ux_config?.entry_modal?.subtitle
        }
        primaryColor={theme_config?.primary_color || '#FF5A1F'}
        allowClose={ux_config?.entry_modal?.allow_close}
        skipLabel={form_config?.texts?.skip_label}
      >
        <LeadForm
          formConfig={form_config}
          onSubmit={(data) => handleSubmit(data, 'modal')}
          isSubmitting={isSubmitting}
          primaryColor={theme_config?.primary_color}
        />
      </EntryModal>

      {/* Unlocked 토스트 메시지 - 프로그레스바 포함 */}
      <AnimatePresence>
        {showUnlockedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 z-[100] overflow-hidden rounded-full shadow-lg"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }}
          >
            <div className="relative bg-green-500 text-white px-5 py-2.5 text-sm font-medium">
              <span className="relative z-10">✓ 콘텐츠가 해제되었습니다!</span>
              {/* 프로그레스바 배경 */}
              <motion.div
                className="absolute inset-0 bg-green-600"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3, ease: 'linear' }}
                style={{ originX: 1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


