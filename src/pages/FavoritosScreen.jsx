import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { drawThumb, THUMB_CONFIGS } from '../utils/canvasHelpers'
import { ROUTES } from '../utils/constants'
import { useFavorites } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'
import styles from './FavoritosScreen.module.css'

// ─── Vehicle icons ────────────────────────────────────────────────────────────
const VEHICLE_ICONS = {
  ônibus: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8l5 3-5 3" />
    </svg>
  ),
  van: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1" y="8" width="18" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2" />
      <circle cx="5.5" cy="18.5" r="1.5" /><circle cx="14.5" cy="18.5" r="1.5" />
    </svg>
  ),
  carro: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v3" />
      <rect x="9" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    </svg>
  ),
}

// ─── Heart button ─────────────────────────────────────────────────────────────
function HeartBtn({ active, onToggle, label }) {
  return (
    <button
      className={`${styles.heartBtn} ${active ? styles.heartActive : ''}`}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      aria-label={active ? `Remover ${label} dos favoritos` : `Adicionar ${label} aos favoritos`}
      aria-pressed={active}
    >
      <svg width="18" height="18" viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  )
}

// ─── Group favourite card ─────────────────────────────────────────────────────
function GroupFavCard({ group, onRemove, onClick }) {
  const canvasRef = useRef(null)
  const cfg = THUMB_CONFIGS[group.thumbVariant] ?? THUMB_CONFIGS.green
  const pct = Math.round((group.members / group.maxMembers) * 100)
  const barColor = pct >= 90 ? '#EF4444' : pct >= 75 ? '#D4AF37' : '#22C55E'

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => drawThumb(canvasRef.current, cfg))
    )
    return () => cancelAnimationFrame(raf)
  }, [cfg])

  return (
    <article
      className={styles.groupCard}
      onClick={() => onClick?.(group)}
      aria-label={`${group.name}, ${group.members} de ${group.maxMembers} membros`}
    >
      <div className={styles.groupThumb}>
        <canvas ref={canvasRef} width={54} height={54} className={styles.thumbCanvas} />
      </div>
      <div className={styles.groupInfo}>
        <div className={styles.groupInfoTop}>
          <span className={styles.groupName}>{group.name}</span>
          <HeartBtn active label={group.name} onToggle={() => onRemove(group.id)} />
        </div>
        <div className={styles.groupMeta}>
          <span className={styles.metaItem}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            <strong>{group.members}</strong>/{group.maxMembers}
          </span>
          <span className={styles.dot}>·</span>
          <span className={styles.metaItem}>
            <span className={styles.star}>★</span>
            <strong>{group.rating}</strong>
            <span className={styles.ratingCount}>({group.ratingCount})</span>
          </span>
        </div>
        <div className={styles.groupSubMeta}>
          <span className={styles.teamTag}>{group.team}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.regionTag}>{group.region}</span>
          {group.mensalidade && (
            <><span className={styles.dot}>·</span>
            <span className={styles.price}>{group.mensalidade}</span></>
          )}
        </div>
        <div className={styles.occBar}>
          <div className={styles.occFill} style={{ width: `${pct}%`, background: barColor }} />
        </div>
        {group.badge && (
          <span className={`${styles.badge} ${styles[`badge_${group.badge}`]}`}>
            {group.badgeLabel}
          </span>
        )}
      </div>
    </article>
  )
}

