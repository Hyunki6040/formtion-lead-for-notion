import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, projectApi } from '../lib/api'
import { guestStorage } from '../lib/guestStorage'

interface User {
  user_id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (email: string, password: string, name?: string) => Promise<string | null>
  logout: () => void
  migratedProjectId: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'formtion_token'
const USER_KEY = 'formtion_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [migratedProjectId, setMigratedProjectId] = useState<string | null>(null)

  // 초기화 시 저장된 토큰 확인
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }

    setIsLoading(false)
  }, [])

  // 비회원 프로젝트 마이그레이션
  const migrateGuestProject = async (): Promise<string | null> => {
    const guestProject = guestStorage.get()
    if (!guestProject || !guestProject.notion_url) return null

    try {
      const response = await projectApi.create({
        name: guestProject.name || '내 프로젝트',
        notion_url: guestProject.notion_url,
        public_slug: guestProject.public_slug || undefined,
        ux_config: guestProject.ux_config,
        blind_config: {
          ...guestProject.blind_config,
          iframe_height: guestProject.blind_config.iframe_height || 600,
        },
        form_config: guestProject.form_config,
        theme_config: guestProject.theme_config,
      })

      // 마이그레이션 성공 시 로컬 데이터 삭제
      guestStorage.clear()

      const projectId = response.data.project_id
      setMigratedProjectId(projectId)
      return projectId
    } catch (error) {
      console.error('비회원 프로젝트 마이그레이션 실패:', error)
      return null
    }
  }

  const login = async (email: string, password: string): Promise<string | null> => {
    const response = await api.post('/api/auth/login', { email, password })
    const { token: newToken, user_id, name } = response.data

    const newUser: User = { user_id, email, name }

    setToken(newToken)
    setUser(newUser)

    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

    // 비회원 프로젝트 마이그레이션
    const projectId = await migrateGuestProject()
    return projectId
  }

  const register = async (email: string, password: string, name?: string): Promise<string | null> => {
    const response = await api.post('/api/auth/register', { email, password, name })
    const { token: newToken, user_id } = response.data

    const newUser: User = { user_id, email, name }

    setToken(newToken)
    setUser(newUser)

    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

    // 비회원 프로젝트 마이그레이션
    const projectId = await migrateGuestProject()
    return projectId
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setMigratedProjectId(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        migratedProjectId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
