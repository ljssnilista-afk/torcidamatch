import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { teamLogoUrl } from '../utils/bsdApi'
import { ROUTES } from '../utils/constants'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import styles from './DetalhesViagemScreen.module.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
const meetIcon = new L.DivIcon({
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#22C55E;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.4)">📍</div>`,
  className: '', iconSize: [28,28], iconAnchor: [14,14],
})

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

const TEAM_API_IDS = { 'Botafogo': 1958, 'Flamengo': 5981, 'Fluminense': 1961, 'Vasco da Gama': 1974 }

function formatPrice(c) { return (c / 100).toFixed(2).replace('.', ',') }
function formatDate(iso) {
  const d = new Date(iso), days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}
function formatTime(iso) { const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
function avatarColor(n = '') { const c = ['#22C55E','#3B82F6','#D4AF37','#C060C0','#EF4444','#0EA5E9','#F97316']; let h = 0; for (const x of n) h = x.charCodeAt(0)+((h<<5)-h); return c[Math.abs(h)%c.length] }
function initials(n = '') { return n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }

const VEHICLE_MAP = { carro: { icon: '🚗', label: 'Carro' }, van: { icon: '🚐', label: 'Van' }, onibus: { icon: '🚌', label: 'Ônibus' } }
const STATUS_MAP = { open: { label: 'Aberta', color: '#22C55E' }, full: { label: 'Lotada', color: '#D4AF37' }, in_progress: { label: 'Em andamento', color: '#3B82F6' }, completed: { label: 'Concluída', color: '#22C55E' }, cancelled: { label: 'Cancelada', color: '#EF4444' } }
const PASS_STATUS = { reserved: 'Reservado', paid: 'Pago', confirmed: 'Confirmou', cancelled: 'Cancelou' }

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHandle} />
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={onCancel}>Voltar</button>
          <button className={`${styles.modalConfirm} ${danger ? styles.modalDanger : ''}`} onClick={onConfirm} disabled={loading}>
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DetalhesViagemScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useUser()
  const token = user?.token

  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [modal, setModal] = useState(null)

  const isDriver = ride && String(ride.driver) === String(user?.id)
  const myReservation = ride?.passengers?.find(p => String(p.user) === String(user?.id) && p.status !== 'cancelled')
  const activePassengers = ride?.passengers?.filter(p => p.status !== 'cancelled') || []
  const availableSeats = ride ? ride.totalSeats - activePassengers.length : 0
  const occupancyPct = ride ? ((activePassengers.length / ride.totalSeats) * 100) : 0
  const isPast = ride ? new Date(ride.departureTime) < new Date() : false

  const loadRide = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/rides/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (res.ok) { const data = await res.json(); setRide(data.ride) }
      else { toast.error('Viagem não encontrada'); navigate(ROUTES.VAMOS_COMIGO) }
    } catch { toast.error('Erro ao carregar') } finally { setLoading(false) }
  }, [id, token])

  useEffect(() => { loadRide() }, [loadRide])

  const doAction = async (url, method = 'POST', successMsg) => {
    setActionLoading(true)
    try {
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) { toast.success(data.message || successMsg); method === 'DELETE' && url.endsWith(id) ? navigate(ROUTES.VAMOS_COMIGO) : loadRide() }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setActionLoading(false); setModal(null) }
  }

  const handleShare = () => {
    const link = `https://torcidamatch.vercel.app/vamos-comigo/${ride._id}`
    navigator.clipboard?.writeText(link)
    toast.success('Link copiado!')
  }

  if (loading) return (
    <div className={styles.screen}>
      <div className={styles.header}><div className={styles.skLine} style={{ width: '40%', height: 16 }} /></div>
      <div className={styles.skBody}>{[1,2,3,4].map(i => <div key={i} className={styles.skBlock} />)}</div>
    </div>
  )
  if (!ride) return null

  const st = STATUS_MAP[ride.status] || STATUS_MAP.open
  const vh = VEHICLE_MAP[ride.vehicle] || VEHICLE_MAP.carro
  const homeApiId = TEAM_API_IDS[ride.game.homeTeam]
  const awayApiId = TEAM_API_IDS[ride.game.awayTeam]
  const hasCoords = ride.meetCoords?.lat && ride.meetCoords?.lng
  const hasMemberPrice = ride.memberPrice != null && ride.memberPrice !== ride.price

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(ROUTES.VAMOS_COMIGO)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 className={styles.headerTitle}>Detalhes da viagem</h1>
        <button className={styles.shareBtn} onClick={handleShare} aria-label="Compartilhar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
      </div>

      <div className={styles.scrollArea}>
        {/* Status + role */}
        <div className={styles.statusRow}>
          <span className={styles.statusBadge} style={{ background: `${st.color}15`, color: st.color, borderColor: `${st.color}40` }}>{st.label}</span>
          {isDriver && <span className={styles.roleBadge} style={{ color: '#22C55E', background: 'rgba(34,197,94,0.1)' }}>Você é o motorista</span>}
          {myReservation && !isDriver && <span className={styles.roleBadge} style={{ color: '#3B82F6', background: 'rgba(59,130,246,0.1)' }}>Você tem reserva</span>}
        </div>

        {/* Game card — premium */}
        <div className={styles.gameCard}>
          <div className={styles.gameGlow} />
          <div className={styles.gameMatchup}>
            <div className={styles.gameTeam}>
              {homeApiId
                ? <img src={teamLogoUrl(homeApiId)} alt="" className={styles.teamLogo} onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }} />
                : null}
              <div className={styles.teamLogoFallback} style={{ display: homeApiId ? 'none' : 'flex' }}>{ride.game.homeTeam.slice(0,3).toUpperCase()}</div>
              <span className={styles.teamName}>{ride.game.homeTeam}</span>
            </div>
            <div className={styles.vsCircle}><span>VS</span></div>
            <div className={styles.gameTeam}>
              {awayApiId
                ? <img src={teamLogoUrl(awayApiId)} alt="" className={styles.teamLogo} onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }} />
                : null}
              <div className={styles.teamLogoFallback} style={{ display: awayApiId ? 'none' : 'flex' }}>{ride.game.awayTeam.slice(0,3).toUpperCase()}</div>
              <span className={styles.teamName}>{ride.game.awayTeam}</span>
            </div>
          </div>
          <div className={styles.gameMeta}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
            <span>{formatDate(ride.game.date)} • {formatTime(ride.game.date)}</span>
            <span className={styles.gameMetaDot}>•</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>{ride.game.stadium}</span>
          </div>
        </div>

        {/* Driver */}
        <div className={styles.card}>
          <div className={styles.cardLabel}>Motorista</div>
          <div className={styles.driverRow}>
            <div className={styles.driverAvatar} style={{ background: avatarColor(ride.driverName) }}>{initials(ride.driverName)}</div>
            <div className={styles.driverInfo}>
              <span className={styles.driverName}>{ride.driverName}</span>
              {ride.driverHandle && <span className={styles.driverHandle}>@{ride.driverHandle}</span>}
            </div>
            {ride.groupName && <span className={styles.groupBadge}>★ {ride.groupName}</span>}
          </div>
        </div>

        {/* Details */}
        <div className={styles.card}>
          <div className={styles.cardLabel}>Detalhes</div>
          <div className={styles.detailRow}><span className={styles.detailEmoji}>{vh.icon}</span><div><span className={styles.detailKey}>Veículo</span><span className={styles.detailVal}>{vh.label}</span></div></div>
          <div className={styles.detailRow}>
            <span className={styles.detailEmoji}>👥</span>
            <div style={{ flex: 1 }}>
              <span className={styles.detailKey}>Vagas</span>
              <span className={styles.detailVal}>{availableSeats} de {ride.totalSeats} disponíveis</span>
              <div className={styles.occBar}><div className={styles.occFill} style={{ width: `${occupancyPct}%`, background: occupancyPct >= 100 ? '#D4AF37' : '#22C55E' }} /></div>
            </div>
          </div>
          <div className={styles.detailRow}><span className={styles.detailEmoji}>🕐</span><div><span className={styles.detailKey}>Saída</span><span className={styles.detailVal}>{formatTime(ride.departureTime)}</span></div></div>
          <div className={styles.detailRow}><span className={styles.detailEmoji}>📍</span><div><span className={styles.detailKey}>Ponto de encontro</span><span className={styles.detailVal}>{ride.meetPoint}</span></div></div>
          {ride.bairro && <div className={styles.detailRow}><span className={styles.detailEmoji}>🏘️</span><div><span className={styles.detailKey}>Local</span><span className={styles.detailVal}>{ride.bairro}{ride.zona ? `, Zona ${ride.zona}` : ''}</span></div></div>}
        </div>

        {/* Mini map */}
        {hasCoords && (
          <div className={styles.card}>
            <div className={styles.cardLabel}>Ponto de encontro</div>
            <div className={styles.miniMap}>
              <MapContainer center={[ride.meetCoords.lat, ride.meetCoords.lng]} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false} scrollWheelZoom={false} dragging={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}{r}.png" attribution="CARTO" />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}{r}.png" opacity={0.7} />
                <Marker position={[ride.meetCoords.lat, ride.meetCoords.lng]} icon={meetIcon}><Popup>{ride.meetPoint}</Popup></Marker>
              </MapContainer>
            </div>
          </div>
        )}

        {/* Price */}
        <div className={styles.card}>
          <div className={styles.cardLabel}>Preço</div>
          <div className={styles.priceBlock}>
            <div className={styles.priceMain}>
              <span className={styles.priceVal}>R$ {formatPrice(ride.price)}</span>
              <span className={styles.priceSub}>por vaga</span>
            </div>
            {hasMemberPrice && (
              <div className={styles.priceMember}>
                <div className={styles.priceMemberLeft}>
                  <span className={styles.priceMemberVal}>R$ {formatPrice(ride.memberPrice)}</span>
                  <span className={styles.priceMemberSub}>membros do {ride.groupName || 'grupo'}</span>
                </div>
                <span className={styles.priceSave}>-{Math.round((1 - ride.memberPrice / ride.price) * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Passengers (driver view) */}
        {isDriver && activePassengers.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardLabel}>Passageiros ({activePassengers.length})</div>
            {activePassengers.map((p, i) => (
              <div key={i} className={styles.passRow}>
                <div className={styles.passAvatar} style={{ background: avatarColor(p.name) }}>{initials(p.name)}</div>
                <div className={styles.passInfo}>
                  <span className={styles.passName}>{p.name}</span>
                  <span className={styles.passMeta}>R$ {formatPrice(p.paidAmount)} {p.isMember ? '• membro' : ''}</span>
                </div>
                <span className={`${styles.passStatus} ${p.status === 'confirmed' ? styles.passConfirmed : ''}`}>{PASS_STATUS[p.status]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Finance (completed, driver) */}
        {isDriver && ride.status === 'completed' && (
          <div className={styles.card}>
            <div className={styles.cardLabel}>Financeiro (simulado)</div>
            <div className={styles.finRow}><span>Recebido</span><span className={styles.finGreen}>R$ {formatPrice(ride.releasedTotal)}</span></div>
            <div className={styles.finRow}><span>Comissão (20%)</span><span className={styles.finRed}>- R$ {formatPrice(ride.appCommission)}</span></div>
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* Bottom actions */}
      {ride.status !== 'cancelled' && ride.status !== 'completed' && (
        <div className={styles.bottomBar}>
          {isDriver && (
            <div className={styles.actionRow}>
              <button className={styles.btnDanger} onClick={() => setModal({ type: 'cancel' })}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              {isPast && !ride.driverConfirmed && (
                <button className={styles.btnPrimary} onClick={() => setModal({ type: 'confirmDriver' })}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                  Confirmar viagem
                </button>
              )}
              {ride.driverConfirmed && <span className={styles.confirmedTag}>✓ Confirmada</span>}
            </div>
          )}
          {!isDriver && myReservation && (
            <div className={styles.actionRow}>
              <button className={styles.btnDanger} onClick={() => setModal({ type: 'cancelReservation' })}>Desistir</button>
              {isPast && myReservation.status !== 'confirmed' && (
                <button className={styles.btnPrimary} onClick={() => setModal({ type: 'confirmPassenger' })}>Confirmar viagem</button>
              )}
              {myReservation.status === 'confirmed' && <span className={styles.confirmedTag}>✓ Confirmada</span>}
            </div>
          )}
          {!isDriver && !myReservation && availableSeats > 0 && (
            <button className={styles.btnReserve} onClick={() => doAction(`${API_URL}/rides/${id}/reserve`, 'POST', 'Reserva confirmada!')} disabled={actionLoading}>
              {actionLoading ? 'Reservando...' : `Reservar vaga • R$ ${formatPrice(ride.price)}`}
            </button>
          )}
          {!isDriver && !myReservation && availableSeats === 0 && (
            <button className={styles.btnFull} disabled>Viagem lotada</button>
          )}
        </div>
      )}

      {/* Status completed/cancelled */}
      {(ride.status === 'completed' || ride.status === 'cancelled') && (
        <div className={styles.bottomBar}>
          <button className={styles.btnBack} onClick={() => navigate(ROUTES.VAMOS_COMIGO)}>
            Voltar para viagens
          </button>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'cancel' && <ConfirmModal title="Cancelar viagem" message="Tem certeza? Todos os passageiros serão reembolsados automaticamente." confirmLabel="Sim, cancelar" danger onConfirm={() => doAction(`${API_URL}/rides/${id}`, 'DELETE')} onCancel={() => setModal(null)} loading={actionLoading} />}
      {modal?.type === 'cancelReservation' && <ConfirmModal title="Desistir da reserva" message="Você será reembolsado automaticamente (simulado)." confirmLabel="Sim, desistir" danger onConfirm={() => doAction(`${API_URL}/rides/${id}/cancel-reservation`, 'DELETE')} onCancel={() => setModal(null)} loading={actionLoading} />}
      {modal?.type === 'confirmDriver' && <ConfirmModal title="Confirmar viagem" message="Confirme que a viagem aconteceu. Quando todos os passageiros também confirmarem, o pagamento será liberado." confirmLabel="Confirmar" onConfirm={() => doAction(`${API_URL}/rides/${id}/confirm/driver`)} onCancel={() => setModal(null)} loading={actionLoading} />}
      {modal?.type === 'confirmPassenger' && <ConfirmModal title="Confirmar viagem" message="Confirme que você participou desta viagem." confirmLabel="Confirmar" onConfirm={() => doAction(`${API_URL}/rides/${id}/confirm/passenger`)} onCancel={() => setModal(null)} loading={actionLoading} />}
    </div>
  )
}
