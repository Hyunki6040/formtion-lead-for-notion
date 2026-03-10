// 비회원 프로젝트 데이터 저장 유틸리티
import { generateSlug } from './utils'

export interface GuestProjectData {
  id: string
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
    preview_height: number
    text_highlight_ratio?: number
    iframe_height?: number
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
  created_at: string
  updated_at: string
}

const STORAGE_KEY = 'formtion_guest_project'

export const defaultGuestProjectData: Omit<GuestProjectData, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  notion_url: '',
  public_slug: '',
  ux_config: {
    top_form: { enabled: false, title: '', subtitle: '' },
    bottom_form: { enabled: true, title: '이 템플릿, 바로 써도 됩니다.', subtitle: '짧게 입력하면 블러가 즉시 풀립니다.' },
    entry_modal: { enabled: false, title: '', subtitle: '', allow_close: true, delay_seconds: 0 },
    floating_cta: { enabled: true, label: 'Unlock', mobile_bottom_fixed: true, modal_title: '계속 보기 전에, 10초만.', modal_subtitle: '한 번만 입력하면 바로 전체가 열려요. 다음부터는 자동이에요.' },
    inline_blur_gate: { enabled: false, title: '', subtitle: '' },
  },
  blind_config: {
    method: 'preview-then-blur',
    preset: 'middle',
    position: 30,
    intensity: 'medium',
    preview_height: 3,
    iframe_height: 600,
    text_highlight_ratio: 30,
  },
  form_config: {
    fields: {
      email: { enabled: true, required: true },
      name: { enabled: false, required: false },
      company: { enabled: false, required: false },
      role: { enabled: false, required: false },
      detail: { enabled: false, required: false },
    },
    consent: {
      privacy: { enabled: true, required: true },
      marketing: { enabled: false, required: false },
    },
    unlock_duration: 30,
    button_label: 'Unlock',
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
    primary_color: '#FF5A1F', // FORMTION Orange (기본값)
  },
}

export const guestStorage = {
  // 비회원 프로젝트 가져오기
  get: (): GuestProjectData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return null
      return JSON.parse(data)
    } catch {
      return null
    }
  },

  // 비회원 프로젝트 저장
  save: (data: Partial<GuestProjectData>): GuestProjectData => {
    const existing = guestStorage.get()
    const now = new Date().toISOString()
    
    const project: GuestProjectData = {
      ...defaultGuestProjectData,
      ...existing,
      ...data,
      id: existing?.id || `guest_${generateSlug()}`,
      public_slug: data.public_slug || existing?.public_slug || generateSlug(),
      created_at: existing?.created_at || now,
      updated_at: now,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
    
    // 쿠키에도 저장 (백업)
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify({ id: project.id, slug: project.public_slug }))};path=/;max-age=${60 * 60 * 24 * 30}`
    
    return project
  },

  // 비회원 프로젝트 삭제
  clear: () => {
    localStorage.removeItem(STORAGE_KEY)
    document.cookie = `${STORAGE_KEY}=;path=/;max-age=0`
  },

  // 비회원 프로젝트 존재 여부
  exists: (): boolean => {
    return guestStorage.get() !== null
  },

  // 서버에 저장 (로그인 후 마이그레이션)
  migrate: async (createProjectFn: (data: any) => Promise<any>): Promise<string | null> => {
    const guestProject = guestStorage.get()
    if (!guestProject) return null

    try {
      const response = await createProjectFn({
        name: guestProject.name || '내 프로젝트',
        notion_url: guestProject.notion_url,
        public_slug: guestProject.public_slug,
        ux_config: guestProject.ux_config,
        blind_config: guestProject.blind_config,
        form_config: guestProject.form_config,
        theme_config: guestProject.theme_config,
      })

      // 마이그레이션 성공 시 로컬 데이터 삭제
      guestStorage.clear()
      
      return response.data.project_id
    } catch (error) {
      console.error('비회원 프로젝트 마이그레이션 실패:', error)
      return null
    }
  },
}


