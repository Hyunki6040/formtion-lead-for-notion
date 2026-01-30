import { useState, useEffect, useRef } from 'react'

interface NotionEmbedProps {
  url: string
  /** 미리보기 모드 (설정 화면) vs 뷰어 모드 (공유 링크) */
  isPreview?: boolean
  /** 잠금 상태 (블러 처리 시 스크롤 방지) */
  isLocked?: boolean
  /** iframe 높이 (px 단위) */
  height?: number
}

/**
 * Notion URL을 임베드 가능한 형식으로 변환
 * 
 * Notion은 /ebd/ 경로를 통해 iframe 임베드를 허용합니다.
 * 예: https://xxx.notion.site/page-id → https://xxx.notion.site/ebd/page-id
 */
function convertToEmbedUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // 이미 /ebd/ 경로가 있으면 그대로 반환
    if (urlObj.pathname.includes('/ebd/')) {
      return url
    }
    
    // notion.site 도메인인 경우 /ebd/ 경로 추가
    if (urlObj.hostname.includes('notion.site')) {
      // 경로에서 페이지 슬러그 추출
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        const pageSlug = pathParts[pathParts.length - 1]
        // /ebd/ 형식으로 변환
        urlObj.pathname = `/ebd/${pageSlug}`
        return urlObj.toString()
      }
    }
    
    return url
  } catch {
    return url
  }
}

/**
 * Notion 콘텐츠 표시 컴포넌트
 * 
 * Notion의 "웹에 게시" 페이지를 iframe으로 임베드합니다.
 * /ebd/ 경로를 사용하여 CSP 우회합니다.
 */
export default function NotionEmbed({ url, isPreview: _isPreview = false, isLocked = false, height = 600 }: NotionEmbedProps) {
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [pageTitle, setPageTitle] = useState<string>('')
  const [embedUrl, setEmbedUrl] = useState<string>('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!url) {
      setIsValidUrl(false)
      setIsLoading(false)
      return
    }

    // Notion URL 유효성 검사
    const isNotion = url.includes('notion.site') || url.includes('notion.so')
    setIsValidUrl(isNotion)
    setIsLoading(isNotion)
    setHasError(false)

    // 임베드 URL 생성
    if (isNotion) {
      const converted = convertToEmbedUrl(url)
      setEmbedUrl(converted)
      console.log('Original URL:', url)
      console.log('Embed URL:', converted)
    }

    // URL에서 페이지 제목 추출 시도
    if (isNotion) {
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1]
          const titlePart = lastPart.replace(/-[a-f0-9]{32}$/i, '').replace(/-/g, ' ')
          if (titlePart && titlePart.length > 0) {
            setPageTitle(titlePart)
          }
        }
      } catch {
        // URL 파싱 실패 시 무시
      }
    }
  }, [url])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // URL이 없거나 유효하지 않은 경우
  if (!url || !isValidUrl) {
    return (
      <div className="relative w-full min-h-[500px] flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-gray-100">
            <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933l3.222-.186zM2.264 1.382l13.083-.793c1.635-.14 2.055-.046 3.082.7l4.25 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.549c0-.84.374-1.54 1.682-1.166z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Notion 콘텐츠 영역
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {url ? '유효한 Notion URL을 입력해주세요.' : 'Notion 페이지 URL을 입력하면 여기에 콘텐츠가 표시됩니다.'}
          </p>
        </div>
      </div>
    )
  }

  // 에러 발생 시 fallback UI
  if (hasError) {
    return (
      <div className="relative w-full min-h-[500px] flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-gray-100">
            <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933l3.222-.186zM2.264 1.382l13.083-.793c1.635-.14 2.055-.046 3.082.7l4.25 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.549c0-.84.374-1.54 1.682-1.166z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {pageTitle || 'Notion 콘텐츠'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            이 Notion 페이지는 직접 임베드할 수 없습니다.
            <br />
            아래 버튼을 클릭하여 원본 페이지를 확인하세요.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            Notion에서 보기
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    )
  }

  // 유효한 URL인 경우 - iframe으로 Notion 페이지 표시
  return (
    <div
      className="relative w-full bg-white"
      style={{
        height: `${height}px`,
        overflow: isLocked ? 'hidden' : 'visible',
        pointerEvents: isLocked ? 'none' : 'auto',
      }}
    >
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Notion 콘텐츠 로딩 중...</p>
          </div>
        </div>
      )}

      {/* Notion iframe - /ebd/ 경로 사용 */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full absolute inset-0 border-0"
        style={{
          height: `${height}px`,
          overflow: isLocked ? 'hidden' : 'auto',
          pointerEvents: isLocked ? 'none' : 'auto',
        }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={pageTitle || 'Notion Content'}
        allowFullScreen
        scrolling={isLocked ? 'no' : 'yes'}
      />
    </div>
  )
}
