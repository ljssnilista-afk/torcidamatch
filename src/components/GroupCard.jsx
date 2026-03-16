import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { drawStadium, STADIUM_CONFIGS } from '../utils/canvasHelpers'
import { ROUTES } from '../utils/constants'
import { useFavorites } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'
import styles from './GroupCard.module.css'

const ACTION_VARIANTS = {
  white: { background: '#fff', color: '#000' },
  danger: { background: '#EF4444', color: '#fff' },
  silver: { background: '#C8C8C8', color: '#000' },
  brand: { background: '#22C55E', color: '#000' },
}

const BADGE_VARIANTS = {
  oficial: styles.badgeGold,
  green: styles.badgeGreen,
  silver: styles.badgeSilver,
  verified: styles.badgeGreen,
}

export default function GroupCard({ group, onDetails, onAction }) {
  const navigate = useNavigate()
  const toast    = useToast()
  const { isGroupFav, toggleGroup } = useFavorites()

  const canvasRef = useRef(null)
  const cfg = STADIUM_CONFIGS[group.canvasVariant ?? 0]
  const pct = Math.round((group.members / group.maxMembers) * 100)
  const barColor = pct >= 90 ? '#EF4444' : pct >= 75 ? '#D4AF37' : '#22C55E'
  const actionStyle = ACTION_VARIANTS[group.actionVariant] ?? ACTION_VARIANTS.white
  const isFav = isGroupFav(group.id)

  const handleShare = (e) => {
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({ title: group.name, text: `Conheça o grupo ${group.name} no TorcidaMatch!`, url: window.location.href })
    } else {
      navigator.clipboard?.writeText(window.location.href)
      toast.success('Link copiado!')
    }
  }

  const handleFav = (e) => {
    e.stopPropagation()
    toggleGroup(group)
    toast.favorite(isFav ? `${group.name} removido dos favoritos` : `${group.name} adicionado aos favoritos`)
  }

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => drawStadium(canvasRef.current, cfg))
    )
    return () => cancelAnimationFrame(raf)
  }, [cfg])

  return (
    <article
      className={styles.card}
      aria-label={`Grupo ${group.name}, ${group.region}, ${group.members} de ${group.maxMembers} membros`}
    >
      <canvas ref={canvasRef} className={styles.canvas} width={362} height={560} />
      <div className={styles.overlay} aria-hidden="true" />

      {/* Share button */}
      <button className={styles.shareBtn} aria-label={`Compartilhar grupo ${group.name}`} onClick={handleShare}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>

      {/* Favourite button */}
      <button
        className={`${styles.favBtn} ${isFav ? styles.favBtnActive : ''}`}
        aria-label={isFav ? `Remover ${group.name} dos favoritos` : `Adicionar ${group.name} aos favoritos`}
        aria-pressed={isFav}
        onClick={handleFav}
      >
        <svg width="14" height="14" viewBox="0 0 24 24"
          fill={isFav ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </button>

      {/* Top badges */}
      <div className={styles.top}>
        {group.badge ? (
          <div className={`${styles.badge} ${BADGE_VARIANTS[group.badge] ?? styles.badgeGold}`}>
            {group.badgeLabel}
          </div>
        ) : (
          <div className={styles.badgeEmpty} aria-hidden="true" />
        )}
        <div className={styles.distBadge}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span>{group.distance}</span>
        </div>
      </div>

      {/* Bottom content */}
      <div className={styles.bottom}>
        <div className={styles.teamChip}>
          <span className={styles.bfgDot} aria-hidden="true" />
          <span className={styles.teamName}>{group.team}</span>
          <span className={styles.regionTag}>• {group.region}</span>
        </div>

        <h2 className={styles.name}>{group.name}</h2>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            <strong>{group.members}</strong><span>/{group.maxMembers} membros</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.star} aria-label="Avaliação">★</span>
            <strong>{group.rating}</strong>
            <span>({group.ratingCount})</span>
          </div>
        </div>

        {group.meetPoint && (
          <div className={styles.meetPoint}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span>Ponto: </span><strong>{group.meetPoint}</strong>
          </div>
        )}

        {/* Occupation bar */}
        <div className={styles.occWrap}>
          <div className={styles.occLabels}>
            <span>Ocupação</span>
            <strong style={{ color: barColor }}>{pct}%{pct >= 90 ? ' — Quase lotado' : ''}</strong>
          </div>
          <div className={styles.occBar}>
            <div className={styles.occFill} style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnOutline}
            onClick={() => onDetails?.(group)}
            aria-label={`Ver detalhes de ${group.name}`}
          >
            Ver detalhes
          </button>
          <button
            className={styles.btnSolid}
            style={actionStyle}
            onClick={() => onAction?.(group)}
            aria-label={`${group.actionLabel} — ${group.name}`}
          >
            {group.actionLabel}
          </button>
        </div>
      </div>
    </article>
  )
}
