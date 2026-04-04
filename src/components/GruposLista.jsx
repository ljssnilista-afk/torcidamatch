import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { drawThumb, THUMB_CONFIGS } from '../utils/canvasHelpers'
import { occColor } from '../data/gruposData'
import { useToast } from '../context/ToastContext'
import { useFavorites } from '../context/FavoritesContext'
import styles from './GruposLista.module.css'

function Badge({ badge }) {
  const cls = {
    gold: styles.pillGold, green: styles.pillGreen,
    silver: styles.pillSilver, danger: styles.pillDanger,
    feminine: styles.pillFem, new: styles.pillNew,
    price: styles.pillPrice, 'caravana-today': null,
  }[badge.type]

  if (badge.type === 'caravana-today') return (
    <div className={styles.caravanaBadge}>
      <span className={styles.caravanaDot} />
      <span>Caravana hoje</span>
    </div>
  )
  return cls ? <span className={`${styles.pill} ${cls}`}>{badge.label}</span> : null
}

const ACTION_STYLES = {
  brand: { background: '#22C55E', color: '#000' },
  danger: { background: '#EF4444', color: '#fff' },
  silver: { background: '#C8C8C8', color: '#000' },
  feminine: { background: '#C060C0', color: '#fff' },
  outline: { background: 'transparent', color: '#C8C8C8', border: '0.5px solid rgba(255,255,255,0.2)' },
}

export default function GruposListaCard({ group, onClick }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { isGroupFav, toggleGroup } = useFavorites()

  const canvasRef = useRef(null)
  const cfg = THUMB_CONFIGS[group.thumbVariant] ?? THUMB_CONFIGS.green
  const pct = Math.round((group.members / group.maxMembers) * 100)
  const barColor = occColor(pct)
  const actionStyle = ACTION_STYLES[group.actionVariant] ?? ACTION_STYLES.brand
  const isFav = isGroupFav(group.id)

  const handleAction = (e) => {
    e.stopPropagation()
    if (group.actionVariant === 'outline') navigate('/')
    else {
      navigate(`/grupos/${group.id}`)
      toast.success(`Solicitação enviada para ${group.name}!`)
    }
  }

  const handleFav = (e) => {
    e.stopPropagation()
    toggleGroup(group)
    toast.favorite(isFav
      ? `${group.name} removido dos favoritos`
      : `${group.name} adicionado aos favoritos`)
  }

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => drawThumb(canvasRef.current, cfg))
    )
    return () => cancelAnimationFrame(raf)
  }, [cfg])

  return (
    <article
      className={`${styles.card} ${group.isMyGroup ? styles.cardMyGroup : ''}`}
      aria-label={`${group.name}, ${group.location}`}
      onClick={() => onClick?.(group)}
    >
      {/* ── Thumbnail canvas no topo (largura total) ── */}
      <div className={styles.thumbWrap}>
        <canvas ref={canvasRef} width={400} height={100} className={styles.thumbCanvas} />
        <div className={styles.thumbOverlay} />

        {/* Badges no topo do thumb */}
        <div className={styles.thumbTop}>
          {group.hasOfficialBadge
            ? <div className={styles.thumbBadge}>⭑ OFICIAL</div>
            : <div />
          }
          {group.distance ? (
            <div className={styles.thumbDist}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {group.distance}
            </div>
          ) : <div />}
        </div>

        {/* Nome e rating na base do thumb */}
        <div className={styles.thumbBottom}>
          <span className={styles.thumbName}>{group.name}</span>
          {group.rating ? (
            <div className={styles.thumbMeta}>
              <span className={styles.thumbStar}>★</span>
              <strong>{group.rating}</strong>
              <span style={{ opacity: 0.6 }}>({group.ratingCount})</span>
            </div>
          ) : (
            <div className={styles.thumbMeta} style={{ color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)' }}>
              ✦ NOVO
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* Localização + membros */}
        <div className={styles.infoRow}>
          <span className={styles.location}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {group.location}
          </span>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              <strong>{group.members}</strong>
              <span>/{group.maxMembers}</span>
            </div>
          </div>
        </div>

        {/* Barra de ocupação */}
        <div className={styles.occWrap}>
          <div className={styles.occRow}>
            <span className={styles.occLabel}>Ocupação</span>
            <span className={styles.occPct} style={{ color: barColor }}>{pct}%</span>
          </div>
          <div className={styles.occBar}>
            <div className={styles.occFill} style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>

        {/* Badges */}
        {group.badges?.length > 0 && (
          <div className={styles.badges}>
            {group.badges.map((b, i) => <Badge key={i} badge={b} />)}
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.vagas}>
            {group.vagas != null ? `${group.vagas} vagas` : group.mensalidade ?? ''}
          </span>
          <div className={styles.footerActions}>
            <button
              className={`${styles.favBtn} ${isFav ? styles.favBtnActive : ''}`}
              aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar'}
              aria-pressed={isFav}
              onClick={handleFav}
            >
              <svg width="13" height="13" viewBox="0 0 24 24"
                fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
            <button
              className={styles.actionBtn}
              style={actionStyle}
              onClick={handleAction}
              aria-label={group.actionLabel}
            >
              {group.actionLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
