import { avatarColor, initials } from './helpers'
import styles from '../GrupoScreen.module.css'

export default function GrupoHeader({ grupo, membersCount, onMenu, onBack }) {
  const bg = avatarColor(grupo?.name || '')
  return (
    <div className={styles.header}>
      <button className={styles.backBtn} onClick={onBack} aria-label="Voltar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      {grupo?.photo ? (
        <img src={grupo.photo} alt={grupo.name} loading="lazy" className={styles.headerPhoto} />
      ) : (
        <div className={styles.headerAvatar} style={{ background: bg }}>
          {initials(grupo?.name)}
        </div>
      )}
      <div className={styles.headerInfo}>
        <span className={styles.headerName}>{grupo?.name ?? '...'}</span>
        <span className={styles.headerMeta}>
          {grupo?.code && <span style={{ fontFamily: 'monospace', opacity: 0.5, marginRight: 4 }}>#{grupo.code}</span>}
          {membersCount} {membersCount === 1 ? 'membro' : 'membros'}
          {grupo?.team ? ` • ${grupo.team}` : ''}
        </span>
      </div>
      <button className={styles.menuBtn} onClick={onMenu} aria-label="Opções">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5" r="1" fill="currentColor"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
          <circle cx="12" cy="19" r="1" fill="currentColor"/>
        </svg>
      </button>
    </div>
  )
}
