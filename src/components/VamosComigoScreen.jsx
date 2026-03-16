import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RIDES, VC_FILTERS, NEXT_GAME_BANNER, filterRides, sortRides } from '../data/vamosComigoData'
import { ROUTES } from '../utils/constants'
import { useToast } from '../context/ToastContext'
import { useFavorites } from '../context/FavoritesContext'
import { useGame } from '../context/GameContext'
import styles from './VamosComigoScreen.module.css'

// ─── Icons ───────────────────────────────────────────────────────────────────

const VehicleIcon = ({ type }) => {
  if (type === 'van') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1" y="8" width="18" height="11" rx="2"/>
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2"/>
      <circle cx="5.5" cy="18.5" r="1.5"/><circle cx="14.5" cy="18.5" r="1.5"/>
    </svg>
  )
  if (type === 'onibus') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/>
    </svg>
  )
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v3"/>
      <rect x="9" y="11" width="14" height="10" rx="2"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </svg>
  )
}

const VEHICLE_LABELS = { carro: 'Carro', van: 'Van', onibus: 'Ônibus' }

// ─── Ride Card ───────────────────────────────────────────────────────────────

function RideCard({ ride, onReserve, onDetails }) {
  const hasMemberPrice = !!ride.priceMember

  return (
    <article
      className={`${styles.rideCard} ${ride.isOfficial ? styles.rideCardOfficial : ''}`}
      aria-label={`Carona com ${ride.name}, ${VEHICLE_LABELS[ride.vehicle]}, R$${ride.price}`}
    >
      {/* Official top border accent */}
      {ride.isOfficial && <div className={styles.officialAccent} aria-hidden="true" />}

      {/* Card header */}
      <div className={styles.cardHeader}>
        <div className={styles.driverRow}>
          <div className={styles.avatar} style={{ background: ride.avatarBg }}>
            {ride.initials}
          </div>
          <div className={styles.driverInfo}>
            <span className={styles.driverName}>{ride.name}</span>
            <span className={styles.rating}>
              <span className={styles.star}>★</span> {ride.rating}
            </span>
          </div>
        </div>
        {ride.isOfficial && (
          <div className={styles.officialBadge} aria-label="Caravana oficial">
            <span>★ Oficial</span>
          </div>
        )}
      </div>

      {/* Info grid */}
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}><VehicleIcon type={ride.vehicle} /></span>
          <span className={styles.infoText}>{VEHICLE_LABELS[ride.vehicle]}</span>
        </div>
        <div className={styles.infoItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.infoIcon}>
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
          <span className={styles.infoText}>{ride.departure}</span>
        </div>
        <div className={styles.infoItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.infoIcon}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className={styles.infoText}>{ride.neighborhood}</span>
        </div>
        <div className={styles.infoItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.infoIcon}>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <span className={`${styles.infoText} ${styles.vagasText}`}>
            {ride.vagas} {ride.vagas === 1 ? 'vaga' : 'vagas'}
          </span>
        </div>
      </div>

      {/* Distance pill */}
      <div className={styles.distancePill}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span>{ride.distanceKm} km de você</span>
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Price block */}
      <div className={styles.priceBlock}>
        {hasMemberPrice ? (
          <div className={styles.memberPricing}>
            <div>
              <span className={styles.priceLabel}>Membros</span>
              <span className={styles.priceMember}>R$ {ride.priceMember}</span>
            </div>
            <div>
              <span className={styles.priceLabel}>Não membros</span>
              <span className={styles.priceNonMember}>R$ {ride.priceNonMember}</span>
            </div>
            <button className={styles.assineLink} aria-label="Assinar grupo para pagar menos">
              Assine e pague menos →
            </button>
          </div>
        ) : (
          <div className={styles.singlePricing}>
            <span className={styles.priceMain}>R$ {ride.price}</span>
            <span className={styles.perPerson}>por pessoa</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.cardActions}>
        <button
          className={styles.btnDetails}
          onClick={() => onDetails?.(ride)}
          aria-label={`Ver detalhes de ${ride.name}`}
        >
          Detalhes
        </button>
        <button
          className={styles.btnReserve}
          onClick={() => onReserve?.(ride)}
          aria-label={`Reservar carona com ${ride.name}`}
        >
          Reservar
        </button>
      </div>
    </article>
  )
}

// ─── Compact Highlight Card ───────────────────────────────────────────────────

