import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from './api'
import type { AuthUser } from './types'

interface AuthState {
  user: AuthUser | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  // Token yang tersimpan di localStorage belum tentu masih berlaku, jadi
  // selalu diverifikasi ke server sebelum dianggap sebagai sesi yang sah.
  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true)
      return
    }
    api<{ user: AuthUser }>('/me')
      .then((res) => setUser(res.user))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    tokenStore.set(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    await api('/logout', { method: 'POST' }).catch(() => undefined)
    tokenStore.clear()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return context
}
