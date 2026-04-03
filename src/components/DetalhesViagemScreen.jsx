import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { teamLogoUrl } from '../utils/bsdApi'
import { ROUTES } from '../utils/constants'
import styles from './DetalhesViagemScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

function formatPrice(cents) { return (cents / 100).toFixed(2).replace('.', ',') }
function formatDate(iso) {
  const d = new Date(iso)
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}
function formatTime(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function avatarColor(name = '') {
  const colors = ['#22C55E','#3B82F6','#D4AF37','#C060C0','#EF4444','#0EA5E9','#F97316']
  let hash = 0; for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
function initials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }

const VEHICLE_LABELS = { carro: '🚗 Carro', van: '🚐 Van', onibus: '🚌 Ônibus' }
const STATUS_LABELS = {
  open: 'Aberta', full: 'Lotada', in_progress: 'Em andamento',
  completed: 'Concluída', cancelled: 'Cancelada',
}
const STATUS_COLORS = {
  open: '#22C55E', full: '#D4AF37', in_progress: '#3B82F6',
  completed: '#22C55E', cancelled: '#EF4444',
}
const PASSENGER_STATUS = {
  reserved: 'Reservado', paid: 'Pago', confirmed: 'Confirmou', cancelled: 'Cancelou',
}

// ─── Confirm Modal ──────────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHandle} />
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={onCancel}>Voltar</button>
          <button
            className={`${styles.modalConfirm} ${danger ? styles.modalDanger : ''}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function DetalhesViagemScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useUser()
  const token = user?.token

  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [modal, setModal] = useState(null) // { type: 'cancel' | 'cancelReservation' | 'confirmDriver' | 'confirmPassenger' }

  const isDriver = ride && String(ride.driver) === String(user?.id)
  const myReservation = ride?.passengers?.find(
    p => String(p.user) === String(user?.id) && p.status !== 'cancelled'
  )
  const activePassengers = ride?.passengers?.filter(p => p.status !== 'cancelled') || []
  const availableSeats = ride ? ride.totalSeats - activePassengers.length : 0

  // ── Load ride ─────────────────────────────────────────────────────────
  const loadRide = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/rides/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setRide(data.ride)
      } else {
        toast.error('Viagem não encontrada')
        navigate(ROUTES.VAMOS_COMIGO)
      }
    } catch {
      toast.error('Erro ao carregar viagem')
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => { loadRide() }, [loadRide])

  // ── Actions ───────────────────────────────────────────────────────────
  const handleReserve = async () => {
    if (!token) { toast.error('Faça login para reservar'); return }
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/rides/${id}/reserve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); loadRide() }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setActionLoading(false) }
  }

  const handleCancelRide = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/rides/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); navigate(ROUTES.VAMOS_COMIGO) }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setActionLoading(false); setModal(null) }
  }

  const handleCancelReservation = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/rides/${id}/cancel-reservation`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); loadRide() }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setActionLoading(false); setModal(null) }
  }

  const handleConfirmDriver = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/rides/${id}/confirm/driver`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); loadRide() }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setActionLoading(false); setModal(null) }
  }

  const handleConfirmPassenger = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/rides/${id}/confirm/passenger`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); loadRide() }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setActionLoading(false); setModal(null) }
  }

  if (loading) return (
    <div className={styles.screen}>
      <div className={styles.header}><div className={styles.skLine} style={{ width: '40%' }} /></div>
      <div className={styles.skBody}>{[1,2,3,4].map(i => <div key={i} className={styles.skBlock} />)}</div>
    </div>
  )

  if (!ride) return null

  const homeId = ride.game?.homeTeam ? null : null // BSD api_id not stored in ride, use placeholders
  const isPast = new Date(ride.departureTime) < new Date()

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(ROUTES.VAMOS_COMIGO)} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 className={styles.headerTitle}>Detalhes da viagem</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.scrollArea}>
        {/* Status badge */}
        <div className={styles.statusRow}>
          <span className={styles.statusBadge} style={{ background: `${STATUS_COLORS[ride.status]}18`, color: STATUS_COLORS[ride.status], borderColor: `${STATUS_COLORS[ride.status]}40` }}>
            {STATUS_LABELS[ride.status]}
          </span>
          {isDriver && <span className={styles.driverBadge}>Você é o motorista</span>}
          {myReservation && !isDriver && <span className={styles.passengerBadge}>Você tem reserva</span>}
        </div>

        {/* Game card */}
        <div className={styles.gameCard}>
          <div className={styles.gameMatchup}>
            <div className={styles.gameTeam}>
              <div className={styles.teamLogoPlaceholder}>{ride.game.homeTeam.slice(0,3).toUpperCase()}</div>
              <span className={styles.teamName}>{ride.game.homeTeam}</span>
            </div>
            <span className={styles.gameVs}>VS</span>
            <div className={styles.gameTeam}>
              <div className={styles.teamLogoPlaceholder}>{ride.game.awayTeam.slice(0,3).toUpperCase()}</div>
              <span className={styles.teamName}>{ride.game.awayTeam}</span>
            </div>
          </div>
          <div className={styles.gameMeta}>
            <span>{formatDate(ride.game.date)} • {formatTime(ride.game.date)}</span>
            <span>•</span>
            <span>{ride.game.stadium}</span>
          </div>
        </div>

        {/* Driver info */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Motorista</span>
          <div className={styles.driverCard}>
            <div className={styles.driverAvatar} style={{ background: avatarColor(ride.driverName) }}>
              {initials(ride.driverName)}
            </div>
            <div className={styles.driverInfo}>
              <span className={styles.driverName}>{ride.driverName}</span>
              {ride.driverHandle && <span className={styles.driverHandle}>@{ride.driverHandle}</span>}
            </div>
            {ride.groupName && <span className={styles.groupBadge}>★ {ride.groupName}</span>}
          </div>
        </div>

        {/* Ride details */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Detalhes</span>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>🚗</span>
              <div><span className={styles.detailLabel}>Veículo</span><span className={styles.detailValue}>{VEHICLE_LABELS[ride.vehicle]}</span></div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>👥</span>
              <div><span className={styles.detailLabel}>Vagas</span><span className={styles.detailValue}>{availableSeats} de {ride.totalSeats} disponíveis</span></div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>🕐</span>
              <div><span className={styles.detailLabel}>Saída</span><span className={styles.detailValue}>{formatTime(ride.departureTime)}</span></div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>📍</span>
              <div><span className={styles.detailLabel}>Encontro</span><span className={styles.detailValue}>{ride.meetPoint}</span></div>
            </div>
            {ride.bairro && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>🏘️</span>
                <div><span className={styles.detailLabel}>Bairro</span><span className={styles.detailValue}>{ride.bairro}{ride.zona ? `, Zona ${ride.zona}` : ''}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Preço</span>
          <div className={styles.priceCard}>
            <div className={styles.priceMain}>
              <span className={styles.priceValue}>R$ {formatPrice(ride.price)}</span>
              <span className={styles.priceLabel}>por vaga</span>
            </div>
            {ride.memberPrice != null && ride.memberPrice !== ride.price && (
              <div className={styles.priceMember}>
                <span className={styles.priceMemberValue}>R$ {formatPrice(ride.memberPrice)}</span>
                <span className={styles.priceMemberLabel}>para membros do grupo</span>
              </div>
            )}
          </div>
        </div>

        {/* Passengers (visible to driver) */}
        {isDriver && activePassengers.length > 0 && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Passageiros ({activePassengers.length})</span>
            <div className={styles.passengersList}>
              {activePassengers.map((p, i) => (
                <div key={i} className={styles.passengerRow}>
                  <div className={styles.passengerAvatar} style={{ background: avatarColor(p.name) }}>
                    {initials(p.name)}
                  </div>
                  <div className={styles.passengerInfo}>
                    <span className={styles.passengerName}>{p.name}</span>
                    <span className={styles.passengerMeta}>
                      R$ {formatPrice(p.paidAmount)} {p.isMember ? '(membro)' : ''}
                    </span>
                  </div>
                  <span className={`${styles.passengerStatus} ${p.status === 'confirmed' ? styles.statusConfirmed : ''}`}>
                    {PASSENGER_STATUS[p.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Escrow info (visible to driver on completed rides) */}
        {isDriver && ride.status === 'completed' && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Financeiro (simulado)</span>
            <div className={styles.financeCard}>
              <div className={styles.financeRow}>
                <span>Total recebido</span>
                <span className={styles.financeGreen}>R$ {formatPrice(ride.releasedTotal)}</span>
              </div>
              <div className={styles.financeRow}>
                <span>Comissão app (20%)</span>
                <span className={styles.financeRed}>- R$ {formatPrice(ride.appCommission)}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* Bottom actions */}
      {ride.status !== 'cancelled' && ride.status !== 'completed' && (
        <div className={styles.bottomBar}>
          {/* Motorista: cancelar ou confirmar */}
          {isDriver && (
            <div className={styles.actionRow}>
              <button className={styles.btnCancel} onClick={() => setModal({ type: 'cancel' })}>
                Cancelar viagem
              </button>
              {isPast && !ride.driverConfirmed && (
                <button className={styles.btnConfirm} onClick={() => setModal({ type: 'confirmDriver' })}>
                  Confirmar viagem
                </button>
              )}
              {ride.driverConfirmed && (
                <span className={styles.confirmedLabel}>✓ Você já confirmou</span>
              )}
            </div>
          )}

          {/* Passageiro com reserva: desistir ou confirmar */}
          {!isDriver && myReservation && (
            <div className={styles.actionRow}>
              <button className={styles.btnCancel} onClick={() => setModal({ type: 'cancelReservation' })}>
                Desistir
              </button>
              {isPast && myReservation.status !== 'confirmed' && (
                <button className={styles.btnConfirm} onClick={() => setModal({ type: 'confirmPassenger' })}>
                  Confirmar viagem
                </button>
              )}
              {myReservation.status === 'confirmed' && (
                <span className={styles.confirmedLabel}>✓ Você já confirmou</span>
              )}
            </div>
          )}

          {/* Visitante: reservar */}
          {!isDriver && !myReservation && availableSeats > 0 && (
            <button className={styles.btnReserve} onClick={handleReserve} disabled={actionLoading}>
              {actionLoading ? 'Reservando...' : `Reservar • R$ ${formatPrice(ride.price)}`}
            </button>
          )}

          {!isDriver && !myReservation && availableSeats === 0 && (
            <button className={styles.btnFull} disabled>Viagem lotada</button>
          )}
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'cancel' && (
        <ConfirmModal
          title="Cancelar viagem"
          message="Tem certeza? Todos os passageiros serão reembolsados automaticamente."
          confirmLabel="Sim, cancelar"
          danger
          onConfirm={handleCancelRide}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal?.type === 'cancelReservation' && (
        <ConfirmModal
          title="Desistir da reserva"
          message="Você será reembolsado automaticamente (simulado)."
          confirmLabel="Sim, desistir"
          danger
          onConfirm={handleCancelReservation}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal?.type === 'confirmDriver' && (
        <ConfirmModal
          title="Confirmar viagem"
          message="Confirme que a viagem aconteceu. Quando todos os passageiros também confirmarem, o pagamento será liberado."
          confirmLabel="Confirmar"
          onConfirm={handleConfirmDriver}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal?.type === 'confirmPassenger' && (
        <ConfirmModal
          title="Confirmar viagem"
          message="Confirme que você participou desta viagem. O pagamento será liberado ao motorista quando todos confirmarem."
          confirmLabel="Confirmar"
          onConfirm={handleConfirmPassenger}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