function HighlightCard({ ride, onReserve }) {
  return (
    <div
      className={styles.hlCard}
      role="button"
      tabIndex={0}
      onClick={() => onReserve?.(ride)}
      aria-label={`${ride.name}, R$${ride.price}, ${ride.vagas} vagas`}
    >
      <div className={styles.hlAvatar} style={{ background: ride.avatarBg }}>
        {ride.initials}
      </div>
      <div className={styles.hlName}>{ride.name}</div>
      <div className={styles.hlPrice}>R$ {ride.price}</div>
      <div className={styles.hlMeta}>
        <VehicleIcon type={ride.vehicle} />
        <span>{ride.vagas}v</span>
      </div>
      <div className={styles.hlDist}>{ride.distanceKm} km</div>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skHeader} />
      <div className={styles.skLine} style={{ width: '70%' }} />
      <div className={styles.skLine} style={{ width: '50%' }} />
      <div className={styles.skLine} style={{ width: '80%' }} />
      <div className={styles.skBtn} />
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onOffer }) {
  return (
    <div className={styles.emptyState}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1.2">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/>
      </svg>
      <p className={styles.emptyTitle}>Nenhuma carona encontrada</p>
      <p className={styles.emptySub}>Que tal criar uma oferta para outros torcedores?</p>
      <button className={styles.btnOffer} onClick={onOffer}>
        + Oferecer carona
      </button>
    </div>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function VamosComigoScreen() {
  const navigate    = useNavigate()
  const toast       = useToast()
  const { isRideFav, toggleRide } = useFavorites()
  const { banner, loading: gameLoading } = useGame()

  // Usa banner da API ou fallback do mock
  const gameBanner = banner ?? NEXT_GAME_BANNER

  const [activeFilter, setActiveFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [loading] = useState(false)

  const filteredRides = useMemo(() => {
    let rides = filterRides(RIDES, activeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rides = rides.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.neighborhood.toLowerCase().includes(q) ||
          VEHICLE_LABELS[r.vehicle].toLowerCase().includes(q)
      )
    }
    return sortRides(rides)
  }, [activeFilter, search])

  const highlights = useMemo(
    () => sortRides(RIDES).slice(0, 5),
    []
  )

  return (
    <div className={styles.screen}>

      {/* Screen header */}
      <div className={styles.screenHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Vamos Comigo!</h1>
          <button className={styles.filterBtn} aria-label="Abrir filtros avançados">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <div className={styles.searchBar}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 3.5 3.5"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por bairro, time ou ofertante..."
            className={styles.searchInput}
            aria-label="Buscar caronas"
          />
          {search && (
            <button
              className={styles.clearBtn}
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick filters */}
        <nav className={styles.filters} aria-label="Filtros rápidos">
          {VC_FILTERS.map(f => (
            <button
              key={f.id}
              className={`${styles.chip} ${activeFilter === f.id ? styles.chipActive : ''}`}
              aria-pressed={activeFilter === f.id}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Scrollable content */}
      <div className={styles.scrollArea}>

        {/* Next game banner */}
        <div className={styles.gameBanner}>
          <div className={styles.gameBannerLeft}>
            <span className={styles.gameBannerEye}>Próximo jogo</span>
            <span className={styles.gameBannerMatch}>
              {gameLoading ? '...' : `${gameBanner.home} × ${gameBanner.away}`}
            </span>
            <span className={styles.gameBannerMeta}>
              {gameLoading ? '...' : `${gameBanner.date} • ${gameBanner.time} • ${gameBanner.stadium}`}
            </span>
          </div>
          <div className={styles.gameBannerCount}>
            <span className={styles.countNum}>{RIDES.length}</span>
            <span className={styles.countLabel}>caronas</span>
          </div>
        </div>

        {/* Section title */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Ofertas próximas</span>
          <span className={styles.sectionCount}>
            {filteredRides.length} {filteredRides.length === 1 ? 'oferta' : 'ofertas'}
          </span>
        </div>

        {/* Main carousel */}
        {loading ? (
          <div className={styles.carousel}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filteredRides.length === 0 ? (
          <EmptyState onOffer={() => toast.info("Em breve: oferecer carona!")} />
        ) : (
          <div className={styles.carousel} role="list">
            {filteredRides.map(ride => (
              <RideCard
                key={ride.id}
                ride={ride}
                onReserve={r => toast.success(`Reserva de carona com ${r.name} confirmada!`)}
                onDetails={() => navigate(ROUTES.VAMOS_COMIGO)}
              />
            ))}
            {/* Offer ride card */}
            <div className={styles.offerCard} role="listitem">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1.4">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <p className={styles.offerCardTitle}>Oferecer carona</p>
              <p className={styles.offerCardSub}>Ganhe dinheiro indo ao jogo</p>
              <button className={styles.btnOffer}>Criar oferta</button>
            </div>
          </div>
        )}

        {/* Highlights section */}
        <div className={styles.sectionHeader} style={{ marginTop: 4 }}>
          <span className={styles.sectionTitle}>Caronas em destaque</span>
          <button className={styles.sectionLink}>Ver todas</button>
        </div>

        <div className={styles.highlights} role="list">
          {highlights.map(ride => (
            <HighlightCard
              key={ride.id}
              ride={ride}
              onReserve={r => toast.success(`Reserva com ${r.name} confirmada!`)}
            />
          ))}
        </div>

        {/* Offer CTA */}
        <div className={styles.ctaBanner}>
          <div className={styles.ctaLeft}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/>
            </svg>
            <div>
              <p className={styles.ctaTitle}>Vai de carro ao jogo?</p>
              <p className={styles.ctaSub}>Divida o custo com outros torcedores</p>
            </div>
          </div>
          <button className={styles.ctaBtn}>Oferecer</button>
        </div>

      </div>
    </div>
  )
}
