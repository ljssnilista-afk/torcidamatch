import { useState, useEffect, useCallback, useRef } from 'react'
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

// ─── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    if (!targetDate) return
    function calc() {
      const now = new Date(), target = new Date(targetDate)
      const diff = target - now
      if (diff <= 0) { setTimeLeft('Iniciado'); setUrgent(true); return }
      const days = Math.floor(diff / 86400000)
      const hrs = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      if (days > 0) setTimeLeft(`${days}d ${hrs}h`)
      else if (hrs > 0) setTimeLeft(`${hrs}h ${mins}m`)
      else setTimeLeft(`${mins} min`)
      setUrgent(diff < 3600000) // < 1 hora
    }
    calc()
    const interval = setInterval(calc, 60000)
    return () => clearInterval(interval)
  }, [targetDate])

  return { timeLeft, urgent }
}

// ─── Edit Modal ─────────────────────────────────────────────────────────────
function EditModal({ ride, onSave, onClose, loading }) {
  const [meetPoint, setMeetPoint] = useState(ride.meetPoint || '')
  const [bairro, setBairro] = useState(ride.bairro || '')
  const [zona, setZona] = useState(ride.zona || '')
  const [price, setPrice] = useState(String((ride.price || 0) / 100))
  const [memberPrice, setMemberPrice] = useState(ride.memberPrice != null ? String(ride.memberPrice / 100) : '')
  const [seats, setSeats] = useState(ride.totalSeats)
  const [hour, setHour] = useState(String(new Date(ride.departureTime).getHours()).padStart(2,'0'))
  const [minute, setMinute] = useState(String(new Date(ride.departureTime).getMinutes()).padStart(2,'0'))

  const maxSeats = { carro: 4, van: 15, onibus: 50 }[ride.vehicle] || 4
  const activeCount = ride.passengers?.filter(p => p.status !== 'cancelled').length || 0

  const handleSave = () => {
    const gameDate = new Date(ride.departureTime)
    gameDate.setHours(parseInt(hour), parseInt(minute), 0, 0)
    onSave({
      meetPoint, bairro, zona,
      price: Math.round(parseFloat(price || 0) * 100),
      memberPrice: memberPrice ? Math.round(parseFloat(memberPrice) * 100) : null,
      totalSeats: seats,
      departureTime: gameDate.toISOString(),
    })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.editSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHandle} />
        <div className={styles.editHeader}>
          <button className={styles.editCancelBtn} onClick={onClose}>Cancelar</button>
          <span className={styles.editTitle}>Editar viagem</span>
          <button className={styles.editSaveBtn} onClick={handleSave} disabled={loading}>{loading ? '...' : 'Salvar'}</button>
        </div>
        <div className={styles.editBody}>
          <label className={styles.editLabel}>Ponto de encontro</label>
          <input type="text" value={meetPoint} onChange={e => setMeetPoint(e.target.value)} className={styles.editInput} />

          <div className={styles.editRow}>
            <div style={{ flex: 1 }}><label className={styles.editLabel}>Bairro</label><input type="text" value={bairro} onChange={e => setBairro(e.target.value)} className={styles.editInput} /></div>
            <div style={{ flex: 1 }}><label className={styles.editLabel}>Zona</label>
              <select value={zona} onChange={e => setZona(e.target.value)} className={styles.editInput}>
                <option value="">Selecione</option><option value="Sul">Zona Sul</option><option value="Norte">Zona Norte</option><option value="Oeste">Zona Oeste</option><option value="Centro">Centro</option>
              </select>
            </div>
          </div>

          <label className={styles.editLabel}>Preço por vaga (R$)</label>
          <input type="number" min="0" step="0.50" value={price} onChange={e => setPrice(e.target.value)} className={styles.editInput} />

          {ride.groupName && (
            <><label className={styles.editLabel}>Preço membros (R$)</label>
            <input type="number" min="0" step="0.50" value={memberPrice} onChange={e => setMemberPrice(e.target.value)} className={styles.editInput} /></>
          )}

          <label className={styles.editLabel}>Vagas (mín. {activeCount} por passageiros confirmados)</label>
          <div className={styles.editSeats}>
            <button onClick={() => setSeats(Math.max(activeCount || 1, seats - 1))} disabled={seats <= (activeCount || 1)}>−</button>
            <span>{seats}</span>
            <button onClick={() => setSeats(Math.min(maxSeats, seats + 1))} disabled={seats >= maxSeats}>+</button>
          </div>

          <label className={styles.editLabel}>Horário de saída</label>
          <div className={styles.editTimeRow}>
            <select value={hour} onChange={e => setHour(e.target.value)} className={styles.editTimeSelect}>
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={String(i).padStart(2,'0')}>{String(i).padStart(2,'0')}</option>)}
            </select>
            <span className={styles.editTimeSep}>:</span>
            <select value={minute} onChange={e => setMinute(e.target.value)} className={styles.editTimeSelect}>
              {['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'chat'
  const [messages, setMessages] = useState([])
  const [chatText, setChatText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const wsRef = useRef(null)
  const chatEndRef = useRef(null)

  const isDriver = ride && String(ride.driver) === String(user?.id)
  const myReservation = ride?.passengers?.find(p => String(p.user) === String(user?.id) && p.status !== 'cancelled')
  const activePassengers = ride?.passengers?.filter(p => p.status !== 'cancelled') || []
  const availableSeats = ride ? ride.totalSeats - activePassengers.length : 0
  const occupancyPct = ride ? ((activePassengers.length / ride.totalSeats) * 100) : 0
  const isPast = ride ? new Date(ride.departureTime) < new Date() : false

  // Countdown
  const { timeLeft, urgent } = useCountdown(ride?.departureTime)

  // Can this user access chat?
  const canChat = ride && (isDriver || (myReservation && ['paid', 'confirmed'].includes(myReservation.status)))

  // ── Load chat messages ────────────────────────────────────────────────
  useEffect(() => {
    if (!canChat || !token || activeTab !== 'chat') return
    async function loadMessages() {
      setChatLoading(true)
      try {
        const res = await fetch(`${API_URL}/rides/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) { const data = await res.json(); setMessages(data.messages || []) }
      } catch {} finally { setChatLoading(false) }
    }
    loadMessages()
  }, [canChat, token, id, activeTab])

  // ── WebSocket for real-time chat ──────────────────────────────────────
  useEffect(() => {
    if (!canChat || !token || activeTab !== 'chat') return
    const wsUrl = API_URL.replace('/api', '').replace('http', 'ws')
    const ws = new WebSocket(`${wsUrl}/ws/rides/${id}?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'ride-message' && data.message) {
          setMessages(prev => [...prev, data.message])
        }
      } catch {}
    }
    ws.onerror = () => {}
    ws.onclose = () => {}

    return () => { ws.close() }
  }, [canChat, token, id, activeTab])

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTab])

  const sendMessage = async () => {
    const text = chatText.trim()
    if (!text || !token) return
    setChatText('')
    try {
      await fetch(`${API_URL}/rides/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      })
    } catch { toast.error('Erro ao enviar mensagem') }
  }

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
    const text = ride.shareCode
      ? `Viagem ${ride.shareCode} — ${ride.game.homeTeam} × ${ride.game.awayTeam}\n${link}`
      : link
    navigator.clipboard?.writeText(text)
    toast.success(ride.shareCode ? `Código ${ride.shareCode} copiado!` : 'Link copiado!')
  }

  const handleEdit = async (updates) => {
    setEditLoading(true)
    try {
      const res = await fetch(`${API_URL}/rides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message || 'Viagem atualizada!'); setEditOpen(false); loadRide() }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setEditLoading(false) }
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
          {ride.shareCode && <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--color-brand)', background: 'rgba(34,197,94,0.08)', padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(34,197,94,0.2)' }}>{ride.shareCode}</span>}
          {isDriver && <span className={styles.roleBadge} style={{ color: '#22C55E', background: 'rgba(34,197,94,0.1)' }}>Você é o motorista</span>}
          {myReservation && !isDriver && <span className={styles.roleBadge} style={{ color: '#3B82F6', background: 'rgba(59,130,246,0.1)' }}>Você tem reserva</span>}
        </div>

        {/* Countdown + edit */}
        {ride.status !== 'cancelled' && ride.status !== 'completed' && (
          <div className={styles.countdownRow}>
            <div className={`${styles.countdownBadge} ${urgent ? styles.countdownUrgent : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>{timeLeft || '...'}</span>
            </div>
            {isDriver && (
              <button className={styles.editBtn} onClick={() => setEditOpen(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
            )}
          </div>
        )}

        {/* Tab navigation */}
        {canChat && (
          <div className={styles.tabRow}>
            <button className={`${styles.tabBtn} ${activeTab === 'details' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('details')}>
              Detalhes
            </button>
            <button className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('chat')}>
              💬 Chat
              {messages.length > 0 && <span className={styles.tabBadge}>{messages.length}</span>}
            </button>
          </div>
        )}

        {/* ─── Tab: Details ─── */}
        {activeTab === 'details' && (
          <>
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

        </>
        )}

        {/* ─── Tab: Chat ─── */}
        {activeTab === 'chat' && canChat && (
          <div className={styles.chatContainer}>
            {chatLoading ? (
              <div className={styles.chatLoading}>Carregando mensagens...</div>
            ) : messages.length === 0 ? (
              <div className={styles.chatEmpty}>
                <span style={{ fontSize: 32 }}>💬</span>
                <p>Nenhuma mensagem ainda</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Comece a conversa com o motorista e passageiros!</p>
              </div>
            ) : (
              <div className={styles.chatMessages}>
                {messages.map((msg, i) => {
                  const isMine = String(msg.sender) === String(user?.id)
                  const isSystem = msg.type === 'system'
                  return isSystem ? (
                    <div key={i} className={styles.chatSystem}>{msg.text}</div>
                  ) : (
                    <div key={i} className={`${styles.chatBubble} ${isMine ? styles.chatBubbleMine : styles.chatBubbleOther}`}>
                      {!isMine && <span className={styles.chatSender}>{msg.senderName}</span>}
                      <p className={styles.chatText}>{msg.text}</p>
                      <span className={styles.chatTime}>
                        {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* Chat input bar */}
      {activeTab === 'chat' && canChat && (
        <div className={styles.chatInputBar}>
          <input
            type="text"
            value={chatText}
            onChange={e => setChatText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Mensagem..."
            className={styles.chatInput}
            maxLength={1000}
          />
          <button className={styles.chatSendBtn} onClick={sendMessage} disabled={!chatText.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
          </button>
        </div>
      )}

      {/* Bottom actions (only on details tab) */}
      {activeTab === 'details' && ride.status !== 'cancelled' && ride.status !== 'completed' && (
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

      {/* Edit modal */}
      {editOpen && ride && (
        <EditModal ride={ride} onSave={handleEdit} onClose={() => setEditOpen(false)} loading={editLoading} />
      )}
    </div>
  )
}