// ─── Ride favourite card ──────────────────────────────────────────────────────
function RideFavCard({ ride, onRemove, onClick }) {
  return (
    <article
      className={styles.rideCard}
      onClick={() => onClick?.(ride)}
      aria-label={`${ride.name}, ${ride.vehicleLabel}, ${ride.price}`}
    >
      <div className={styles.rideAvatar} style={ride.avatarStyle}>{ride.initials}</div>
      <div className={styles.rideInfo}>
        <div className={styles.rideInfoTop}>
          <div>
            <span className={styles.rideName}>{ride.name}</span>
            {ride.isOficial && <span className={styles.oficialBadge}>★ Oficial</span>}
          </div>
          <HeartBtn active label={ride.name} onToggle={() => onRemove(ride.id)} />
        </div>
        <div className={styles.rideMeta}>
          <span className={styles.metaItem} aria-label={`Veículo: ${ride.vehicleLabel}`}>
            <span aria-hidden="true">{VEHICLE_ICONS[ride.vehicle]}</span>
            {ride.vehicleLabel}
          </span>
          <span className={styles.dot}>·</span>
          <span className={styles.ridePrice}>{ride.price}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.metaItem}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
            {ride.time}
          </span>
          <span className={styles.dot}>·</span>
          <span className={`${styles.metaItem} ${styles.vagasItem}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            {ride.vagas} vagas
          </span>
        </div>
        <div className={styles.rideFrom}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          {ride.from}
        </div>
      </div>
    </article>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ tab, onExplore }) {
  const isGroups = tab === 'grupos'
  return (
    <div className={styles.emptyState} role="status">
      <div className={styles.emptyIcon} aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </div>
      <p className={styles.emptyTitle}>{isGroups ? 'Nenhum grupo favorito' : 'Nenhuma viagem favorita'}</p>
      <p className={styles.emptySubtitle}>
        {isGroups
          ? 'Explore grupos de torcedores e toque no coração para salvar.'
          : 'Explore as viagens disponíveis e salve as que preferir.'}
      </p>
      <button className={styles.emptyBtn} onClick={() => onExplore(isGroups ? ROUTES.GRUPOS : ROUTES.VAMOS_COMIGO)}>
        {isGroups ? 'Explorar grupos' : 'Explorar viagens'}
      </button>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard({ variant = 'group' }) {
  return (
    <div className={`${styles.skeleton} ${variant === 'ride' ? styles.skeletonRide : ''}`} aria-hidden="true">
      <div className={styles.skeletonThumb} />
      <div className={styles.skeletonLines}>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineMid}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineNarrow}`} />
      </div>
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onSwitch, groupCount, rideCount }) {
  return (
    <div className={styles.tabBar} role="tablist" aria-label="Categorias de favoritos">
      {[
        { id: 'grupos',   label: 'Grupos',   count: groupCount },
        { id: 'viagens',  label: 'Viagens',  count: rideCount  },
      ].map(({ id, label, count }) => (
        <button
          key={id}
          role="tab"
          className={`${styles.tab} ${active === id ? styles.tabActive : ''}`}
          aria-selected={active === id}
          onClick={() => onSwitch(id)}
        >
          {label}
          {count > 0 && <span className={styles.tabCount}>{count}</span>}
        </button>
      ))}
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function FavoritosScreen() {
  const navigate = useNavigate()

  // ── Contexts ──────────────────────────────────────────────────────────────
  const { favGroups, favRides, removeGroup, removeRide, totalCount } = useFavorites()
  const toast = useToast()

  // ── Local UI state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('grupos')
  const [loading,   setLoading]   = useState(true)
  const [removing,  setRemoving]  = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  const handleRemoveGroup = useCallback((id) => {
    const group = favGroups.find((g) => g.id === id)
    setRemoving(id)
    setTimeout(() => {
      removeGroup(id)
      setRemoving(null)
      if (group) toast.favorite(`${group.name} removido dos favoritos`)
    }, 300)
  }, [favGroups, removeGroup, toast])

  const handleRemoveRide = useCallback((id) => {
    const ride = favRides.find((r) => r.id === id)
    setRemoving(id)
    setTimeout(() => {
      removeRide(id)
      setRemoving(null)
      if (ride) toast.favorite(`${ride.name} removido dos favoritos`)
    }, 300)
  }, [favRides, removeRide, toast])

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Favoritos</h1>
          {totalCount > 0 && (
            <span className={styles.totalBadge}>{totalCount}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <TabBar
        active={activeTab}
        onSwitch={setActiveTab}
        groupCount={favGroups.length}
        rideCount={favRides.length}
      />

      {/* Content */}
      <div
        className={styles.scrollArea}
        role="tabpanel"
        aria-label={activeTab === 'grupos' ? 'Grupos favoritos' : 'Viagens favoritas'}
      >
        {loading ? (
          <div className={styles.listWrap}>
            {[1,2,3].map((i) => (
              <SkeletonCard key={i} variant={activeTab === 'grupos' ? 'group' : 'ride'} />
            ))}
          </div>
        ) : activeTab === 'grupos' ? (
          favGroups.length === 0 ? (
            <EmptyState tab="grupos" onExplore={navigate} />
          ) : (
            <div className={styles.listWrap}>
              <p className={styles.sectionLabel}>
                {favGroups.length} {favGroups.length === 1 ? 'grupo salvo' : 'grupos salvos'}
              </p>
              {favGroups.map((g) => (
                <div
                  key={g.id}
                  className={`${styles.cardWrap} ${removing === g.id ? styles.cardRemoving : ''}`}
                >
                  <GroupFavCard
                    group={g}
                    onRemove={handleRemoveGroup}
                    onClick={() => navigate(ROUTES.GRUPOS)}
                  />
                </div>
              ))}

              {/* Stats do usuário */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{favGroups.length}</span>
                  <span className={styles.statLabel}>Grupos salvos</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{favRides.length}</span>
                  <span className={styles.statLabel}>Viagens salvas</span>
                </div>
              </div>

              <div className={styles.suggestStrip}>
                <p className={styles.suggestLabel}>Você pode gostar</p>
                <button className={styles.suggestBtn} onClick={() => navigate(ROUTES.GRUPOS)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  Explorar mais grupos
                </button>
              </div>

              {/* Banner CTA */}
              <div className={styles.ctaBanner} onClick={() => navigate(ROUTES.VAMOS_COMIGO)}>
                <div className={styles.ctaLeft}>
                  <div className={styles.ctaIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/>
                    </svg>
                  </div>
                  <div>
                    <p className={styles.ctaTitle}>Próximo jogo chegando!</p>
                    <p className={styles.ctaSub}>Veja viagens disponíveis para torcedores</p>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          )
        ) : (
          favRides.length === 0 ? (
            <EmptyState tab="viagens" onExplore={navigate} />
          ) : (
            <div className={styles.listWrap}>
              <p className={styles.sectionLabel}>
                {favRides.length} {favRides.length === 1 ? 'viagem salva' : 'viagens salvas'}
              </p>
              {favRides.map((r) => (
                <div
                  key={r.id}
                  className={`${styles.cardWrap} ${removing === r.id ? styles.cardRemoving : ''}`}
                >
                  <RideFavCard
                    ride={r}
                    onRemove={handleRemoveRide}
                    onClick={() => navigate(ROUTES.VAMOS_COMIGO)}
                  />
                </div>
              ))}
              <div className={styles.suggestStrip}>
                <p className={styles.suggestLabel}>Precisa de mais opções?</p>
                <button className={styles.suggestBtn} onClick={() => navigate(ROUTES.VAMOS_COMIGO)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8l5 3-5 3" />
                  </svg>
                  Ver todas as viagens
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

