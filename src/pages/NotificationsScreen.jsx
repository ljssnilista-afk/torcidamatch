import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'
import styles from './NotificationsScreen.module.css'

// ─── Ícones por tipo ──────────────────────────────────────────────────────────
const TYPE_ICONS = {
  group_invite: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  join_request: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  ride_booked: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9"/>
    </svg>
  ),
  ride_reminder: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  rating: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  ),
  promo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
}

const TYPE_COLORS = {
  group_invite:  'var(--color-brand)',
  join_request:  'var(--color-brand)',
  ride_booked:   '#3B82F6',
  ride_reminder: 'var(--color-gold)',
  rating:        'var(--color-gold)',
  promo:         'var(--color-feminine)',
}

// ─── Formata timestamp relativo ───────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)   return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400)return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

// ─── Card de notificação ──────────────────────────────────────────────────────
function NotifCard({ notif, onMarkRead, onDismiss, onRespond, onNavigate }) {
  const color = TYPE_COLORS[notif.type] ?? 'var(--color-brand)'

  const handleClick = () => {
    onMarkRead(notif.id)
    onNavigate(notif.actionUrl)
  }

  return (
    <div
      className={`${styles.card} ${!notif.read ? styles.cardUnread : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={notif.message}
    >
      {/* Ícone */}
      <div className={styles.iconWrap} style={{ color, background: `${color}18` }}>
        {TYPE_ICONS[notif.type]}
      </div>

      {/* Conteúdo */}
      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={styles.title}>{notif.title}</span>
          <span className={styles.time}>{timeAgo(notif.timestamp)}</span>
        </div>
        <p className={styles.message}>{notif.message}</p>

        {/* Botões de ação */}
        {notif.actions.length > 0 && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            {notif.actions.includes('accept') && (
              <button
                className={styles.btnAccept}
                onClick={() => onRespond(notif.id, 'accept')}
                aria-label="Aceitar"
              >
                Aceitar
              </button>
            )}
            {notif.actions.includes('decline') && (
              <button
                className={styles.btnDecline}
                onClick={() => onRespond(notif.id, 'decline')}
                aria-label="Recusar"
              >
                Recusar
              </button>
            )}
            {notif.actions.includes('details') && (
              <button
                className={styles.btnDetails}
                onClick={() => { onMarkRead(notif.id); onNavigate(notif.actionUrl) }}
                aria-label="Ver detalhes"
              >
                Ver detalhes
              </button>
            )}
          </div>
        )}
      </div>

      {/* Indicador não lida + fechar */}
      <div className={styles.rightCol}>
        {!notif.read && <div className={styles.unreadDot} aria-label="Não lida" />}
        <button
          className={styles.dismissBtn}
          onClick={(e) => { e.stopPropagation(); onDismiss(notif.id) }}
          aria-label="Remover notificação"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss, respond } =
    useNotifications()

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className={styles.title}>Notificações</h1>
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={markAllAsRead}>
            Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <p className={styles.emptyText}>Nenhuma notificação</p>
            <p className={styles.emptySub}>Você está em dia com tudo! ⚽</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotifCard
              key={notif.id}
              notif={notif}
              onMarkRead={markAsRead}
              onDismiss={dismiss}
              onRespond={respond}
              onNavigate={navigate}
            />
          ))
        )}
      </div>
    </div>
  )
}

