import { avatarColor, initials, timeStr } from './helpers'
import styles from '../GrupoScreen.module.css'

export function MessageBubble({ msg, isOwn }) {
  if (msg.type === 'system') {
    return (
      <div className={styles.systemMsg}>
        <span>{msg.text}</span>
      </div>
    )
  }
  return (
    <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
      {!isOwn && (
        <div className={styles.bubbleAvatar} style={{ background: avatarColor(msg.senderName) }}>
          {initials(msg.senderName)}
        </div>
      )}
      <div className={styles.bubbleContent}>
        {!isOwn && <span className={styles.bubbleSender}>{msg.senderName}</span>}
        <div className={styles.bubbleText}>{msg.text}</div>
        <span className={styles.bubbleTime}>{timeStr(msg.createdAt)}</span>
      </div>
    </div>
  )
}

export function EmptyChat({ onInvite }) {
  return (
    <div className={styles.emptyChat}>
      <div className={styles.emptyChatIcon}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </div>
      <p className={styles.emptyChatTitle}>Nenhuma mensagem ainda</p>
      <p className={styles.emptyChatSub}>Seja o primeiro a mandar um olá!</p>
      <button className={styles.inviteBtn} onClick={onInvite}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        Convidar pessoas
      </button>
    </div>
  )
}
