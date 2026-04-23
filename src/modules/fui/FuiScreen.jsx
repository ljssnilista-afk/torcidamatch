import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@shared/contexts/UserContext'
import { useToast } from '@shared/contexts/ToastContext'
import { useFavorites } from '@shared/contexts/FavoritesContext'
import { ROUTES } from '@shared/utils/constants'
import styles from './FuiScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

function formatPrice(c) { return (c / 100).toFixed(2).replace('.', ',') }
function formatDate(iso) {
  const d = new Date(iso), days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}
function formatTime(iso) { const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
function avatarColor(n = '') { const c = ['#22C55E','#3B82F6','#D4AF37','#C060C0','#EF4444','#0EA5E9','#F97316']; let h = 0; for (const x of n) h = x.charCodeAt(0)+((h<<5)-h); return c[Math.abs(h)%c.length] }
function initials(n = '') { return n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    if (!targetDate) return
    function calc() {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) { setTimeLeft('Agora'); return }
      const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000)
      if (d > 0) setTimeLeft(`${d}d ${h}h`); else if (h > 0) setTimeLeft(`${h}h ${m}m`); else setTimeLeft(`${m}min`)
    }
    calc(); const i = setInterval(calc, 60000); return () => clearInterval(i)
  }, [targetDate])
  return timeLeft
}

const VEHICLE_ICONS = { carro: '🚗', van: '🚐', onibus: '🚌' }
const STATUS_LABELS = { open: 'Aberta', full: 'Lotada', in_progress: 'Em andamento', completed: 'Concluída', cancelled: 'Cancelada' }
const STATUS_COLORS = { open: '#22C55E', full: '#D4AF37', in_progress: '#3B82F6', completed: '#22C55E', cancelled: '#EF4444' }

const TABS = [
  { id: 'proximas', label: 'Próximas', icon: '✅' },
  { id: 'grupos',   label: 'Grupos',   icon: '👥' },
  { id: 'historico', label: 'Histórico', icon: '📜' },
  { id: 'convites', label: 'Convites', icon: '📩' },
  { id: 'favoritos', label: 'Favoritos', icon: '⭐' },
]

// ─── Ride Card (compact) ────────────────────────────────────────────────────

function ReturnBadge({ returnApproved }) {
  if (returnApproved === true)
    return <span className={styles.returnBadgeYes}>🔄 Volta garantida</span>
  if (returnApproved === false)
    return <span className={styles.returnBadgeNo}>❌ Sem vaga de volta</span>
  return <span className={styles.returnBadgePending}>⏳ Volta pendente</span>
}

