import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../utils/constants'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { SETTINGS_SECTIONS } from '../data/perfilData'
import styles from './PerfilScreen.module.css'

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICONS = {
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  'car-give': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/></svg>,
  'car-take': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  gear: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  pin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  calendar: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>,
  bell: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  lock: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  logout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

// ─── Formata data de membro ───────────────────────────────────────────────────
function formatMemberSince(iso) {
  if (!iso) return new Date().getFullYear()
  const d = new Date(iso)
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${months[d.getMonth()]}/${d.getFullYear()}`
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ initials, size = 82 }) {
  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.3 }}>
      {initials}
      <div className={styles.avatarOnline} />
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonProfile() {
  return (
    <div className={styles.skeletonWrap} aria-hidden="true">
      <div className={styles.skelAvatar} />
      <div className={styles.skelLines}>
        <div className={`${styles.skelLine} ${styles.skelLg}`} />
        <div className={`${styles.skelLine} ${styles.skelSm}`} />
        <div className={`${styles.skelLine} ${styles.skelMd}`} />
      </div>
      <div className={styles.skelStats}>
        {[1,2,3].map(i => <div key={i} className={styles.skelStat}/>)}
      </div>
    </div>
  )
}

// ─── Painel de edição de perfil ───────────────────────────────────────────────
function EditPanel({ user, onSave, onClose }) {
  const [fields, setFields] = useState({
    name:  user.name     ?? '',
    age:   user.age      ?? '',
    bairro:user.bairro   ?? '',
    zona:  user.zona     ?? '',
    email: user.email    ?? '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => {
    setFields(p => ({ ...p, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!fields.name.trim() || fields.name.length < 3) e.name = 'Mínimo 3 caracteres'
    const age = parseInt(fields.age)
    if (!fields.age || isNaN(age) || age < 13 || age > 100) e.age = 'Idade inválida (13–100)'
    if (!fields.bairro.trim()) e.bairro = 'Informe seu bairro'
    if (!fields.zona.trim()) e.zona = 'Informe sua zona'
    if (!fields.email.trim() || !/\S+@\S+\.\S+/.test(fields.email)) e.email = 'E-mail inválido'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    onSave(fields)
  }

  const EDIT_FIELDS = [
    { id: 'name',   label: 'Nome completo',     type: 'text' },
    { id: 'age',    label: 'Idade',              type: 'number' },
    { id: 'bairro', label: 'Bairro',             type: 'text' },
    { id: 'zona',   label: 'Zona (ex: Zona Sul)',type: 'text' },
    { id: 'email',  label: 'E-mail',             type: 'email' },
  ]

  return (
    <div className={styles.editOverlay} role="dialog" aria-modal="true" aria-label="Editar perfil">
      <div className={styles.editPanel}>
        <div className={styles.editHandle} />
        <div className={styles.editHeader}>
          <h2 className={styles.editTitle}>Editar Perfil</h2>
          <button className={styles.editClose} onClick={onClose} aria-label="Fechar">
            {ICONS.close}
          </button>
        </div>

        <div className={styles.editBody}>
          {/* Handle não editável */}
          <div className={styles.editHandleInfo}>
            <span className={styles.editHandleLabel}>ID de usuário</span>
            <span className={styles.editHandleValue}>{user.handle ?? '@usuario'}</span>
            <span className={styles.editHandleHint}>O ID não pode ser alterado</span>
          </div>

          {EDIT_FIELDS.map(f => (
            <div key={f.id} className={`${styles.editField} ${errors[f.id] ? styles.editFieldError : ''}`}>
              <label className={styles.editLabel} htmlFor={`edit-${f.id}`}>{f.label}</label>
              <input
                id={`edit-${f.id}`}
                type={f.type}
                value={fields[f.id]}
                onChange={set(f.id)}
                className={styles.editInput}
                aria-invalid={!!errors[f.id]}
              />
              {errors[f.id] && <span className={styles.editError}>{errors[f.id]}</span>}
            </div>
          ))}
        </div>

        <div className={styles.editActions}>
          <button className={styles.editCancelBtn} onClick={onClose}>Cancelar</button>
          <button
            className={`${styles.editSaveBtn} ${saving ? styles.editSavingBtn : ''}`}
            onClick={handleSave} disabled={saving}>
            {saving
              ? <span className={styles.loadingDots}><span/><span/><span/></span>
              : <>{ICONS.check} Salvar</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Settings panel ───────────────────────────────────────────────────────────
function SettingsPanel({ onClose, onAction }) {
  return (
    <div className={styles.settingsOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel}>
        <div className={styles.settingsHandle} />
        <div className={styles.settingsHeader}>
          <h2 className={styles.settingsTitle}>Configurações</h2>
          <button className={styles.settingsClose} onClick={onClose}>{ICONS.close}</button>
        </div>
        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.id} className={styles.settingsSection}>
            {section.label && <p className={styles.settingsSectionLabel}>{section.label}</p>}
            <div className={styles.settingsGroup}>
              {section.items.map((item) => (
                <button key={item.id}
                  className={`${styles.settingsItem} ${item.isDanger ? styles.settingsItemDanger : ''}`}
                  onClick={() => onAction?.(item.id)}>
                  <span className={`${styles.settingsItemIcon} ${item.isDanger ? styles.settingsItemIconDanger : ''}`}>
                    {ICONS[item.icon]}
                  </span>
                  <span className={styles.settingsItemLabel}>{item.label}</span>
                  <div className={styles.settingsItemRight}>
                    {item.value && <span className={styles.settingsItemValue}>{item.value}</span>}
                    {!item.isDanger && ICONS.chevron}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className={styles.settingsVersion}>TorcidaMatch v1.0.0 · Feito com ⚽ no Rio</p>
      </div>
    </div>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function PerfilScreen() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useUser()
  const toast = useToast()

  const [loading,      setLoading]      = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editOpen,     setEditOpen]     = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  const handleSettingsAction = (itemId) => {
    if (itemId === 'logout') {
      setSettingsOpen(false)
      logout()
      navigate(ROUTES.LOGIN, { replace: true })
    }
  }

  const handleSaveEdit = (fields) => {
    updateUser({
      name:   fields.name,
      age:    parseInt(fields.age),
      bairro: fields.bairro,
      zona:   fields.zona,
      email:  fields.email,
      // recalcula initials
      initials: fields.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
    })
    setEditOpen(false)
    toast.success('Perfil atualizado!')
  }

  // Dados do usuário — usa contexto real, com defaults seguros
  const name        = user?.name        ?? 'Usuário'
  const initials    = user?.initials    ?? 'U'
  const handle      = user?.handle      ?? ''
  const age         = user?.age         ?? null
  const bairro      = user?.bairro      ?? ''
  const zona        = user?.zona        ?? ''
  const team        = user?.team        ?? ''
  const teamEmoji   = user?.teamEmoji   ?? ''
  const email       = user?.email       ?? ''
  const memberSince = user?.memberSince ?? new Date().toISOString()

  // Stats sempre zeradas para conta nova (futuramente virão do backend)
  const stats = [
    { id: 'grupos',  icon: 'users',    label: 'Grupos',    value: user?.grupos ?? 0,            color: 'green' },
    { id: 'offered', icon: 'car-give', label: 'Caronas ofertadas', value: user?.caronasOferecidas ?? 0, color: 'green' },
    { id: 'taken',   icon: 'car-take', label: 'Caronas pegadas',   value: user?.caronasPegadas ?? 0,   color: 'blue'  },
  ]

  const location = [bairro, zona].filter(Boolean).join(', ')

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Perfil</h1>
        <div className={styles.headerActions}>
          <button className={styles.editIconBtn} onClick={() => setEditOpen(true)} aria-label="Editar perfil">
            {ICONS.edit}
          </button>
          <button className={styles.gearBtn} onClick={() => setSettingsOpen(true)} aria-label="Configurações">
            {ICONS.gear}
          </button>
        </div>
      </div>

      {/* Scroll body */}
      <div className={styles.scrollArea}>
        {loading ? <SkeletonProfile /> : (
          <>
            {/* ── Card de perfil ── */}
            <div className={styles.profileCard}>
              <div className={styles.profileCardInner}>
                <Avatar initials={initials} size={82} />

                <div className={styles.profileInfo}>
                  <h2 className={styles.profileName}>{name}</h2>
                  {handle && <p className={styles.profileHandle}>{handle}</p>}

                  <div className={styles.profileMeta}>
                    {age && (
                      <span className={styles.profileMetaItem}>
                        {ICONS.calendar} {age} anos
                      </span>
                    )}
                    {age && team && <span className={styles.profileMetaDot}>·</span>}
                    {team && (
                      <span className={styles.profileMetaItem}>
                        {teamEmoji} {team}
                      </span>
                    )}
                  </div>

                  {location && (
                    <div className={styles.profileMetaRow}>
                      <span className={styles.profileMetaItem}>
                        {ICONS.pin} {location}
                      </span>
                      <span className={styles.profileMetaDot}>·</span>
                      <span className={styles.profileMetaItem}>
                        {ICONS.calendar} Membro desde {formatMemberSince(memberSince)}
                      </span>
                    </div>
                  )}

                  {!location && (
                    <p className={styles.profileMetaItem} style={{ marginTop: 6 }}>
                      {ICONS.calendar} Membro desde {formatMemberSince(memberSince)}
                    </p>
                  )}
                </div>

                <button className={styles.editBtn} onClick={() => setEditOpen(true)} aria-label="Editar perfil">
                  {ICONS.edit} Editar perfil
                </button>
              </div>
            </div>

            {/* ── Stats ── */}
            <div className={styles.statsGrid}>
              {stats.map(s => (
                <div key={s.id} className={styles.statCard}>
                  <div className={`${styles.statIcon} ${s.color === 'blue' ? styles.statIconBlue : styles.statIconGreen}`}>
                    {ICONS[s.icon]}
                  </div>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* ── Avaliação ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Avaliação</span>
              </div>
              <div className={styles.ratingCard}>
                <div className={styles.ratingStars}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="1.5">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                  ))}
                </div>
                <p className={styles.ratingEmpty}>
                  Ainda sem avaliações. Participe de grupos e caronas para começar!
                </p>
              </div>
            </div>

            {/* ── Atividades recentes ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Atividades recentes</span>
              </div>
              <div className={styles.emptyActivity}>
                <div className={styles.emptyActivityIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4l3 3"/>
                  </svg>
                </div>
                <p className={styles.emptyActivityText}>Nenhuma atividade recente</p>
                <p className={styles.emptyActivitySub}>Explore grupos e caronas para começar sua jornada!</p>
                <button className={styles.exploreBtn} onClick={() => navigate(ROUTES.GRUPOS)}>
                  Explorar grupos
                </button>
              </div>
            </div>

            {/* ── Configurações rápidas ── */}
            <div className={styles.quickSettings}>
              {[
                { icon: 'bell',  label: 'Notificações' },
                { icon: 'lock',  label: 'Privacidade' },
                { icon: 'logout',label: 'Sair', danger: true },
              ].map(item => (
                <button key={item.label}
                  className={`${styles.quickSettingsBtn} ${item.danger ? styles.quickSettingsDanger : ''}`}
                  onClick={() => {
                    if (item.danger) { logout(); navigate(ROUTES.LOGIN, { replace: true }) }
                  }}
                  aria-label={item.label}>
                  <span className={styles.quickSettingsIcon}>{ICONS[item.icon]}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div style={{ height: 24 }} />
          </>
        )}
      </div>

      {/* Painel de edição */}
      {editOpen && (
        <EditPanel
          user={{ name, age, bairro, zona, email, handle }}
          onSave={handleSaveEdit}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Painel de configurações */}
      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          onAction={handleSettingsAction}
        />
      )}
    </div>
  )
}
