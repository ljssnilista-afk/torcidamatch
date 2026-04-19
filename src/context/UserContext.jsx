import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const UserContext = createContext(null)
const STORAGE_KEY = 'tm-user'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

function loadStoredUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.token && parsed?.id) return parsed
    }
  } catch {}
  return null
}

/* Decodifica o payload do JWT sem bibliotecas externas */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return null }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => loadStoredUser() || {})
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!loadStoredUser()?.token)
  const refreshingRef = useRef(false)

  // Persist to localStorage whenever user changes
  useEffect(() => {
    if (isLoggedIn && user?.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    }
  }, [user, isLoggedIn])

  const updateUser = (patch) => setUser((prev) => ({ ...prev, ...patch }))

  const login = (userData = {}) => {
    const normalized = {
      ...userData,
      id: userData._id || userData.id,
    }
    setUser(normalized)
    setIsLoggedIn(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  const logout = () => {
    setUser({})
    setIsLoggedIn(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * refreshToken — renova o JWT chamando POST /api/auth/refresh.
   * Retorna o novo token se sucesso, ou null se falhou (sessão expirada).
   * Faz logout automático se o refresh falhar por token inválido.
   */
  const refreshToken = useCallback(async () => {
    const currentToken = user?.token
    if (!currentToken || refreshingRef.current) return null

    refreshingRef.current = true
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      })

      if (!res.ok) {
        // Refresh falhou — sessão expirada de vez
        logout()
        return null
      }

      const data = await res.json()
      if (data.token) {
        const updated = { ...user, token: data.token }
        if (data.user) Object.assign(updated, data.user, { id: data.user._id || data.user.id })
        setUser(updated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return data.token
      }
      return null
    } catch {
      return null
    } finally {
      refreshingRef.current = false
    }
  }, [user])

  /**
   * ensureValidToken — verifica se o token atual ainda é válido.
   * Se estiver prestes a expirar (menos de 1 dia), tenta renovar.
   * Retorna o token válido ou null se precisar re-login.
   */
  const ensureValidToken = useCallback(async () => {
    const currentToken = user?.token
    if (!currentToken) return null

    const payload = decodeJwtPayload(currentToken)
    if (!payload?.exp) return currentToken // Sem exp? retorna como está

    const now = Date.now() / 1000
    const timeLeft = payload.exp - now

    // Se expirou ou falta menos de 1 dia, tenta renovar
    if (timeLeft < 86400) {
      const newToken = await refreshToken()
      return newToken
    }

    return currentToken
  }, [user, refreshToken])

  return (
    <UserContext.Provider value={{ user, updateUser, isLoggedIn, login, logout, refreshToken, ensureValidToken }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
