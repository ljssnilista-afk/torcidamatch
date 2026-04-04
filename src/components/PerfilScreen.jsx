import React, { useState, useEffect, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../utils/constants'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import styles from './PerfilScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = imageSrc
  })
  const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 300
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, 300, 300)
  return canvas.toDataURL('image/jpeg', 0.85)
}

const ICONS = {
  users:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  'car-give':<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/></svg>,
  'car-take':<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>,
  gear:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  edit:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  pin:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  calendar:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  chevron:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>,
  bell:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  lock:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  logout:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  camera:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  sun:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  globe:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  info:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
}

function formatMemberSince(iso) {
  if (!iso) return new Date().getFullYear()
  const d = new Date(iso)
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${months[d.getMonth()]}/${d.getFullYear()}`
}

// ─── Crop Modal ──────────────────────────────────────────────────────────────
function CropModal({ imageSrc, onConfirm, onCancel, saving }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState(null)
  const onCropComplete = useCallback((_, px) => setCroppedArea(px), [])
  const handleConfirm = async () => { if (croppedArea) onConfirm(await getCroppedImg(imageSrc, croppedArea)) }

  return (
    <div className={styles.cropOverlay}>
      <div className={styles.cropSheet}>
        <div className={styles.cropHandle}/>
        <div className={styles.cropHeader}>
          <button className={styles.cropCancelBtn} onClick={onCancel}>Cancelar</button>
          <span className={styles.cropTitle}>Ajustar foto</span>
          <button className={styles.cropConfirmBtn} onClick={handleConfirm} disabled={saving}>{saving ? '...' : 'Confirmar'}</button>
        </div>
        <div className={styles.cropArea}>
          <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
        </div>
        <div className={styles.cropZoom}>
          <span className={styles.cropZoomLabel}>Zoom</span>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} className={styles.cropSlider} />
        </div>
      </div>
    </div>
  )
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ initials, photo, size = 82, onPickFile }) {
  const inputRef = useRef(null)
  return (
    <div className={styles.avatarWrap} style={{ width: size, height: size }}>
      {photo
        ? <img src={photo} alt={initials} className={styles.avatarPhoto}/>
        : <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.3 }}>{initials}</div>}
      <div className={styles.avatarOnline}/>
      <button className={styles.avatarUploadBtn} onClick={() => inputRef.current?.click()} aria-label="Alterar foto">{ICONS.camera}</button>
      <input ref={inputRef} type="file" accept="image/*" className={styles.avatarInput} onChange={e => {
        const file = e.target.files?.[0]; if (!file) return
        const reader = new FileReader(); reader.onload = ev => onPickFile(ev.target.result); reader.readAsDataURL(file); e.target.value = ''
      }} />
    </div>
  )
}

// ─── Edit Panel ──────────────────────────────────────────────────────────────
function EditPanel({ user, onSave, onClose }) {
  const [fields, setFields] = useState({ name: user.name ?? '', age: user.age ?? '', bairro: user.bairro ?? '', zona: user.zona ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = f => e => { setFields(p => ({ ...p, [f]: e.target.value })); setErrors(p => ({ ...p, [f]: '' })) }
  const validate = () => {
    const e = {}
    if (!fields.name.trim() || fields.name.length < 3) e.name = 'Mínimo 3 caracteres'
    const age = parseInt(fields.age); if (!fields.age || isNaN(age) || age < 13 || age > 100) e.age = 'Idade inválida (13–100)'
    if (!fields.bairro.trim()) e.bairro = 'Informe seu bairro'
    if (!fields.zona.trim()) e.zona = 'Informe sua zona'
    return e
  }
  const handleSave = async () => {
    const errs = validate(); if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true); await new Promise(r => setTimeout(r, 400)); onSave(fields)
  }
  const EDIT_FIELDS = [
    { id: 'name', label: 'Nome completo', type: 'text' },
    { id: 'age', label: 'Idade', type: 'number' },
    { id: 'bairro', label: 'Bairro', type: 'text' },
    { id: 'zona', label: 'Zona', type: 'text' },
  ]
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle}/>
        <div className={styles.sheetHeader}>
          <button className={styles.sheetCancelBtn} onClick={onClose}>Cancelar</button>
          <span className={styles.sheetTitle}>Editar perfil</span>
          <button className={styles.sheetSaveBtn} onClick={handleSave} disabled={saving}>{saving ? '...' : 'Salvar'}</button>
        </div>
        <div className={styles.sheetBody}>
          {EDIT_FIELDS.map(f => (
            <div key={f.id} className={styles.editField}>
              <label className={styles.editLabel}>{f.label}</label>
              <input type={f.type} value={fields[f.id]} onChange={set(f.id)} className={`${styles.editInput} ${errors[f.id] ? styles.editInputErr : ''}`} />
              {errors[f.id] && <span className={styles.editErr}>{errors[f.id]}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Settings Panel (engrenagem) ─────────────────────────────────────────────
function SettingsPanel({ onClose, onAction, isDark, onToggleTheme }) {
  const SETTINGS = [
    { id: 'theme', icon: isDark ? 'sun' : 'moon', label: isDark ? 'Modo Claro' : 'Modo Escuro', isTheme: true },
    { id: 'notifications', icon: 'bell', label: 'Notificações' },
    { id: 'privacy', icon: 'lock', label: 'Privacidade' },
    { id: 'location', icon: 'pin', label: 'Localização' },
    { id: 'language', icon: 'globe', label: 'Idioma', value: 'Português' },
    { id: 'about', icon: 'info', label: 'Sobre o app', value: 'v1.0.0' },
    { id: 'logout', icon: 'logout', label: 'Sair da conta', danger: true },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.settingsSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle}/>
        <div className={styles.settingsHeader}>
          <span className={styles.settingsTitle}>Configurações</span>
          <button className={styles.settingsClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.settingsList}>
          {SETTINGS.map(item => (
            <button
              key={item.id}
              className={`${styles.settingsItem} ${item.danger ? styles.settingsItemDanger : ''}`}
              onClick={() => {
                if (item.isTheme) { onToggleTheme(); return }
                onAction(item.id)
                if (item.id !== 'theme') onClose()
              }}
            >
              <span className={`${styles.settingsItemIcon} ${item.danger ? styles.settingsItemIconDanger : ''}`}>
                {ICONS[item.icon]}
              </span>
              <span className={styles.settingsItemLabel}>{item.label}</span>
              {item.value && <span className={styles.settingsItemValue}>{item.value}</span>}
              {item.isTheme && (
                <span className={styles.themeToggle}>
                  <span className={`${styles.themeToggleTrack} ${!isDark ? styles.themeToggleOn : ''}`}>
                    <span className={styles.themeToggleThumb} />
                  </span>
                </span>
              )}
              {!item.isTheme && !item.danger && !item.value && (
                <span className={styles.settingsItemChevron}>{ICONS.chevron}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function PerfilScreen() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useUser()
  const toast = useToast()
  const { isDark, toggleTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [rawImage, setRawImage] = useState(null)
  const [cropSaving, setCropSaving] = useState(false)
  const [photo, setPhoto] = useState(user?.photo || null)

  const [stats, setStats] = useState({ grupos: 0, viagensOferecidas: 0, viagensFeitas: 0 })
  const [atividades, setAtividades] = useState([])

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t) }, [])
  useEffect(() => { if (user?.photo) setPhoto(user.photo) }, [user?.photo])

  useEffect(() => {
    async function loadStats() {
      if (!user?.token) return
      try {
        const res = await fetch(`${API_URL}/profile/me/stats`, { headers: { Authorization: `Bearer ${user.token}` } })
        if (res.ok) { const data = await res.json(); setStats(data.stats || {}); setAtividades(data.atividades || []) }
      } catch (err) { console.warn('[PerfilScreen] stats error:', err.message) }
    }
    loadStats()
  }, [user?.token])

  const savePhotoToBackend = async (dataUrl) => {
    try {
      const res = await fetch(`${API_URL}/profile/me`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}) },
        body: JSON.stringify({ photo: dataUrl }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      const data = await res.json(); updateUser({ photo: dataUrl, ...data.user })
    } catch (err) { updateUser({ photo: dataUrl }) }
  }

  const handleCropConfirm = async (croppedDataUrl) => {
    setCropSaving(true); setPhoto(croppedDataUrl); setRawImage(null)
    await savePhotoToBackend(croppedDataUrl); setCropSaving(false); toast.success('Foto atualizada!')
  }

  const handleSettingsAction = (itemId) => {
    if (itemId === 'logout') { logout(); navigate(ROUTES.LOGIN, { replace: true }) }
  }

  const handleSaveEdit = (fields) => {
    updateUser({ name: fields.name, age: parseInt(fields.age), bairro: fields.bairro, zona: fields.zona,
      initials: fields.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() })
    setEditOpen(false); toast.success('Perfil atualizado!')
  }

  const name = user?.name ?? 'Usuário'
  const initials = user?.initials ?? 'U'
  const handle = user?.handle ?? ''
  const age = user?.age ?? null
  const bairro = user?.bairro ?? ''
  const zona = user?.zona ?? ''
  const team = user?.team ?? ''
  const teamEmoji = user?.teamEmoji ?? ''
  const memberSince = user?.memberSince ?? new Date().toISOString()
  const location = [bairro, zona].filter(Boolean).join(', ')

  const statCards = [
    { id: 'grupos', icon: 'users', label: 'Grupos', value: stats.grupos ?? 0, color: 'green' },
    { id: 'offered', icon: 'car-give', label: 'Viagens ofertadas', value: stats.viagensOferecidas ?? 0, color: 'green' },
    { id: 'taken', icon: 'car-take', label: 'Viagens feitas', value: stats.viagensFeitas ?? 0, color: 'blue' },
  ]

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Perfil</h1>
        <div className={styles.headerActions}>
          <button className={styles.editIconBtn} onClick={() => setEditOpen(true)} aria-label="Editar perfil">{ICONS.edit}</button>
          <button className={styles.gearBtn} onClick={() => setSettingsOpen(true)} aria-label="Configurações">{ICONS.gear}</button>
        </div>
      </div>

      <div className={styles.scrollArea}>
        {loading ? (
          <div className={styles.skeletonWrap}><div className={styles.skelAvatar}/><div className={styles.skelLines}><div className={`${styles.skelLine} ${styles.skelLg}`}/><div className={`${styles.skelLine} ${styles.skelSm}`}/></div></div>
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

            {/* Stats */}
            <div className={styles.statsGrid}>
              {statCards.map(s => (
                <div key={s.id} className={styles.statCard}>
                  <div className={`${styles.statIcon} ${s.color === 'blue' ? styles.statIconBlue : styles.statIconGreen}`}>{ICONS[s.icon]}</div>
                  {s.value > 0 ? <span className={styles.statValue}>{s.value}</span> : <span className={styles.statValueEmpty}>—</span>}
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
                  <div className={styles.emptyActivityIcon}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
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

      {/* Crop modal */}
      {rawImage && <CropModal imageSrc={rawImage} onConfirm={handleCropConfirm} onCancel={() => setRawImage(null)} saving={cropSaving} />}

      {/* Edit panel */}
      {editOpen && <EditPanel user={{ name, age, bairro, zona }} onSave={handleSaveEdit} onClose={() => setEditOpen(false)} />}

      {/* Settings panel (engrenagem) — com toggle de tema */}
      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          onAction={handleSettingsAction}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  )
}
