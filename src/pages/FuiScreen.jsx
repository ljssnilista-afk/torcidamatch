import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { useFavorites } from '../context/FavoritesContext'
import { ROUTES } from '../utils/constants'
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

function RideCard({ ride, role, onTap }) {
  const countdown = useCountdown(ride.departureTime)
  const st = STATUS_COLORS[ride.status] || '#22C55E'
  const activeP = ride.passengers?.filter(p => p.status !== 'cancelled').length || 0

  return (
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
    </button>
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
              {proximas.map(r => <RideCard key={r._id} ride={r} role={r._role} onTap={goToRide} />)}
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
              {historico.map(r => <RideCard key={r._id} ride={r} role={r._role} onTap={goToRide} />)}
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
