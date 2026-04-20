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
  'car-give':<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><text x="12" y="17" textAnchor="middle" fill="currentColor" stroke="none" fontSize="14" fontWeight="700" fontFamily="sans-serif">$</text></svg>,
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

  // ── Stripe Connect & Carteira ─────────────────────────────────────────────
  const [connectStatus, setConnectStatus] = useState(null)   // null | 'not_started' | 'pending' | 'active'
  const [connectLoading, setConnectLoading] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [walletOpen, setWalletOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixKeyType, setPixKeyType] = useState('cpf')
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t) }, [])
  useEffect(() => { if (user?.photo) setPhoto(user.photo) }, [user?.photo])

  // Carregar status do Connect e carteira
  useEffect(() => {
    if (!user?.token) return
    async function loadFinancial() {
      try {
        const [statusRes, walletRes] = await Promise.all([
          fetch(`${API_URL}/connect/status`, { headers: { Authorization: `Bearer ${user.token}` } }),
          fetch(`${API_URL}/wallet/balance`, { headers: { Authorization: `Bearer ${user.token}` } }),
        ])
        if (statusRes.ok) { const d = await statusRes.json(); setConnectStatus(d.status) }
        if (walletRes.ok) { const d = await walletRes.json(); setWallet(d) }
      } catch {}
    }
    loadFinancial()
  }, [user?.token])

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

  // ── Iniciar onboarding Connect ────────────────────────────────────────────
  const handleConnectOnboard = async () => {
    setConnectLoading(true)
    try {
      const res = await fetch(`${API_URL}/connect/onboard`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (res.ok) window.open(data.url, '_blank')
      else toast.error(data.error || 'Erro ao iniciar cadastro')
    } catch { toast.error('Erro de conexão') }
    finally { setConnectLoading(false) }
  }

  // ── Abrir painel Express do Stripe ────────────────────────────────────────
  const handleConnectDashboard = async () => {
    setConnectLoading(true)
    try {
      const res = await fetch(`${API_URL}/connect/dashboard`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (res.ok) window.open(data.url, '_blank')
      else toast.error(data.error || 'Erro ao abrir painel')
    } catch { toast.error('Erro de conexão') }
    finally { setConnectLoading(false) }
  }

  // ── Salvar chave PIX ─────────────────────────────────────────────────────
  const handleSavePix = async () => {
    if (!pixKey.trim()) return toast.error('Informe a chave PIX')
    try {
      const res = await fetch(`${API_URL}/wallet/pix-key`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ pixKey: pixKey.trim(), pixKeyType }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Chave PIX salva!'); setWallet(w => ({ ...w, hasPixKey: true, pixKeyType })) }
      else toast.error(data.error || 'Erro ao salvar PIX')
    } catch { toast.error('Erro de conexão') }
  }

  // ── Solicitar saque ───────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    const cents = Math.round(parseFloat(withdrawAmount.replace(',', '.')) * 100)
    if (!cents || cents < 5000) return toast.error('Mínimo R$ 50,00')
    setWithdrawing(true)
    try {
      const res = await fetch(`${API_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ amount: cents }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setWallet(w => ({ ...w, balance: data.newBalance, balanceFormatted: data.newBalanceFormatted }))
        setWithdrawOpen(false)
        setWithdrawAmount('')
      } else toast.error(data.error || 'Erro ao sacar')
    } catch { toast.error('Erro de conexão') }
    finally { setWithdrawing(false) }
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

            {/* ── 💰 Carteira digital — topo da tela ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>💰 Carteira</span>
              </div>
              <div className={styles.walletCard}>

                {/* Saldo + botão Sacar */}
                <div className={styles.walletTopRow}>
                  <div className={styles.walletBalance}>
                    <span className={styles.walletBalanceLabel}>Saldo disponível</span>
                    <span className={styles.walletBalanceValue}>{wallet?.balanceFormatted || 'R$ 0,00'}</span>
                  </div>
                  <button
                    className={`${styles.withdrawPrimaryBtn} ${!wallet?.canWithdraw ? styles.withdrawPrimaryBtnDisabled : ''}`}
                    onClick={() => wallet?.canWithdraw && setWithdrawOpen(true)}
                    disabled={!wallet?.canWithdraw}
                    title={!wallet?.canWithdraw ? `Mínimo R$ 50,00 para sacar` : 'Sacar saldo'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                    Sacar
                  </button>
                </div>

                {/* Barra de progresso até R$ 50 */}
                {!wallet?.canWithdraw && wallet !== null && (() => {
                  const balance  = wallet?.balance || 0
                  const minimum  = 5000 // R$ 50,00 em centavos
                  const pct      = Math.min(100, Math.round((balance / minimum) * 100))
                  const faltam   = minimum - balance
                  return (
                    <div className={styles.walletProgressBox}>
                      <div className={styles.walletProgressHeader}>
                        <span>Progresso para saque</span>
                        <span className={styles.walletProgressPct}>{pct}%</span>
                      </div>
                      <div className={styles.walletProgressTrack}>
                        <div className={styles.walletProgressFill} style={{ width: `${pct}%` }} />
                      </div>
                      <p className={styles.walletProgressHint}>
                        Faltam <strong>R$ {(faltam / 100).toFixed(2).replace('.', ',')}</strong> para atingir o mínimo de R$ 50,00
                      </p>
                    </div>
                  )
                })()}

                {/* Pills de aviso */}
                <div className={styles.walletInfoRow}>
                  <span className={styles.walletInfoPill}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                    Mínimo R$ 50,00
                  </span>
                  <span className={styles.walletInfoPill}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                    Aprovado em até 24h
                  </span>
                  <span className={styles.walletInfoPill}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Via Stripe · Seguro
                  </span>
                </div>

                {/* PIX */}
                {!wallet?.hasPixKey ? (
                  <div className={styles.pixSetup}>
                    <p className={styles.pixSetupLabel}>Cadastre sua chave PIX para sacar</p>
                    <div className={styles.pixRow}>
                      <select value={pixKeyType} onChange={e => setPixKeyType(e.target.value)} className={styles.pixSelect}>
                        <option value="cpf">CPF</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Aleatória</option>
                      </select>
                      <input type="text" value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="Sua chave PIX" className={styles.pixInput} />
                      <button className={styles.pixSaveBtn} onClick={handleSavePix}>Salvar</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.pixConfirmed}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Chave PIX cadastrada ({wallet.pixKeyType})</span>
                    <button
                      className={styles.pixChangeBtn}
                      onClick={() => setWallet(w => ({ ...w, hasPixKey: false }))}
                    >
                      Alterar
                    </button>
                  </div>
                )}

                {/* SAC */}
                <div className={styles.walletSacRow}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>Problema com saque?</span>
                  <a href="mailto:suporte@torcidamatch.com.br?subject=Problema%20com%20saque" className={styles.sacLink}>
                    Falar com SAC
                  </a>
                </div>
              </div>
            </div>

            {/* ── 🏦 Conta financeira (Stripe Connect) — topo da tela ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>🏦 Conta financeira</span>
              </div>
              <div className={styles.connectCard}>
                {connectStatus === 'active' ? (
                  <>
                    <div className={styles.connectActive}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>Conta verificada · Recebimentos habilitados</span>
                    </div>
                    <p className={styles.connectText}>
                      Você recebe 80% do valor de cada reserva diretamente na sua conta bancária. A TorcidaMatch retém 20% como taxa de plataforma.
                    </p>
                    <button className={styles.connectBtn} onClick={handleConnectDashboard} disabled={connectLoading}>
                      {connectLoading ? 'Abrindo...' : 'Ver painel financeiro →'}
                    </button>
                  </>
                ) : connectStatus === 'pending' ? (
                  <>
                    <div className={styles.connectPending}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>Cadastro em andamento</span>
                    </div>
                    <p className={styles.connectText}>Conclua o cadastro no Stripe para habilitar o recebimento de pagamentos.</p>
                    <button className={styles.connectBtn} onClick={handleConnectOnboard} disabled={connectLoading}>
                      {connectLoading ? 'Aguarde...' : 'Continuar cadastro →'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className={styles.connectText}>
                      Ofereça viagens e receba os pagamentos diretamente na sua conta bancária. O cadastro é rápido e seguro, feito em parceria com a Stripe.
                    </p>
                    <button className={styles.connectBtn} onClick={handleConnectOnboard} disabled={connectLoading}>
                      {connectLoading ? 'Aguarde...' : '🚀 Habilitar recebimentos'}
                    </button>
                  </>
                )}
                {/* Aviso SAC na conta financeira */}
                <div className={styles.walletSacRow}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>Dúvidas sobre recebimentos?</span>
                  <a
                    href="mailto:suporte@torcidamatch.com.br?subject=Duvida%20conta%20financeira"
                    className={styles.sacLink}
                  >
                    Falar com SAC
                  </a>
                </div>
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

      {/* Modal de saque */}
      {withdrawOpen && (() => {
        const cents       = Math.round(parseFloat((withdrawAmount || '0').replace(',', '.')) * 100)
        const isValid     = cents >= 5000 && cents <= (wallet?.balance || 0)
        const fmtValue    = cents > 0 ? `R$ ${(cents / 100).toFixed(2).replace('.', ',')}` : '—'
        const destination = wallet?.pixKeyType
          ? `Chave PIX (${wallet.pixKeyType})`
          : 'Conta Stripe Connect'

        return (
          <div className={styles.overlay} onClick={() => setWithdrawOpen(false)}>
            <div className={styles.sheet} onClick={e => e.stopPropagation()}>
              <div className={styles.sheetHandle}/>
              <div className={styles.sheetHeader}>
                <button className={styles.sheetCancelBtn} onClick={() => setWithdrawOpen(false)}>Cancelar</button>
                <span className={styles.sheetTitle}>💸 Sacar saldo</span>
                <div style={{ width: 60 }}/>
              </div>

              <div className={styles.sheetBody}>
                {/* Saldo atual */}
                <div className={styles.withdrawSaldoBox}>
                  <span className={styles.withdrawSaldoLabel}>Saldo disponível</span>
                  <span className={styles.withdrawSaldoBig}>{wallet?.balanceFormatted || 'R$ 0,00'}</span>
                </div>

                {/* Input de valor */}
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Quanto quer sacar?</label>
                  <div className={styles.withdrawAmountRow}>
                    <span className={styles.withdrawAmountPrefix}>R$</span>
                    <input
                      type="number" min="50" step="0.01"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="50,00"
                      className={styles.withdrawAmountInput}
                    />
                    <button
                      className={styles.withdrawMaxBtn}
                      onClick={() => setWithdrawAmount(((wallet?.balance || 0) / 100).toFixed(2))}
                    >
                      Tudo
                    </button>
                  </div>
                </div>

                {/* Resumo da transação */}
                {cents > 0 && (
                  <div className={styles.withdrawSummary}>
                    <div className={styles.withdrawSummaryRow}>
                      <span>Valor solicitado</span>
                      <span>{fmtValue}</span>
                    </div>
                    <div className={styles.withdrawSummaryRow}>
                      <span>Destino</span>
                      <span>{destination}</span>
                    </div>
                    <div className={styles.withdrawSummaryRow}>
                      <span>Prazo</span>
                      <span>Até 1 dia útil</span>
                    </div>
                    <div className={`${styles.withdrawSummaryRow} ${styles.withdrawSummaryTotal}`}>
                      <span>Você recebe</span>
                      <strong>{fmtValue}</strong>
                    </div>
                  </div>
                )}

                {/* Avisos */}
                <div className={styles.withdrawInfoBox}>
                  <div className={styles.withdrawInfoItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Mínimo <strong>R$ 50,00</strong> por saque</span>
                  </div>
                  <div className={styles.withdrawInfoItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                    <span>Crédito em até <strong>1 dia útil</strong> no seu PIX</span>
                  </div>
                  <div className={styles.withdrawInfoItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Limite de <strong>3 saques por dia</strong></span>
                  </div>
                </div>

                {/* Botão confirmar */}
                <button
                  className={`${styles.withdrawConfirmBtn} ${!isValid || withdrawing ? styles.withdrawConfirmBtnDisabled : ''}`}
                  onClick={handleWithdraw}
                  disabled={!isValid || withdrawing}
                >
                  {withdrawing
                    ? 'Processando...'
                    : isValid
                    ? `Confirmar saque de ${fmtValue}`
                    : cents > (wallet?.balance || 0)
                    ? 'Valor maior que o saldo'
                    : cents > 0 && cents < 5000
                    ? 'Mínimo R$ 50,00'
                    : 'Digite o valor'}
                </button>

                <div className={styles.walletSacRow} style={{ borderTop: 'none', paddingTop: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>Dúvidas?</span>
                  <a href="mailto:suporte@torcidamatch.com.br?subject=Problema%20com%20saque" className={styles.sacLink} onClick={() => setWithdrawOpen(false)}>
                    Falar com SAC
                  </a>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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

