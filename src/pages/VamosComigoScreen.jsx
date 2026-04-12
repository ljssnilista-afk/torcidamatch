import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { VC_FILTERS } from '../data/vamosComigoData'
import { ROUTES } from '../utils/constants'
import { useToast } from '../context/ToastContext'
import { useFavorites } from '../context/FavoritesContext'
import { useGame } from '../context/GameContext'
import { useUser } from '../context/UserContext'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import styles from './VamosComigoScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const rideIcon = new L.DivIcon({
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#22C55E;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.4)">🚗</div>`,
  className: '', iconSize: [28,28], iconAnchor: [14,14],
})
const userIcon = new L.DivIcon({
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#3B82F6;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  className: '', iconSize: [18,18], iconAnchor: [9,9],
})

// ─── Helpers ───────────────────────────────────────────────────────────────────

function avatarColor(name = '') {
  const colors = ['#22C55E','#3B82F6','#D4AF37','#C060C0','#EF4444','#0EA5E9','#F97316']
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
}

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',')
}

function formatTime(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function formatDate(iso) {
  const d = new Date(iso)
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}

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
      <path d="M7 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9"/>
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
  const hasMemberPrice = ride.memberPrice != null && ride.memberPrice !== ride.price

  return (
    <article
      className={`${styles.rideCard} ${ride.groupName ? styles.rideCardOfficial : ''}`}
      aria-label={`Viagem com ${ride.driverName}, ${VEHICLE_LABELS[ride.vehicle]}, R$${formatPrice(ride.price)}`}
    >
      {ride.groupName && <div className={styles.officialAccent} aria-hidden="true" />}

      <div className={styles.cardHeader}>
        <div className={styles.driverRow}>
          <div className={styles.avatar} style={{ background: avatarColor(ride.driverName) }}>
            {initials(ride.driverName)}
          </div>
          <div className={styles.driverInfo}>
            <span className={styles.driverName}>{ride.driverName}</span>
            <span className={styles.rating}>
              {ride.shareCode && <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--color-brand)', opacity: 0.7, marginRight: 4 }}>{ride.shareCode}</span>}
              {ride.driverHandle && <span style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}>@{ride.driverHandle}</span>}
            </span>
          </div>
        </div>
        {ride.groupName && (
          <div className={styles.officialBadge} aria-label="Caravana oficial">
            <span>★ {ride.groupName}</span>
          </div>
        )}
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}><VehicleIcon type={ride.vehicle} /></span>
          <span className={styles.infoText}>{VEHICLE_LABELS[ride.vehicle]}</span>
        </div>
        <div className={styles.infoItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.infoIcon}>
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
          <span className={styles.infoText}>{formatTime(ride.departureTime)}</span>
        </div>
        <div className={styles.infoItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.infoIcon}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className={styles.infoText}>{ride.bairro || ride.meetPoint}</span>
        </div>
        <div className={styles.infoItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.infoIcon}>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <span className={`${styles.infoText} ${styles.vagasText}`}>
            {ride.availableSeats} {ride.availableSeats === 1 ? 'vaga' : 'vagas'}
          </span>
        </div>
      </div>

      {ride.zona && (
        <div className={styles.distancePill}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span>Zona {ride.zona}</span>
        </div>
      )}

      <div className={styles.divider} />

      <div className={styles.priceBlock}>
        {hasMemberPrice ? (
          <div className={styles.memberPricing}>
            <div>
              <span className={styles.priceLabel}>Membros</span>
              <span className={styles.priceMember}>R$ {formatPrice(ride.memberPrice)}</span>
            </div>
            <div>
              <span className={styles.priceLabel}>Não membros</span>
              <span className={styles.priceNonMember}>R$ {formatPrice(ride.price)}</span>
            </div>
            <button className={styles.assineLink} aria-label="Assinar grupo para pagar menos">
              Assine e pague menos →
            </button>
          </div>
        ) : (
          <div className={styles.singlePricing}>
            <span className={styles.priceMain}>R$ {formatPrice(ride.price)}</span>
            <span className={styles.perPerson}>por pessoa</span>
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        <button
          className={styles.btnDetails}
          onClick={() => onDetails?.(ride)}
          aria-label={`Ver detalhes de ${ride.driverName}`}
        >
          Detalhes
        </button>
        <button
          className={styles.btnReserve}
          onClick={() => onReserve?.(ride)}
          disabled={ride.availableSeats === 0}
          aria-label={`Reservar viagem com ${ride.driverName}`}
        >
          {ride.availableSeats === 0 ? 'Lotada' : 'Reservar'}
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
      aria-label={`${ride.driverName}, R$${formatPrice(ride.price)}, ${ride.availableSeats} vagas`}
    >
      <div className={styles.hlAvatar} style={{ background: avatarColor(ride.driverName) }}>
        {initials(ride.driverName)}
      </div>
      <div className={styles.hlName}>{ride.driverName}</div>
      <div className={styles.hlPrice}>R$ {formatPrice(ride.price)}</div>
      <div className={styles.hlMeta}>
        <VehicleIcon type={ride.vehicle} />
        <span>{ride.availableSeats}v</span>
      </div>
      {ride.bairro && <div className={styles.hlDist}>{ride.bairro}</div>}
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
        <path d="M7 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9"/>
      </svg>
      <p className={styles.emptyTitle}>Nenhuma viagem encontrada</p>
      <p className={styles.emptySub}>Que tal criar uma oferta para outros torcedores?</p>
      <button className={styles.btnOffer} onClick={onOffer}>
        + Oferecer viagem
      </button>
    </div>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function VamosComigoScreen() {
  const navigate    = useNavigate()
  const toast       = useToast()
  const { user }    = useUser()
  const { isRideFav, toggleRide } = useFavorites()
  const { banner, loading: gameLoading } = useGame()
  const token = user?.token

  const gameBanner = banner ?? { home: '...', away: '...', date: '...', time: '...', stadium: '...' }

  const [rides,        setRides]        = useState([])
  const [activeFilter, setActiveFilter] = useState('todos')
  const [search,       setSearch]       = useState('')
  const [loading,      setLoading]      = useState(true)
  const [reserving,    setReserving]    = useState(null)   // ID da viagem sendo reservada
  const [userLocation,  setUserLocation]  = useState(null)
  const [locationLabel, setLocationLabel] = useState('Obtendo localização...')
  const [mapVisible,    setMapVisible]    = useState(false)

  // ── Carregar viagens reais da API ────────────────────────────────────────
  const loadRides = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeFilter === 'carro')  params.set('vehicle', 'carro')
      if (activeFilter === 'van')    params.set('vehicle', 'van')
      if (activeFilter === 'onibus') params.set('vehicle', 'onibus')
      if (user?.team) params.set('team', user.team)

      const res = await fetch(`${API_URL}/rides?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setRides(data.rides || [])
      }
    } catch (err) {
      console.error('[VamosComigoScreen] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeFilter, token, user?.team])

  useEffect(() => { loadRides() }, [loadRides])

  // ── Reservar vaga ──────────────────────────────────────────────────────────
  const handleReserve = async (ride) => {
    if (!token) {
      toast.error('Faça login para reservar')
      return
    }
    if (reserving) return

    setReserving(ride._id)
    try {
      const res = await fetch(`${API_URL}/rides/${ride._id}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Reserva confirmada!')
        loadRides() // recarregar para atualizar vagas
      } else {
        toast.error(data.error || 'Erro ao reservar')
      }
    } catch {
      toast.error('Erro de conexão ao reservar')
    } finally {
      setReserving(null)
    }
  }

  // ── Localização real ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setLocationLabel('Localização indisponível'); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation({ lat, lng })
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
            { headers: { 'User-Agent': 'TorcidaMatch/1.0' } }
          )
          const data = await res.json()
          const bairro = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || ''
          const cidade = data.address?.city || 'Rio de Janeiro'
          setLocationLabel(bairro ? `${bairro} • ${cidade}` : cidade)
        } catch { setLocationLabel('Rio de Janeiro') }
      },
      () => setLocationLabel('Toque para permitir localização'),
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  // ── Filtrar e buscar ──────────────────────────────────────────────────────
  const filteredRides = useMemo(() => {
    let result = [...rides]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        r =>
          r.driverName?.toLowerCase().includes(q) ||
          r.bairro?.toLowerCase().includes(q) ||
          r.meetPoint?.toLowerCase().includes(q) ||
          r.game?.homeTeam?.toLowerCase().includes(q) ||
          r.game?.awayTeam?.toLowerCase().includes(q) ||
          r.shareCode?.toLowerCase().includes(q) ||
          VEHICLE_LABELS[r.vehicle]?.toLowerCase().includes(q)
      )
    }
    return result
  }, [rides, search])

  const highlights = useMemo(
    () => [...rides].slice(0, 5),
    [rides]
  )

  return (
    <div className={styles.screen}>

      {/* Screen header — only title stays fixed */}
      <div className={styles.screenHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            Vamos <em className={styles.titleGreen}>Comigo!</em>
          </h1>
          <button className={styles.filterBtn} aria-label="Abrir filtros avançados">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content — tudo rola junto */}
      <div className={styles.scrollArea}>

        {/* Localização real */}
        <button
          className={styles.locationBar}
          onClick={() => navigator.geolocation?.getCurrentPosition(() => window.location.reload(), () => {})}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className={styles.locationText}>
            {userLocation ? `📍 ${locationLabel}` : locationLabel}
          </span>
          <button
            className={styles.locationUpdate}
            onClick={e => { e.stopPropagation(); setMapVisible(true) }}
          >
            Ver no mapa →
          </button>
        </button>

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
            aria-label="Buscar viagens"
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
            <span className={styles.countNum}>{rides.length}</span>
            <span className={styles.countLabel}>viagens</span>
          </div>
        </div>

        {/* Section title */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Ofertas disponíveis</span>
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
          <EmptyState onOffer={() => navigate(ROUTES.CRIAR_VIAGEM)} />
        ) : (
          <div className={styles.carousel} role="list">
            {filteredRides.map(ride => (
              <RideCard
                key={ride._id}
                ride={ride}
                onReserve={handleReserve}
                onDetails={r => navigate(`/vamos-comigo/${r._id}`)}
              />
            ))}
            {/* Offer ride card */}
            <div className={styles.offerCard} role="listitem">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1.4">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <p className={styles.offerCardTitle}>Oferecer viagem</p>
              <p className={styles.offerCardSub}>Ganhe dinheiro indo ao jogo</p>
              <button className={styles.btnOffer} onClick={() => navigate(ROUTES.CRIAR_VIAGEM)}>Criar oferta</button>
            </div>
          </div>
        )}

        {/* Highlights section */}
        {highlights.length > 0 && (
          <>
            <div className={styles.sectionHeader} style={{ marginTop: 4 }}>
              <span className={styles.sectionTitle}>Viagens em destaque</span>
              <button className={styles.sectionLink}>Ver todas</button>
            </div>

            <div className={styles.highlights} role="list">
              {highlights.map(ride => (
                <HighlightCard
                  key={ride._id}
                  ride={ride}
                  onReserve={handleReserve}
                />
              ))}
            </div>
          </>
        )}

        {/* Offer CTA */}
        <div className={styles.ctaBanner}>
          <div className={styles.ctaLeft}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/><text x="12" y="17" textAnchor="middle" fill="#22C55E" stroke="none" fontSize="14" fontWeight="700" fontFamily="sans-serif">$</text>
            </svg>
            <div>
              <p className={styles.ctaTitle}>Vai de carro ao jogo?</p>
              <p className={styles.ctaSub}>Divida o custo com outros torcedores</p>
            </div>
          </div>
          <button className={styles.ctaBtn} onClick={() => navigate(ROUTES.CRIAR_VIAGEM)}>Oferecer</button>
        </div>

      </div>

      {/* Mapa real */}
      {mapVisible && (
        <div className={styles.mapaOverlay} onClick={() => setMapVisible(false)}>
          <div className={styles.mapaSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.mapaHeader}>
              <span className={styles.mapaTitle}>Viagens no mapa</span>
              <button className={styles.mapaClose} onClick={() => setMapVisible(false)}>✕</button>
            </div>
            <div className={styles.mapaWrap}>
              <MapContainer
                center={userLocation ? [userLocation.lat, userLocation.lng] : [-22.9068, -43.1729]}
                zoom={13}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CARTO'
                />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}{r}.png"
                  attribution='' opacity={0.7}
                />
                {userLocation && (
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                    <Popup>📍 Você está aqui</Popup>
                  </Marker>
                )}
                {filteredRides
                  .filter(r => r.meetCoords?.lat && r.meetCoords?.lng)
                  .map(r => (
                    <Marker key={r._id} position={[r.meetCoords.lat, r.meetCoords.lng]} icon={rideIcon}>
                      <Popup>
                        {r.driverName} • {VEHICLE_LABELS[r.vehicle]} • R$ {formatPrice(r.price)}
                      </Popup>
                    </Marker>
                  ))
                }
              </MapContainer>
            </div>
            <p className={styles.mapaHint}>{filteredRides.length} viagen{filteredRides.length !== 1 ? 's' : ''} disponíve{filteredRides.length !== 1 ? 'is' : 'l'}</p>
          </div>
        </div>
      )}
    </div>
  )
}


