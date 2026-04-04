import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)
const STORAGE_KEY = 'tm-user'

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

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => loadStoredUser() || {})
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!loadStoredUser()?.token)

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

  return (
    <UserContext.Provider value={{ user, updateUser, isLoggedIn, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
