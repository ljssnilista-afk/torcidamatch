import { createContext, useContext, useState } from 'react'

const UserContext = createContext(null)

const INITIAL_USER = {
  id:          'user-bianca',
  initials:    'BR',
  name:        'Bianca Rodrigues',
  handle:      '@biancard23',
  age:         23,
  team:        'Botafogo',
  teamEmoji:   '⚫⚪',
  bio:         'Torcedora apaixonada pelo Fogão! ⚫⚪ Presente em todos os jogos desde 2015.',
  location:    'Copacabana, RJ',
  memberSince: '2023',
  isOwn:       true,
  myGroupId:   'copa-fogo',
  email:       '',
}

export function UserProvider({ children }) {
  const [user,       setUser]       = useState(INITIAL_USER)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const updateUser = (patch) => setUser((prev) => ({ ...prev, ...patch }))

  const login = (userData = {}) => {
    // Backend retorna _id — mapeia para id para uso consistente no app
    const normalized = {
      ...userData,
      id: userData.id || userData._id || userData.id,
    }
    updateUser(normalized)
    setIsLoggedIn(true)
  }

  const logout = () => {
    setUser(INITIAL_USER)
    setIsLoggedIn(false)
  }

  return (
    <UserContext.Provider value={{ user, updateUser, isLoggedIn, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

/** Hook to consume user context */
export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
