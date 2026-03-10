import { useState, useEffect } from 'react'
import { RefreshCw, Monitor, Smartphone, Maximize2, Minimize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

// 뷰어 컴포넌트들
import NotionEmbed from '../viewer/NotionEmbed'
import BlurOverlay from '../viewer/BlurOverlay'
import TopBottomForm from '../viewer/TopBottomForm'
// EntryModal and FloatingCTA are implemented inline in this component
import LeadForm from '../viewer/LeadForm'

interface LivePreviewProps {
  notionUrl: string
  uxConfig: any
  blindConfig: any
  formConfig: any
  themeConfig?: {
    primary_color?: string
  }
}

export default function LivePreview({
  notionUrl,
  uxConfig,
  blindConfig,
  formConfig,
  themeConfig,
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [entryModalDismissed, setEntryModalDismissed] = useState(false)
  const [showUnlockedToast, setShowUnlockedToast] = useState(false)

  // Unlock 시 토스트 메시지 표시 후 자동으로 사라지게
  useEffect(() => {
    if (isUnlocked) {
      setShowUnlockedToast(true)
      const timer = setTimeout(() => {
        setShowUnlockedToast(false)
      }, 3000) // 3초 후 자동으로 사라짐
      return () => clearTimeout(timer)
    }
  }, [isUnlocked])

  // 진입 모달이 활성화되면 즉시 표시 (타이머 무시, dismissed 상태 리셋)
  useEffect(() => {
    if (uxConfig?.entry_modal?.enabled) {
      setEntryModalDismissed(false)
    }
  }, [uxConfig?.entry_modal?.enabled])

  // 미리보기 새로고침
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    setIsUnlocked(false)
    setShowModal(false)
    setEntryModalDismissed(false)
  }

  // 폼 제출 시뮬레이션 (실제 저장 안함)
  const handleSubmit = async (_data: any, _formLocation: string) => {
    // 미리보기에서는 실제 저장하지 않고 Unlock만 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsUnlocked(true)
    setShowModal(false)
    return { success: true }
  }

  // 어두운 색상 생성 함수
  const getDarkerColor = (color: string) => {
    const hex = color.replace('#', '')
    const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * 0.8))
    const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * 0.8))
    const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * 0.8))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  // Key 아이콘 클릭 핸들러 (미리보기용)
  const handleKeyClick = () => {
    // 항상 모달 열기 (진입 모달이 활성화되어 있지 않아도)
    setShowModal(true)
  }

  // 뷰포트 크기
  const viewportWidth = viewMode === 'desktop' ? '100%' : '375px'

  return (
    <div className="min-h-full flex flex-col bg-gray-100 rounded-xl border border-gray-200 m-4">
      {/* 미리보기 컨트롤 바 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-secondary">미리보기</span>
          {isUnlocked && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Unlocked
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Unlock/해제 토글 */}
          <button
            onClick={() => setIsUnlocked(!isUnlocked)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              isUnlocked
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            )}
          >
            {isUnlocked ? '🔓 해제됨' : '🔒 잠김'}
          </button>

          {/* 뷰포트 전환 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'desktop'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-text-muted hover:text-text-primary'
              )}
              title="PC 뷰"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'mobile'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-text-muted hover:text-text-primary'
              )}
              title="모바일 뷰"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* 확대/축소 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-gray-100 transition-colors"
            title={isExpanded ? '축소' : '확대'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* 새로고침 */}
          <button
            onClick={handleRefresh}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-gray-100 transition-colors"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 미리보기 영역 */}
      <div className="flex-1 px-4 pt-4 pb-4">
        <div
          key={refreshKey}
          className={cn(
            'relative mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300',
            viewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
          )}
          style={{
            width: viewportWidth,
            minHeight: viewMode === 'mobile' ? '1200px' : '1000px',
          }}
        >
          {/* 브라우저 프레임 (시뮬레이션) */}
          <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-2">
              <div className="bg-white rounded-md px-3 py-1 text-xs text-text-muted truncate">
                formtion.app/v/preview
              </div>
            </div>
          </div>

          {/* 실제 미리보기 컨텐츠 */}
          <div
            className="relative flex-1 overflow-y-auto overflow-x-hidden flex flex-col pb-20"
            style={{
              minHeight: '700px',
              maxHeight: 'calc(100vh - 200px)',
              // 선택한 컬러를 CSS 변수로 적용
              '--project-primary': themeConfig?.primary_color || '#FF5A1F',
            } as React.CSSProperties}
          >
            {/* Entry Modal - 미리보기 전체 영역 덮기 (sticky로 고정) */}
            <AnimatePresence>
              {((uxConfig?.entry_modal?.enabled && !isUnlocked && !entryModalDismissed) || showModal) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="sticky top-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
                  style={{
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    width: '100%',
                    height: 'calc(100vh - 200px)',
                    minHeight: 'calc(100vh - 200px)',
                    marginBottom: 'calc(-100vh + 200px)',
                    pointerEvents: 'auto'
                  }}
                  onClick={(e) => {
                    // 오버레이 배경 클릭 시 모달 닫기 (allow_close가 true일 때만)
                    if (e.target === e.currentTarget && (showModal ? true : uxConfig?.entry_modal?.allow_close)) {
                      setShowModal(false)
                    }
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
                    style={{
                      '--project-primary': themeConfig?.primary_color || '#FF5A1F',
                    } as React.CSSProperties}
                  >
                    {/* 아이콘 */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{
                        background: `linear-gradient(135deg, ${themeConfig?.primary_color || '#FF5A1F'} 0%, ${getDarkerColor(themeConfig?.primary_color || '#FF5A1F')} 100%)`,
                        boxShadow: `0 0 20px ${themeConfig?.primary_color || '#FF5A1F'}4D`,
                      }}
                    >
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>

                    {/* 타이틀 */}
                    <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
                      {showModal && uxConfig?.floating_cta?.modal_title ?
                        uxConfig.floating_cta.modal_title :
                        uxConfig?.entry_modal?.title || '계속 보기 전에, 10초만.'
                      }
                    </h3>
                    <p className="text-sm text-text-secondary text-center mb-4">
                      {showModal && uxConfig?.floating_cta?.modal_subtitle ?
                        uxConfig.floating_cta.modal_subtitle :
                        uxConfig?.entry_modal?.subtitle || '한 번만 입력하면 바로 전체가 열려요. 다음부터는 자동이에요.'
                      }
                    </p>

                    {/* 폼 */}
                    <LeadForm
                      formConfig={formConfig}
                      onSubmit={(data) => handleSubmit(data, 'modal')}
                      isSubmitting={false}
                      primaryColor={themeConfig?.primary_color}
                      compact
                    />
                    {(showModal ? true : uxConfig?.entry_modal?.allow_close) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (showModal) {
                            setShowModal(false)
                          } else {
                            // 진입 모달인 경우 일시적으로 닫기
                            setEntryModalDismissed(true)
                          }
                        }}
                        className="w-full mt-3 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                      >
                        나중에 할게요
                      </button>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Top Form - 모바일 뷰에서 숨기기 옵션 지원 */}
            {uxConfig?.top_form?.enabled && !isUnlocked && !(viewMode === 'mobile' && uxConfig?.top_form?.hide_on_mobile) && (
              <TopBottomForm
                position="top"
                title={uxConfig.top_form.title}
                subtitle={uxConfig.top_form.subtitle}
                formConfig={formConfig}
                onSubmit={(data) => handleSubmit(data, 'top')}
                isSubmitting={false}
                primaryColor={themeConfig?.primary_color || '#FF5A1F'}
              />
            )}

            {/* Notion Embed (미리보기 모드) */}
            <div
              className="relative overflow-hidden"
              style={{
                height: blindConfig?.method === 'none' ? 'auto' : (isUnlocked ? 'auto' : (blindConfig?.iframe_height || 600)),
                minHeight: blindConfig?.method === 'none' ? 0 : (blindConfig?.iframe_height || 600),
              }}
            >
              {notionUrl ? (
                <NotionEmbed
                  url={notionUrl}
                  isPreview={true}
                  isLocked={!isUnlocked && blindConfig?.method !== 'none'}
                  height={blindConfig?.method === 'none' ? 4000 : (blindConfig?.iframe_height || 600)}
                  hideComments={blindConfig?.method === 'none'}
                />
              ) : (
                <div className="flex items-center justify-center h-[400px] bg-gray-50">
                  <div className="text-center text-text-muted">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📄</span>
                    </div>
                    <p className="text-sm">Notion URL을 입력하면</p>
                    <p className="text-sm">여기에 미리보기가 표시됩니다</p>
                  </div>
                </div>
              )}

              {/* 블러 오버레이 - method가 'none'이면 표시하지 않음 */}
              {!isUnlocked && notionUrl && blindConfig?.method !== 'none' && (
                <BlurOverlay
                  method={blindConfig?.method || 'preview-then-blur'}
                  intensity={blindConfig?.intensity || 'medium'}
                  preset={blindConfig?.preset || 'middle'}
                  position={blindConfig?.position || 30}
                  primaryColor={themeConfig?.primary_color || '#FF5A1F'}
                  textHighlightRatio={blindConfig?.text_highlight_ratio || 30}
                  onKeyClick={handleKeyClick}
                />
              )}
            </div>


            {/* Bottom Form */}
            {uxConfig?.bottom_form?.enabled && !isUnlocked && (
              <TopBottomForm
                position="bottom"
                title={uxConfig.bottom_form.title}
                subtitle={uxConfig.bottom_form.subtitle}
                formConfig={formConfig}
                onSubmit={(data) => handleSubmit(data, 'bottom')}
                isSubmitting={false}
                primaryColor={themeConfig?.primary_color || '#FF5A1F'}
              />
            )}



            {/* Unlocked 토스트 메시지 - 최상단 가운데 */}
            <AnimatePresence>
              {showUnlockedToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm z-[100]"
                  style={{ pointerEvents: 'none' }}
                >
                  ✓ 콘텐츠가 해제되었습니다!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Powered By 로고 - sticky로 우측 하단 고정 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.3 }}
              className="sticky bottom-4 z-[60] flex justify-end mt-4"
              style={{ alignSelf: 'flex-end' }}
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

            {/* Floating CTA - 미리보기 컨테이너 내부 하단 고정 */}
            {uxConfig?.floating_cta?.enabled && !isUnlocked && (
              <div className="sticky bottom-4 z-[70] flex justify-center mb-4" style={{ marginTop: 'auto', paddingBottom: '4px' }}>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(true)}
                  className="text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 px-4"
                  style={{
                    backgroundColor: themeConfig?.primary_color || '#FF5A1F',
                    boxShadow: `0 4px 20px ${themeConfig?.primary_color || '#FF5A1F'}4D, 0 2px 8px rgba(0, 0, 0, 0.15)`,
                    height: '48px',
                    borderRadius: '12px',
                    minWidth: '120px',
                  }}
                  title={uxConfig.floating_cta.label || 'Unlock'}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {uxConfig.floating_cta.label || 'Unlock'}
                  </span>
                </motion.button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 하단 안내 */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-text-muted text-center">
          설정 변경 시 실시간으로 미리보기가 업데이트됩니다
        </p>
      </div>
    </div>
  )
}