// ─── Seção de validação de código (apenas motorista) ─────────────────────────
function ValidateCodeSection({ ride, token, onValidated }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState(null) // { name, credited }
  const [legacyPassengers, setLegacyPassengers] = useState([]) // passageiros sem código
  const toast = useToast()

  // Passageiros aguardando validação (authorized = novo fluxo, paid = reservas antigas)
  const waiting = ride.passengers?.filter(
    p => (p.status === 'authorized' || p.status === 'paid') && p.validationCode
  ) || []
  const confirmed = ride.passengers?.filter(p => p.status === 'confirmed') || []

  if (waiting.length === 0 && confirmed.length === 0) return null

  const handleValidate = async (e) => {
    e.stopPropagation()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return toast.error('Digite o código do passageiro')

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/rides/${ride._id}/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()
      if (res.ok) {
        setLastResult({ name: data.passengerName, credited: data.creditedFormatted })
        setCode('')
        setLegacyPassengers([])
        toast.success(data.message)
        if (onValidated) onValidated()
      } else {
        if (data.hasLegacyPassengers && data.legacyPassengers?.length) {
          setLegacyPassengers(data.legacyPassengers)
          toast.error('Passageiro sem código — confirme manualmente abaixo')
        } else {
          toast.error(data.error || 'Código inválido')
        }
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.validateSection} onClick={e => e.stopPropagation()}>
      {/* Header clicável */}
      <button
        className={styles.validateToggle}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
      >
        <span className={styles.validateToggleLeft}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span>Receber código</span>
          {waiting.length > 0 && (
            <span className={styles.validateBadge}>{waiting.length} aguardando</span>
          )}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* Conteúdo expandido */}
      {open && (
        <div className={styles.validateBody}>
          {/* Passageiros já confirmados */}
          {confirmed.length > 0 && (
            <div className={styles.confirmedList}>
              {confirmed.map((p, i) => (
                <div key={i} className={styles.confirmedItem}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{p.name}</span>
                  <span className={styles.confirmedLabel}>Confirmado</span>
                </div>
              ))}
            </div>
          )}

          {/* Aguardando */}
          {waiting.length > 0 && (
            <>
              <p className={styles.validateHint}>
                Peça ao passageiro o código TM-XXXX exibido na tela dele.
              </p>
              <div className={styles.validateInputRow}>
                <input
                  className={styles.validateInput}
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleValidate(e)}
                  placeholder="TM-XXXX"
                  maxLength={7}
                  disabled={loading}
                />
                <button
                  className={styles.validateBtn}
                  onClick={handleValidate}
                  disabled={loading || !code.trim()}
                >
                  {loading ? '...' : 'Validar'}
                </button>
              </div>
            </>
          )}

          {/* Último resultado */}
          {lastResult && (
            <div className={styles.validateResult}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span><strong>{lastResult.name}</strong> embarcou · {lastResult.credited} adicionado à carteira</span>
            </div>
          )}

          {/* Passageiros legados (sem código) — confirmar manualmente */}
          {legacyPassengers.length > 0 && (
            <div className={styles.legacyBox}>
              <p className={styles.legacyTitle}>Passageiro(s) sem código de validação:</p>
              {legacyPassengers.map(p => (
                <button
                  key={p.id}
                  className={styles.legacyConfirmBtn}
                  onClick={async (e) => {
                    e.stopPropagation()
                    setLoading(true)
                    try {
                      const res = await fetch(`${API_URL}/rides/${ride._id}/confirm-legacy`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ passengerId: p.id }),
                      })
                      const data = await res.json()
                      if (res.ok) {
                        setLastResult({ name: data.passengerName, credited: data.creditedFormatted })
                        setLegacyPassengers(prev => prev.filter(x => x.id !== p.id))
                        toast.success(data.message)
                        if (onValidated) onValidated()
                      } else toast.error(data.error)
                    } catch { toast.error('Erro de conexão') }
                    finally { setLoading(false) }
                  }}
                  disabled={loading}
                >
                  ✅ Confirmar {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Seção de código do passageiro ───────────────────────────────────────────
function PassengerCodeSection({ myPassenger }) {
  const [copied, setCopied] = useState(false)
  const code = myPassenger?.validationCode

  if (!code) return null

  // Não mostrar após confirmado (já embarcou)
  if (myPassenger.status === 'confirmed') {
    return (
      <div className={styles.paxCodeSection}>
        <div className={styles.paxCodeConfirmed}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Embarque confirmado pelo motorista</span>
        </div>
      </div>
    )
  }

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const statusLabel = myPassenger.status === 'authorized'
    ? 'Aguardando embarque'
    : myPassenger.status === 'paid'
    ? 'Reservado'
    : 'Reservado'

  return (
    <div className={styles.paxCodeSection}>
      <div className={styles.paxCodeHeader}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <span>Meu código de embarque</span>
        <span className={styles.paxStatusPill}>{statusLabel}</span>
      </div>
      <div className={styles.paxCodeRow}>
        <span className={styles.paxCodeValue}>{code}</span>
        <button className={`${styles.paxCopyBtn} ${copied ? styles.paxCopyBtnOk : ''}`} onClick={handleCopy}>
          {copied
            ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copiado</>
            : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copiar</>
          }
        </button>
      </div>
      <p className={styles.paxCodeHint}>
        Mostre este código ao motorista no local de embarque para confirmar sua vaga.
      </p>
    </div>
  )
}

function RideCard({ ride, role, onTap, userId, token, onValidated }) {
  const countdown = useCountdown(ride.departureTime)
  const st = STATUS_COLORS[ride.status] || '#22C55E'

  // Passageiro logado nesta viagem
  const myPassenger = ride.passengers?.find(p => String(p.user) === String(userId))

  // Badge de volta (passageiro, in_progress/completed)
  const showReturn = role === 'passageiro' &&
    myPassenger &&
    ['in_progress', 'completed'].includes(ride.status)

  // Código de embarque (passageiro, viagem não cancelada e com código)
  const showPaxCode = role === 'passageiro' &&
    myPassenger?.validationCode &&
    !['cancelled', 'completed'].includes(ride.status)

  // Validação de código (motorista, viagens ativas)
  const showValidate = role === 'motorista' &&
    ['open', 'full', 'in_progress'].includes(ride.status)

  return (
    <div className={styles.rideCardWrapper}>
      <button className={styles.rideCard} onClick={() => onTap(ride)}>
        <div className={styles.rideTop}>
          <span className={styles.rideGame}>{ride.game?.homeTeam} × {ride.game?.awayTeam}</span>
          <span className={styles.rideStatus} style={{ color: st, background: `${st}15`, borderColor: `${st}40` }}>
            {STATUS_LABELS[ride.status]}
          </span>
        </div>
        <div className={styles.rideMeta}>
          <span>{VEHICLE_ICONS[ride.vehicle]} {formatDate(ride.departureTime)} • {formatTime(ride.departureTime)}</span>
        </div>
        <div className={styles.rideBottom}>
          <span className={styles.rideLocation}>📍 {ride.meetPoint}</span>
          {ride.shareCode && <span className={styles.rideCode}>{ride.shareCode}</span>}
        </div>
        <div className={styles.rideFooter}>
          <span className={styles.rideRole}>{role === 'motorista' ? '🚗 Motorista' : '🧳 Passageiro'}</span>
          <span className={styles.ridePrice}>R$ {formatPrice(ride.price)}</span>
          {ride.status === 'open' || ride.status === 'full' ? (
            <span className={styles.rideCountdown}>⏱ {countdown}</span>
          ) : null}
        </div>
        {showReturn && (
          <div className={styles.returnRow}>
            <ReturnBadge returnApproved={myPassenger.returnApproved} />
          </div>
        )}
      </button>

      {/* Código do passageiro — sempre visível abaixo do card */}
      {showPaxCode && (
        <PassengerCodeSection myPassenger={myPassenger} />
      )}

      {/* Validação de código — apenas motorista */}
      {showValidate && (
        <ValidateCodeSection ride={ride} token={token} onValidated={onValidated} />
      )}
    </div>
  )
}

// ─── Group Card ─────────────────────────────────────────────────────────────

function GroupCard({ group, isLeader, onTap }) {
  return (
    <button className={styles.groupCard} onClick={() => onTap(group)}>
      <div className={styles.groupAvatar} style={{ background: avatarColor(group.name) }}>
        {initials(group.name)}
      </div>
      <div className={styles.groupInfo}>
        <span className={styles.groupName}>
          {group.name}
          {group.code && <span className={styles.groupCode}>#{group.code}</span>}
        </span>
        <span className={styles.groupMeta}>
          {group.members?.length || 0} membros • {group.team}
        </span>
      </div>
      {isLeader && <span className={styles.leaderBadge}>👑 Líder</span>}
    </button>
  )
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyTab({ icon, title, sub, btnLabel, onBtn }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>{icon}</span>
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptySub}>{sub}</p>
      {btnLabel && <button className={styles.emptyBtn} onClick={onBtn}>{btnLabel}</button>}
    </div>
  )
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function FuiScreen() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useUser()
  const { favGroups, favRides, toggleGroup, toggleRide } = useFavorites()
  const token = user?.token

  const [tab, setTab] = useState('proximas')
  const [loading, setLoading] = useState(true)
  const [ridesAsDriver, setRidesAsDriver] = useState([])
  const [ridesAsPassenger, setRidesAsPassenger] = useState([])
  const [groups, setGroups] = useState([])
  const [invites, setInvites] = useState([])
  const [inviteLoading, setInviteLoading] = useState(false)

  // ── Load data ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      const [ridesRes, gruposRes, invitesRes] = await Promise.all([
        fetch(`${API_URL}/rides/mine`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/grupos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/invites/mine`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (ridesRes.ok) {
        const data = await ridesRes.json()
        setRidesAsDriver(data.asDriver || [])
        setRidesAsPassenger(data.asPassenger || [])
      }
      if (gruposRes.ok) {
        const data = await gruposRes.json()
        const myGroups = (data.groups || []).filter(g =>
          g.members?.some?.(m => String(m._id || m) === String(user?.id))
        )
        setGroups(myGroups)
      }
      if (invitesRes.ok) {
        const data = await invitesRes.json()
        setInvites(data.invites || [])
      }
    } catch (err) {
      console.error('[FuiScreen]', err)
    } finally {
      setLoading(false)
    }
  }, [token, user?.id])

  useEffect(() => { loadData() }, [loadData])

  // ── Accept/Reject invite ──────────────────────────────────────────────
  const handleInvite = async (inviteId, action) => {
    setInviteLoading(true)
    try {
      const res = await fetch(`${API_URL}/invites/${inviteId}/${action}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setInvites(prev => prev.filter(i => i._id !== inviteId))
        loadData() // refresh groups/rides
      } else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setInviteLoading(false) }
  }

  // ── Derived data ──────────────────────────────────────────────────────
  const now = new Date()

  const allRides = [
    ...ridesAsDriver.map(r => ({ ...r, _role: 'motorista' })),
    ...ridesAsPassenger.map(r => ({ ...r, _role: 'passageiro' })),
  ]
  // Deduplicate by _id
  const uniqueRides = [...new Map(allRides.map(r => [r._id, r])).values()]

  const proximas = uniqueRides.filter(r =>
    (r.status === 'open' || r.status === 'full' || r.status === 'in_progress') &&
    new Date(r.departureTime) >= new Date(now.getTime() - 6 * 3600000) // incluir até 6h atrás
  ).sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))

  const historico = uniqueRides.filter(r =>
    r.status === 'completed' || r.status === 'cancelled' ||
    (new Date(r.departureTime) < new Date(now.getTime() - 6 * 3600000) && r.status !== 'open')
  ).sort((a, b) => new Date(b.departureTime) - new Date(a.departureTime))

  // Stats
  const statsData = [
    { icon: '✅', value: proximas.length, label: 'viagens' },
    { icon: '👥', value: groups.length, label: 'grupos' },
    { icon: '📜', value: historico.length, label: 'histórico' },
  ]

  const goToRide = (ride) => navigate(`/vamos-comigo/${ride._id}`)
  const goToGroup = (group) => navigate(`/grupos/${group._id}`)

  if (loading) return (
    <div className={styles.screen}>
      <div className={styles.header}><h1 className={styles.title}>Fui<span className={styles.titleGreen}>!</span></h1></div>
      <div className={styles.skBody}>{[1,2,3].map(i => <div key={i} className={styles.skBlock} />)}</div>
    </div>
  )

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fui<span className={styles.titleGreen}>!</span></h1>
          <p className={styles.subtitle}>Suas viagens, grupos e histórico</p>
        </div>
      </div>

      {/* Stats summary */}
      <div className={styles.statsRow}>
        {statsData.map((s, i) => (
          <div key={i} className={styles.statPill}>
            <span className={styles.statIcon}>{s.icon}</span>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className={styles.tabIcon}>{t.icon}</span>
            <span>{t.label}</span>
            {t.id === 'convites' && invites.length > 0 && (
              <span className={styles.tabBadge}>{invites.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.scrollArea}>

        {/* Próximas */}
        {tab === 'proximas' && (
          proximas.length === 0 ? (
            <EmptyTab icon="🎟️" title="Nenhuma viagem confirmada" sub="Explore o Vamos Comigo e reserve sua vaga!" btnLabel="Explorar viagens" onBtn={() => navigate(ROUTES.VAMOS_COMIGO)} />
          ) : (
            <div className={styles.list}>
              {proximas.map(r => (
                <RideCard
                  key={r._id}
                  ride={r}
                  role={r._role}
                  onTap={goToRide}
                  userId={user?.id}
                  token={token}
                  onValidated={loadData}
                />
              ))}
            </div>
          )
        )}

        {/* Grupos */}
        {tab === 'grupos' && (
          groups.length === 0 ? (
            <EmptyTab icon="👥" title="Você não participa de nenhum grupo" sub="Entre em um grupo de torcedores do seu bairro!" btnLabel="Explorar grupos" onBtn={() => navigate(ROUTES.GRUPOS)} />
          ) : (
            <div className={styles.list}>
              {groups.map(g => (
                <GroupCard
                  key={g._id}
                  group={g}
                  isLeader={String(g.leader?._id || g.leader) === String(user?.id)}
                  onTap={goToGroup}
                />
              ))}
            </div>
          )
        )}

        {/* Histórico */}
        {tab === 'historico' && (
          historico.length === 0 ? (
            <EmptyTab icon="📜" title="Nenhuma viagem no histórico" sub="Suas viagens concluídas aparecerão aqui." />
          ) : (
            <div className={styles.list}>
              {historico.map(r => (
                <RideCard key={r._id} ride={r} role={r._role} onTap={goToRide} userId={user?.id} token={token} />
              ))}
            </div>
          )
        )}

        {/* Convites */}
        {tab === 'convites' && (
          invites.length === 0 ? (
            <EmptyTab icon="📩" title="Nenhum convite pendente" sub="Convites para grupos e viagens aparecerão aqui." />
          ) : (
            <div className={styles.list}>
              {invites.map(inv => (
                <div key={inv._id} className={styles.inviteCard}>
                  <div className={styles.inviteTop}>
                    <span className={styles.inviteType}>{inv.type === 'group' ? '👥' : '🚗'}</span>
                    <div className={styles.inviteInfo}>
                      <span className={styles.inviteName}>{inv.targetName}</span>
                      <span className={styles.inviteSender}>Convite de {inv.senderName}</span>
                      {inv.message && <span className={styles.inviteMsg}>"{inv.message}"</span>}
                    </div>
                    <span className={styles.inviteTypeBadge}>{inv.type === 'group' ? 'Grupo' : 'Viagem'}</span>
                  </div>
                  <div className={styles.inviteActions}>
                    <button className={styles.inviteReject} onClick={() => handleInvite(inv._id, 'reject')} disabled={inviteLoading}>
                      Recusar
                    </button>
                    <button className={styles.inviteAccept} onClick={() => handleInvite(inv._id, 'accept')} disabled={inviteLoading}>
                      Aceitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Favoritos */}
        {tab === 'favoritos' && (
          favGroups.length === 0 && favRides.length === 0 ? (
            <EmptyTab icon="⭐" title="Nenhum favorito salvo" sub="Toque no ❤️ em grupos e viagens para salvar aqui." btnLabel="Explorar viagens" onBtn={() => navigate(ROUTES.VAMOS_COMIGO)} />
          ) : (
            <div className={styles.list}>
              {favGroups.length > 0 && (
                <>
                  <span className={styles.favSection}>👥 Grupos favoritos</span>
                  {favGroups.map(g => (
                    <div key={g.id || g._id} className={styles.favCard}>
                      <div className={styles.favInfo} onClick={() => navigate(`/grupos/${g.id || g._id}`)}>
                        <span className={styles.favName}>{g.name}</span>
                        <span className={styles.favMeta}>{g.team} {g.bairro ? `• ${g.bairro}` : ''} {g.code ? `#${g.code}` : ''}</span>
                      </div>
                      <button className={styles.favRemoveBtn} onClick={() => { toggleGroup(g); toast.success(`${g.name} removido dos favoritos`) }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      </button>
                    </div>
                  ))}
                </>
              )}
              {favRides.length > 0 && (
                <>
                  <span className={styles.favSection}>🚗 Viagens favoritas</span>
                  {favRides.map(r => (
                    <div key={r.id || r._id} className={styles.favCard}>
                      <div className={styles.favInfo} onClick={() => navigate(`/vamos-comigo/${r.id || r._id}`)}>
                        <span className={styles.favName}>{r.homeTeam} × {r.awayTeam}</span>
                        <span className={styles.favMeta}>{r.driverName} {r.shareCode ? `• ${r.shareCode}` : ''} {r.price ? `• R$ ${(r.price/100).toFixed(2).replace('.',',')}` : ''}</span>
                      </div>
                      <button className={styles.favRemoveBtn} onClick={() => { toggleRide(r); toast.success('Viagem removida dos favoritos') }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        )}

        <div style={{ height: 80 }} />
      </div>

      {/* FAB - criar viagem */}
      <button className={styles.fab} onClick={() => navigate(ROUTES.CRIAR_VIAGEM)} aria-label="Criar viagem">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}
