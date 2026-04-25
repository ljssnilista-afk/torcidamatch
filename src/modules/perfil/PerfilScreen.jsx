import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@shared/utils/constants'
import { useUser } from '@shared/contexts/UserContext'
import { useToast } from '@shared/contexts/ToastContext'
import { useTheme } from '@shared/contexts/ThemeContext'
import { API_URL } from '@shared/services/api'
import styles from './PerfilScreen.module.css'

import CropModal       from './components/CropModal'
import Avatar          from './components/Avatar'
import EditPanel       from './components/EditPanel'
import SettingsPanel   from './components/SettingsPanel'
import WalletSection   from './components/WalletSection'
import ConnectSection  from './components/ConnectSection'
import WithdrawModal   from './components/WithdrawModal'

// ─── Icons used only inside PerfilScreen ───────────────────────────────────────────────────────────────
const ICONS = {
  users:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  'car-give':<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><text x="12" y="17" textAnchor="middle" fill="currentColor" stroke="none" fontSize="14" fontWeight="700" fontFamily="sans-serif">$</text></svg>,
  'car-take':<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>,
  gear:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  edit:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  pin:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  calendar:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
}

function formatMemberSince(iso) {
  if (!iso) return new Date().getFullYear()
  const d = new Date(iso)
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${months[d.getMonth()]}/${d.getFullYear()}`
}

// ─── Main Screen ─────────────────────────────────────────────────────────────────────────────────
export default function PerfilScreen() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useUser()
  const toast = useToast()
  const { isDark, toggleTheme } = useTheme()

  // ── UI state
  const [loading, setLoading]         = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editOpen, setEditOpen]       = useState(false)
  const [rawImage, setRawImage]       = useState(null)
  const [cropSaving, setCropSaving]   = useState(false)
  const [photo, setPhoto]             = useState(user?.photo || null)

  // ── Data state
  const [stats, setStats]         = useState({ grupos: 0, viagensOferecidas: 0, viagensFeitas: 0 })
  const [atividades, setAtividades] = useState([])

  // ── Financial state
  const [connectStatus, setConnectStatus]     = useState(null)
  const [connectLoading, setConnectLoading]   = useState(false)
  const [wallet, setWallet]                   = useState(null)
  const [withdrawOpen, setWithdrawOpen]       = useState(false)

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t) }, [])
  useEffect(() => { if (user?.photo) setPhoto(user.photo) }, [user?.photo])

  useEffect(() => {
    if (!user?.token) return
    Promise.all([
      fetch(`${API_URL}/connect/status`, { headers: { Authorization: `Bearer ${user.token}` } }),
      fetch(`${API_URL}/wallet/balance`,  { headers: { Authorization: `Bearer ${user.token}` } }),
    ]).then(async ([statusRes, walletRes]) => {
      if (statusRes.ok) { const d = await statusRes.json(); setConnectStatus(d.status) }
      if (walletRes.ok) { const d = await walletRes.json(); setWallet(d) }
    }).catch(() => {})
  }, [user?.token])

  useEffect(() => {
    if (!user?.token) return
    fetch(`${API_URL}/profile/me/stats`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) { setStats(data.stats || {}); setAtividades(data.atividades || []) } })
      .catch(err => console.warn('[PerfilScreen] stats error:', err.message))
  }, [user?.token])

  const savePhotoToBackend = async (dataUrl) => {
    try {
      const res = await fetch(`${API_URL}/profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}) },
        body: JSON.stringify({ photo: dataUrl }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      const data = await res.json()
      updateUser({ photo: dataUrl, ...data.user })
    } catch { updateUser({ photo: dataUrl }) }
  }

  const handleCropConfirm = async (croppedDataUrl) => {
    setCropSaving(true)
    setPhoto(croppedDataUrl)
    setRawImage(null)
    await savePhotoToBackend(croppedDataUrl)
    setCropSaving(false)
    toast.success('Foto atualizada!')
  }

  const handleSaveEdit = (fields) => {
    updateUser({
      name: fields.name,
      age: parseInt(fields.age),
      bairro: fields.bairro,
      zona: fields.zona,
      initials: fields.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    })
    setEditOpen(false)
    toast.success('Perfil atualizado!')
  }

  const handleSettingsAction = (itemId) => {
    if (itemId === 'logout') { logout(); navigate(ROUTES.LOGIN, { replace: true }) }
  }

  // ── Derived values
  const name        = user?.name        ?? 'Usuário'
  const initials    = user?.initials    ?? 'U'
  const handle      = user?.handle      ?? ''
  const age         = user?.age         ?? null
  const bairro      = user?.bairro      ?? ''
  const zona        = user?.zona        ?? ''
  const team        = user?.team        ?? ''
  const teamEmoji   = user?.teamEmoji   ?? ''
  const memberSince = user?.memberSince ?? new Date().toISOString()
  const location    = [bairro, zona].filter(Boolean).join(', ')

  const statCards = [
    { id: 'grupos',   icon: 'users',    label: 'Grupos',            value: stats.grupos           ?? 0, color: 'green' },
    { id: 'offered',  icon: 'car-give', label: 'Viagens ofertadas', value: stats.viagensOferecidas ?? 0, color: 'green' },
    { id: 'taken',    icon: 'car-take', label: 'Viagens feitas',    value: stats.viagensFeitas     ?? 0, color: 'blue'  },
  ]

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Perfil</h1>
        <div className={styles.headerActions}>
          <button className={styles.editIconBtn} onClick={() => setEditOpen(true)} aria-label="Editar perfil">{ICONS.edit}</button>
          <button className={styles.gearBtn} onClick={() => setSettingsOpen(true)} aria-label="Configurações">{ICONS.gear}</button>
        </div>
      </div>

      <div className={styles.scrollArea}>
        {loading ? (
          <div className={styles.skeletonWrap}>
            <div className={styles.skelAvatar}/>
            <div className={styles.skelLines}>
              <div className={`${styles.skelLine} ${styles.skelLg}`}/>
              <div className={`${styles.skelLine} ${styles.skelSm}`}/>
            </div>
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div className={styles.profileCard}>
              <div className={styles.profileCardInner}>
                <Avatar initials={initials} photo={photo} size={82} onPickFile={setRawImage} />
                <div className={styles.profileInfo}>
                  <h2 className={styles.profileName}>{name}</h2>
                  {handle && <p className={styles.profileHandle}>{handle}</p>}
                  <div className={styles.profileMeta}>
                    {age && <span className={styles.profileMetaItem}>{ICONS.calendar} {age} anos</span>}
                    {age && team && <span className={styles.profileMetaDot}>·</span>}
                    {team && <span className={styles.profileMetaItem}>{teamEmoji} {team}</span>}
                  </div>
                  {location && (
                    <div className={styles.profileMetaRow}>
                      <span className={styles.profileMetaItem}>{ICONS.pin} {location}</span>
                      <span className={styles.profileMetaDot}>·</span>
                      <span className={styles.profileMetaItem}>{ICONS.calendar} Membro desde {formatMemberSince(memberSince)}</span>
                    </div>
                  )}
                </div>
                <button className={styles.editBtn} onClick={() => setEditOpen(true)}>{ICONS.edit} Editar perfil</button>
              </div>
            </div>

            <WalletSection  wallet={wallet} setWallet={setWallet} onWithdraw={() => setWithdrawOpen(true)} user={user} toast={toast} />
            <ConnectSection connectStatus={connectStatus} connectLoading={connectLoading} setConnectLoading={setConnectLoading} user={user} toast={toast} />

            {/* Stats */}
            <div className={styles.statsGrid}>
              {statCards.map(s => (
                <div key={s.id} className={styles.statCard}>
                  <div className={`${styles.statIcon} ${s.color === 'blue' ? styles.statIconBlue : styles.statIconGreen}`}>{ICONS[s.icon]}</div>
                  {s.value > 0
                    ? <span className={styles.statValue}>{s.value}</span>
                    : <span className={styles.statValueEmpty}>—</span>}
                  <span className={styles.statLabel}>{s.label}</span>
                  {s.value === 0 && <span className={styles.statHint}>Participe para pontuar</span>}
                </div>
              ))}
            </div>

            {/* Avaliação */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}><span className={styles.sectionTitle}>Avaliação</span></div>
              <div className={styles.ratingCard}>
                <div className={styles.ratingStars}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="1.5">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                  ))}
                </div>
                <p className={styles.ratingEmpty}>Ainda sem avaliações. Participe de grupos e viagens para começar!</p>
              </div>
            </div>

            {/* Atividades */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}><span className={styles.sectionTitle}>Atividades recentes</span></div>
              {atividades.length === 0 ? (
                <div className={styles.emptyActivity}>
                  <div className={styles.emptyActivityIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  </div>
                  <p className={styles.emptyActivityText}>Nenhuma atividade recente</p>
                  <p className={styles.emptyActivitySub}>Explore grupos e viagens para começar sua jornada!</p>
                  <button className={styles.exploreBtn} onClick={() => navigate(ROUTES.GRUPOS)}>Explorar grupos</button>
                </div>
              ) : (
                <div className={styles.activityList}>
                  {atividades.map((a, i) => (
                    <div key={i} className={styles.activityItem}>
                      <div className={`${styles.activityDot} ${a.role === 'motorista' ? styles.activityDotGreen : styles.activityDotBlue}`} />
                      <div className={styles.activityContent}>
                        <span className={styles.activityText}>
                          {a.role === 'motorista' ? 'Ofereceu viagem' : 'Viajou com'}{' '}
                          {a.role === 'passageiro' ? a.driverName : ''}{' '}
                          para {a.game?.homeTeam} × {a.game?.awayTeam}
                        </span>
                        <span className={styles.activityMeta}>
                          {a.vehicle === 'carro' ? '🚗' : a.vehicle === 'van' ? '🚐' : '🚌'}{' '}
                          {a.status === 'completed' ? 'Concluída' : a.status === 'open' ? 'Aberta' : a.status === 'cancelled' ? 'Cancelada' : a.status === 'full' ? 'Lotada' : a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: 24 }}/>
          </>
        )}
      </div>

      {/* Modals */}
      {rawImage      && <CropModal     imageSrc={rawImage}  onConfirm={handleCropConfirm} onCancel={() => setRawImage(null)} saving={cropSaving} />}
      {editOpen      && <EditPanel     user={{ name, age, bairro, zona }} onSave={handleSaveEdit} onClose={() => setEditOpen(false)} />}
      {withdrawOpen  && <WithdrawModal wallet={wallet} setWallet={setWallet} onClose={() => setWithdrawOpen(false)} user={user} toast={toast} />}
      {settingsOpen  && <SettingsPanel onClose={() => setSettingsOpen(false)} onAction={handleSettingsAction} isDark={isDark} onToggleTheme={toggleTheme} />}
    </div>
  )
}
