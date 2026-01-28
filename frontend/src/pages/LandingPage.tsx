import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Lock, Users, Zap, Check, AlertCircle, LogIn, ExternalLink, Github, Linkedin } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { isValidNotionUrl } from '../lib/utils'
import { projectApi } from '../lib/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'

// URL 체크 결과 타입
interface URLCheckResult {
  is_occupied: boolean
  owner_hint: string | null
  is_own: boolean
  project_id: string | null
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [notionUrl, setNotionUrl] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  // 모달 상태
  const [showOwnUrlModal, setShowOwnUrlModal] = useState(false)
  const [showOccupiedModal, setShowOccupiedModal] = useState(false)
  const [urlCheckResult, setUrlCheckResult] = useState<URLCheckResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!notionUrl) {
      setError('Notion URL을 입력해주세요.')
      return
    }

    if (!isValidNotionUrl(notionUrl)) {
      setError('올바른 Notion URL을 입력해주세요. (예: https://notion.so/...)')
      return
    }

    // 1. 로그인 상태면 바로 대시보드 프로젝트 생성으로 이동
    if (isAuthenticated) {
      const encodedUrl = encodeURIComponent(notionUrl)
      navigate(`/admin/projects/new?url=${encodedUrl}`)
      return
    }

    // 2. 비로그인 상태면 URL 소유권 확인
    setIsChecking(true)
    try {
      const response = await projectApi.checkUrl(notionUrl)
      const result: URLCheckResult = response.data

      if (!result.is_occupied) {
        // URL이 점유되지 않음 → 게스트 프리뷰로 진행
        const encodedUrl = encodeURIComponent(notionUrl)
        navigate(`/create?url=${encodedUrl}`)
      } else if (result.is_own) {
        // 본인 URL (이 경우는 로그인 상태에서만 발생하지만, 혹시 모르니)
        setUrlCheckResult(result)
        setShowOwnUrlModal(true)
      } else {
        // 다른 사용자가 점유한 URL
        setUrlCheckResult(result)
        setShowOccupiedModal(true)
      }
    } catch (err) {
      // API 에러 시 일단 진행 허용
      const encodedUrl = encodeURIComponent(notionUrl)
      navigate(`/create?url=${encodedUrl}`)
    } finally {
      setIsChecking(false)
    }
  }

  const handleLoginRedirect = () => {
    const encodedUrl = encodeURIComponent(notionUrl)
    navigate(`/login?redirect=/admin/projects/new?url=${encodedUrl}`)
  }

  const features = [
    {
      icon: Lock,
      title: '콘텐츠 중간에 간단한 폼',
      description: '핵심 내용 앞에서 이메일 한 줄. 읽던 흐름 그대로 입력하게 됩니다.',
    },
    {
      icon: Users,
      title: '관심 있는 독자만 수집',
      description: '끝까지 읽고 싶은 사람만 정보를 남깁니다. 질 높은 리드 확보.',
    },
    {
      icon: Zap,
      title: '설정 10초, 배포 즉시',
      description: 'Notion URL 붙여넣고 공유 링크 복사. 끝.',
    },
  ]

  return (
    <div 
      className="min-h-screen"
      style={{
        // PRD: 베이스 화이트 + 오렌지 소프트 그라데이션
        background: 'linear-gradient(135deg, #FFF1EA 0%, #FFFFFF 50%, #F7F7F8 100%)',
      }}
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FF5A1F 0%, #E64510 100%)',
                }}
              >
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-display font-bold text-xl text-text-primary">
                FORMTION
              </span>
            </Link>

            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link to="/admin">
                  <Button variant="primary" size="sm">
                    대시보드
                  </Button>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    로그인
                  </Link>
                  <Link to="/register">
                    <Button variant="outline" size="sm">
                      회원가입
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* 배지 영역 */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {/* PRD: Orange Soft 배경의 배지 */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: '#FFF1EA',
                color: '#FF5A1F',
              }}
            >
              <Sparkles className="w-4 h-4" />
              콘텐츠로 리드 수집하는 가장 쉬운 방법
            </div>
            {/* Open Source 배지 */}
            <a
              href="https://github.com/Hyunki6040/formtion-lead-for-notion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              <Github className="w-4 h-4" />
              Open Source
            </a>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-primary mb-6 leading-tight">
            콘텐츠 공유하면
            <br />
            {/* PRD: 오렌지 그라데이션 텍스트 */}
            <span 
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #FF5A1F 0%, #E64510 100%)',
              }}
            >
              리드가 쌓입니다
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Notion 콘텐츠 중간에 폼 하나 넣으면,
            <br className="hidden sm:block" />
            관심 있는 독자의 연락처가 자동으로 수집됩니다.
          </p>
        </div>

        {/* URL 입력 폼 */}
        <div className="max-w-2xl mx-auto mb-16">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Notion URL을 붙여넣기 (https://notion.so/...)"
                  value={notionUrl}
                  onChange={(e) => {
                    setNotionUrl(e.target.value)
                    setError('')
                  }}
                  error={error}
                  className="h-14 text-lg"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 px-8 whitespace-nowrap"
                rightIcon={!isChecking && <ArrowRight className="w-5 h-5" />}
                disabled={isChecking}
              >
                {isChecking ? '확인 중...' : '무료로 시작'}
              </Button>
            </div>
            <p className="text-center text-sm text-text-muted">
              <Check className="w-4 h-4 inline mr-1 text-primary-500" />
              회원가입 없이 바로 시작 · 저장은 나중에 해도 돼요
            </p>
          </form>
        </div>

        {/* 기능 소개 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center p-6 rounded-2xl bg-white shadow-soft border border-border hover:shadow-lg transition-shadow"
            >
              {/* PRD: 오렌지 소프트 배경 아이콘 */}
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  backgroundColor: '#FFF1EA',
                }}
              >
                <feature.icon className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-text-secondary text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* 사용 방법 */}
        <div className="bg-white rounded-3xl shadow-soft border border-border p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-text-primary text-center mb-8">
            3단계면 리드 수집 시작
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Notion URL 붙여넣기',
                description: '공유하고 싶은 Notion 페이지 링크를 복사해서 넣으세요.',
              },
              {
                step: '02',
                title: '수집할 정보 선택',
                description: '이메일만? 이름도? 회사명도? 원하는 항목만 켜세요.',
              },
              {
                step: '03',
                title: '공유 링크 배포',
                description: '생성된 링크를 SNS, 뉴스레터, 어디든 공유하세요.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                {/* PRD: 오렌지 계열 숫자 */}
                <div 
                  className="text-5xl font-display font-bold mb-4"
                  style={{ color: '#FFD4C4' }}
                >
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-text-secondary text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FF5A1F 0%, #E64510 100%)',
                }}
              >
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <span className="text-sm text-text-muted">
                © 2025 FORMTION. Open Source Project.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/Hyunki6040/formtion-lead-for-notion"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/i-am-robert/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                제작자
              </a>
              <Link to="/privacy" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                개인정보처리방침
              </Link>
              <Link to="/marketing-consent" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                마케팅 수신동의
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 본인 URL 로그인 유도 모달 */}
      <Modal
        isOpen={showOwnUrlModal}
        onClose={() => setShowOwnUrlModal(false)}
        title="이미 등록된 URL이에요"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <LogIn className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-text-primary">
                이 Notion 페이지는 이미 <strong>{urlCheckResult?.owner_hint}</strong> 계정으로 등록되어 있어요.
              </p>
              <p className="text-sm text-text-secondary mt-1">
                본인 계정이라면 로그인해서 프로젝트를 관리하세요.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowOwnUrlModal(false)}
            >
              취소
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleLoginRedirect}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              로그인하기
            </Button>
          </div>
        </div>
      </Modal>

      {/* 다른 사용자 점유 URL 안내 모달 */}
      <Modal
        isOpen={showOccupiedModal}
        onClose={() => setShowOccupiedModal(false)}
        title="이 URL은 사용할 수 없어요"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-text-primary">
                이 Notion 페이지는 다른 사용자가 이미 등록했어요.
              </p>
              <p className="text-sm text-text-secondary mt-1">
                등록한 계정: <strong>{urlCheckResult?.owner_hint}</strong>
              </p>
            </div>
          </div>

          <div className="p-4 bg-surface-secondary rounded-lg">
            <p className="text-sm font-medium text-text-primary mb-2">
              💡 해결 방법
            </p>
            <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
              <li>Notion 페이지를 <strong>복제</strong>하면 새 URL이 생성돼요</li>
              <li>복제된 페이지의 URL을 여기에 붙여넣으세요</li>
            </ol>
            <a
              href="https://www.notion.so/help/duplicate-public-pages"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 mt-3"
            >
              Notion 페이지 복제하는 법
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              setShowOccupiedModal(false)
              setNotionUrl('')
            }}
          >
            다른 URL로 시작하기
          </Button>
        </div>
      </Modal>
    </div>
  )
}
