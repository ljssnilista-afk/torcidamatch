import { createContext, useContext, useState } from 'react'

const NotificationsContext = createContext(null)

// ─── Dados mockados ───────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'group_invite',
    title: 'Convite para grupo',
    message: 'Você foi convidado para o grupo "Fúria Jovem Tijuca"',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),   // 5 min atrás
    read: false,
    actions: ['accept', 'decline'],
    actionUrl: '/grupos/furia-jovem',
  },
  {
    id: 2,
    type: 'join_request',
    title: 'Solicitação de entrada',
    message: 'João Silva quer entrar no seu grupo "Copa-Fogo"',
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),  // 22 min atrás
    read: false,
    actions: ['accept', 'decline'],
    actionUrl: '/grupos/copa-fogo',
  },
  {
    id: 3,
    type: 'ride_booked',
    title: 'Reserva de carona',
    message: 'Mariana Costa reservou uma vaga na sua carona para Botafogo × Flamengo',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),  // 1h atrás
    read: false,
    actions: ['details'],
    actionUrl: '/vamos-comigo',
  },
  {
    id: 4,
    type: 'ride_reminder',
    title: 'Lembrete de carona',
    message: 'Sua carona para Botafogo × Vasco sai em 2 horas. Ponto: Av. Atlântica',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),  // 1h30 atrás
    read: false,
    actions: ['details'],
    actionUrl: '/vamos-comigo',
  },
  {
    id: 5,
    type: 'rating',
    title: 'Avaliação recebida',
    message: 'Carlos Eduardo avaliou sua carona com ⭐ 5 estrelas!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h atrás
    read: true,
    actions: [],
    actionUrl: '/perfil',
  },
  {
    id: 6,
    type: 'promo',
    title: 'Nova caravana disponível',
    message: 'Caravana oficial para o clássico Botafogo × Fluminense! Vagas limitadas.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h atrás
    read: true,
    actions: ['details'],
    actionUrl: '/grupos',
  },
]

// ─── Provider ─────────────────────────────────────────────────────────────────
export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const dismiss = (id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id))

  const respond = (id, action) => {
    // Futuramente: chamar API com accept/decline
    dismiss(id)
  }

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, dismiss, respond }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return ctx
}
