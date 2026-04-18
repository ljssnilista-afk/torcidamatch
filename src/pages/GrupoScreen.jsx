import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../utils/constants'
import PaymentModal from '../ui/PaymentModal'
import styles from './GrupoScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

const WS_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws').replace(/\/$/, '')
  : 'ws://localhost:3001'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeStr(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function avatarColor(name = '') {
  const colors = ['#22C55E','#3B82F6','#D4AF37','#C060C0','#EF4444','#0EA5E9','#F97316']
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
}

// ─── Header do grupo ──────────────────────────────────────────────────────────
function GrupoHeader({ grupo, membersCount, onMenu, onBack }) {
  const bg = avatarColor(grupo?.name || '')
  return (
    <div className={styles.header}>
      <button className={styles.backBtn} onClick={onBack} aria-label="Voltar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      {grupo?.photo ? (
        <img src={grupo.photo} alt={grupo.name} loading="lazy" className={styles.headerPhoto} />
      ) : (
        <div className={styles.headerAvatar} style={{ background: bg }}>
          {initials(grupo?.name)}
        </div>
      )}
      <div className={styles.headerInfo}>
        <span className={styles.headerName}>{grupo?.name ?? '...'}</span>
        <span className={styles.headerMeta}>
          {grupo?.code && <span style={{ fontFamily: 'monospace', opacity: 0.5, marginRight: 4 }}>#{grupo.code}</span>}
          {membersCount} {membersCount === 1 ? 'membro' : 'membros'}
          {grupo?.team ? ` • ${grupo.team}` : ''}
        </span>
      </div>
      <button className={styles.menuBtn} onClick={onMenu} aria-label="Opções">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5" r="1" fill="currentColor"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
          <circle cx="12" cy="19" r="1" fill="currentColor"/>
        </svg>
      </button>
    </div>
  )
}

// ─── Bolha de mensagem ────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }) {
  if (msg.type === 'system') {
    return (
      <div className={styles.systemMsg}>
        <span>{msg.text}</span>
      </div>
    )
  }
  return (
    <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
      {!isOwn && (
        <div className={styles.bubbleAvatar} style={{ background: avatarColor(msg.senderName) }}>
          {initials(msg.senderName)}
        </div>
      )}
      <div className={styles.bubbleContent}>
        {!isOwn && <span className={styles.bubbleSender}>{msg.senderName}</span>}
        <div className={styles.bubbleText}>{msg.text}</div>
        <span className={styles.bubbleTime}>{timeStr(msg.createdAt)}</span>
      </div>
    </div>
  )
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────
function EmptyChat({ onInvite }) {
  return (
    <div className={styles.emptyChat}>
      <div className={styles.emptyChatIcon}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </div>
      <p className={styles.emptyChatTitle}>Nenhuma mensagem ainda</p>
      <p className={styles.emptyChatSub}>Seja o primeiro a mandar um olá! 👋</p>
      <button className={styles.inviteBtn} onClick={onInvite}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        Convidar pessoas
      </button>
    </div>
  )
}

// ─── Menu de opções ───────────────────────────────────────────────────────────
// ─── Modal de edição do grupo (líder) ─────────────────────────────────────────
function EditGroupModal({ grupo, onSave, onClose, loading }) {
  const [fields, setFields] = useState({
    name: grupo.name || '',
    description: grupo.description || '',
    bairro: grupo.bairro || '',
    zona: grupo.zona || '',
    meetPoint: grupo.meetPoint || '',
    privacy: grupo.privacy || 'public',
    approvalRequired: grupo.approvalRequired || false,
    groupType: grupo.groupType || 'misto',
    locationLat: grupo.location?.lat || null,
    locationLng: grupo.location?.lng || null,
  })
  const [photoPreview, setPhotoPreview] = useState(grupo.photo || null)
  const [photoData, setPhotoData] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locLabel, setLocLabel] = useState(
    grupo.location?.lat ? `${grupo.location.lat.toFixed(4)}, ${grupo.location.lng.toFixed(4)}` : ''
  )
  const fileRef = useRef(null)

  const set = f => e => setFields(p => ({ ...p, [f]: typeof e === 'object' ? e.target.value : e }))

  // Compress and resize photo
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = 600
        const ctx = canvas.getContext('2d')
        // Center crop
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 600, 600)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setPhotoPreview(dataUrl)
        setPhotoData(dataUrl)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const updates = { ...fields }
    if (photoData) updates.photo = photoData
    if (fields.locationLat && fields.locationLng) {
      updates.location = { lat: fields.locationLat, lng: fields.locationLng }
    }
    delete updates.locationLat
    delete updates.locationLng
    onSave(updates)
  }

  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.editSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        <div className={styles.editHeader}>
          <button className={styles.editCancelBtn} onClick={onClose}>Cancelar</button>
          <span className={styles.editTitle}>Editar grupo</span>
          <button className={styles.editSaveBtn} onClick={handleSave} disabled={loading}>{loading ? '...' : 'Salvar'}</button>
        </div>
        <div className={styles.editBody}>
          {/* Photo upload */}
          <label className={styles.editLabel}>Foto do grupo</label>
          <div className={styles.photoUploadRow}>
            <div className={styles.photoPreview} onClick={() => fileRef.current?.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Foto do grupo" className={styles.photoPreviewImg} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              )}
            </div>
            <div className={styles.photoUploadInfo}>
              <button className={styles.photoUploadBtn} onClick={() => fileRef.current?.click()}>
                {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              <span className={styles.photoUploadHint}>JPEG ou PNG, máx 800KB</span>
              {photoPreview && (
                <button className={styles.photoRemoveBtn} onClick={() => { setPhotoPreview(null); setPhotoData('') }}>
                  Remover
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} style={{ display: 'none' }} />
          </div>

          <label className={styles.editLabel}>Nome do grupo</label>
          <input type="text" value={fields.name} onChange={set('name')} maxLength={50} className={styles.editInput} />

          <label className={styles.editLabel}>Descrição</label>
          <textarea value={fields.description} onChange={set('description')} maxLength={140} rows={3} className={styles.editInput} style={{ resize: 'none' }} />

          <label className={styles.editLabel}>Ponto de encontro</label>
          <input type="text" value={fields.meetPoint} onChange={set('meetPoint')} className={styles.editInput} placeholder="Ex: Praça dos Bancários" />

          {/* 📍 Localização exata — mapa interativo */}
          <label className={styles.editLabel}>Localização no mapa <span style={{fontWeight: 400, fontSize: 10, color: 'var(--color-text-tertiary)'}}>(toque no mapa para marcar)</span></label>
          <div style={{
            width: '100%', height: 200, borderRadius: 12, overflow: 'hidden',
            border: `0.5px solid ${fields.locationLat ? 'rgba(34,197,94,0.25)' : 'var(--color-border)'}`,
            marginBottom: 4,
          }}>
            <iframe
              title="Selecionar localização"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${
                fields.locationLat
                  ? `${fields.locationLat},${fields.locationLng}`
                  : encodeURIComponent((fields.meetPoint || fields.bairro || 'Rio de Janeiro') + ', Rio de Janeiro')
              }&zoom=15`}
              allowFullScreen
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setLocLoading(true)
                navigator.geolocation?.getCurrentPosition(
                  async (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords
                    setFields(p => ({ ...p, locationLat: lat, locationLng: lng }))
                    try {
                      const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
                        { headers: { 'User-Agent': 'TorcidaMatch/1.0' } }
                      )
                      const data = await res.json()
                      const road = data.address?.road || ''
                      const bairro = data.address?.suburb || data.address?.neighbourhood || ''
                      setLocLabel(road ? `${road}, ${bairro}` : `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                    } catch {
                      setLocLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                    }
                    setLocLoading(false)
                  },
                  () => { setLocLoading(false) },
                  { timeout: 8000 }
                )
              }}
              disabled={locLoading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: 'rgba(34,197,94,0.06)', border: '0.5px solid rgba(34,197,94,0.2)',
                color: 'var(--color-brand)', cursor: 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {locLoading ? 'Detectando...' : 'Usar minha localização'}
            </button>
            <button
              type="button"
              onClick={() => {
                const input = prompt('Cole as coordenadas (lat, lng).\nEx: -22.9711, -43.1822')
                if (!input) return
                const parts = input.split(',').map(s => parseFloat(s.trim()))
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  setFields(p => ({ ...p, locationLat: parts[0], locationLng: parts[1] }))
                  setLocLabel(`${parts[0].toFixed(4)}, ${parts[1].toFixed(4)}`)
                }
              }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: 'var(--color-surface-2)', border: '0.5px solid var(--color-border)',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}
            >
              Inserir coordenadas
            </button>
          </div>
          {locLabel && (
            <span style={{ fontSize: 11, color: 'var(--color-brand)', marginTop: 4, display: 'block' }}>
              📍 {locLabel}
            </span>
          )}
          {fields.locationLat && (
            <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', display: 'block' }}>
              ✅ {fields.locationLat.toFixed(5)}, {fields.locationLng.toFixed(5)}
            </span>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label className={styles.editLabel}>Bairro</label>
              <input type="text" value={fields.bairro} onChange={set('bairro')} className={styles.editInput} />
            </div>
            <div style={{ flex: 1 }}>
              <label className={styles.editLabel}>Zona</label>
              <select value={fields.zona} onChange={set('zona')} className={styles.editInput}>
                <option value="">Selecione</option>
                <option value="Sul">Zona Sul</option>
                <option value="Norte">Zona Norte</option>
                <option value="Oeste">Zona Oeste</option>
                <option value="Centro">Centro</option>
              </select>
            </div>
          </div>

          <label className={styles.editLabel}>Privacidade</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['public', 'private'].map(p => (
              <button
                key={p}
                onClick={() => setFields(prev => ({ ...prev, privacy: p }))}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: fields.privacy === p ? 'var(--color-brand-dim)' : 'var(--color-surface-2)',
                  color: fields.privacy === p ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
                  border: `0.5px solid ${fields.privacy === p ? 'var(--color-brand)' : 'var(--color-border)'}`,
                }}
              >
                {p === 'public' ? '🌐 Público' : '🔒 Privado'}
              </button>
            ))}
          </div>

          {fields.privacy === 'private' && (
            <>
              <label className={styles.editLabel}>Aprovação de entrada</label>
              <button
                onClick={() => setFields(prev => ({ ...prev, approvalRequired: !prev.approvalRequired }))}
                style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: fields.approvalRequired ? 'var(--color-brand-dim)' : 'var(--color-surface-2)',
                  color: fields.approvalRequired ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
                  border: `0.5px solid ${fields.approvalRequired ? 'var(--color-brand)' : 'var(--color-border)'}`,
                  textAlign: 'left',
                }}
              >
                {fields.approvalRequired ? '✅ Aprovação manual' : '⚡ Entrada automática'}
              </button>
            </>
          )}

          <label className={styles.editLabel}>Tipo do grupo</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'misto',      label: '🏟️ Misto' },
              { id: 'organizada', label: '🔥 Organizada' },
              { id: 'familia',    label: '👪 Família' },
              { id: 'feminino',   label: '♀️ Feminino' },
              { id: 'jovem',      label: '⚡ Jovem' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFields(prev => ({ ...prev, groupType: t.id }))}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: fields.groupType === t.id ? 'var(--color-brand-dim)' : 'var(--color-surface-2)',
                  color: fields.groupType === t.id ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
                  border: `0.5px solid ${fields.groupType === t.id ? 'var(--color-brand)' : 'var(--color-border)'}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function OptionsMenu({ onClose, onInvite, onMembers, onEdit, onLeave, isLeader, pendingCount, membersCount }) {
  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.menuSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        {[
          ...(isLeader && pendingCount > 0 ? [{ icon: '🔔', label: `Solicitações (${pendingCount})`, action: onMembers, highlight: true }] : []),
          { icon: '👥', label: `Ver membros (${membersCount})`, action: onMembers },
          { icon: '🔗', label: 'Convidar pessoas', action: onInvite  },
          ...(isLeader ? [{ icon: '✏️', label: 'Editar grupo', action: onEdit }] : []),
          { icon: '🚪', label: 'Sair do grupo',    action: onLeave, danger: true },
        ].map(item => (
          <button
            key={item.label}
            className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ''} ${item.highlight ? styles.menuItemHighlight : ''}`}
            onClick={() => { onClose(); item.action?.() }}
          >
            <span className={styles.menuItemIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {item.highlight && <span className={styles.menuBadge}>{pendingCount}</span>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Modal de membros ─────────────────────────────────────────────────────────
function MembersModal({ members, pendingMembers, leaderId, isLeader, onClose, onInvite, onApprove, onReject, actionLoading }) {
  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.membersSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        <div className={styles.membersHeader}>
          <span className={styles.membersTitle}>Membros ({members.length})</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Pending members (leader only) */}
        {isLeader && pendingMembers?.length > 0 && (
          <div className={styles.pendingSection}>
            <span className={styles.pendingSectionTitle}>⏳ Pendentes ({pendingMembers.length})</span>
            {pendingMembers.map(p => (
              <div key={String(p.user)} className={styles.pendingRow}>
                <div className={styles.memberAvatar} style={{ background: avatarColor(p.name || '?') }}>
                  {initials(p.name || '?')}
                </div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>{p.name}</span>
                  <span className={styles.pendingStatus}>
                    {p.status === 'pendingApproval' ? '🔔 Aguardando aprovação' : '💳 Aguardando pagamento'}
                  </span>
                </div>
                {p.status === 'pendingApproval' && (
                  <div className={styles.pendingActions}>
                    <button className={styles.rejectBtn} onClick={() => onReject(p.user)} disabled={actionLoading}>✕</button>
                    <button className={styles.approveBtn} onClick={() => onApprove(p.user)} disabled={actionLoading}>✓</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={styles.membersList}>
          {members.map(m => (
            <div key={m._id} className={styles.memberRow}>
              <div className={styles.memberAvatar} style={{ background: avatarColor(m.name) }}>
                {initials(m.name)}
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{m.name}</span>
                <span className={styles.memberHandle}>@{m.handle}</span>
              </div>
              {m._id === leaderId && (
                <span className={styles.leaderBadge}>👑 Líder</span>
              )}
            </div>
          ))}
        </div>
        <button className={styles.inviteBtn} onClick={onInvite} style={{ margin: '12px 16px' }}>
          + Adicionar membro
        </button>
      </div>
    </div>
  )
}

// ─── Modal de convite ─────────────────────────────────────────────────────────
function InviteModal({ grupo, onClose }) {
  const toast = useToast()
  const link = grupo?.code
    ? `https://torcidamatch.vercel.app/join/${grupo.code}`
    : `https://torcidamatch.vercel.app/grupos/entrar/${grupo?._id}`

  const copy = () => {
    navigator.clipboard?.writeText(link)
    toast.success('Link copiado!')
    onClose()
  }

  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.inviteSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        <p className={styles.inviteTitle}>Convidar para {grupo?.name}</p>
        <p className={styles.inviteSub}>Compartilhe o link abaixo</p>
        <div className={styles.inviteLink}>
          <span className={styles.inviteLinkText}>{link}</span>
        </div>
        <button className={styles.btnPrimary} onClick={copy}>
          📋 Copiar link
        </button>
        <button className={styles.btnSecondary} onClick={onClose}>Fechar</button>
      </div>
    </div>
  )
}

// ─── Vista de visitante (não-membro) ─────────────────────────────────────────
function GuestView({ grupo, members, joinStatus, onJoin }) {
  const isPrivate = grupo?.privacy === 'private'

  const typeLabels = {
    misto:      '🏟️ Misto',
    organizada: '🔥 Organizada',
    familia:    '👪 Família',
    feminino:   '♀️ Feminino',
    jovem:      '⚡ Jovem',
  }

  return (
    <div className={styles.guestWrap}>
      {/* Info scrollável */}
      <div className={styles.guestScroll}>

        {/* Badges de tipo / privacidade */}
        <div className={styles.guestBadges}>
          <span className={`${styles.guestBadge} ${isPrivate ? styles.guestBadgePrivate : styles.guestBadgePublic}`}>
            {isPrivate ? (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Privado</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg> Público</>
            )}
          </span>
          {grupo?.groupType && (
            <span className={styles.guestBadge}>{typeLabels[grupo.groupType] ?? grupo.groupType}</span>
          )}
          {grupo?.zona && (
            <span className={styles.guestBadge}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {grupo.zona}
            </span>
          )}
        </div>

        {/* Estatísticas */}
        <div className={styles.guestStats}>
          <div className={styles.guestStat}>
            <span className={styles.guestStatVal}>{members.length || grupo?.membersCount || '—'}</span>
            <span className={styles.guestStatLabel}>membros</span>
          </div>
          {grupo?.rating > 0 && (
            <div className={styles.guestStat}>
              <span className={styles.guestStatVal}>⭐ {Number(grupo.rating).toFixed(1)}</span>
              <span className={styles.guestStatLabel}>avaliação</span>
            </div>
          )}
          {grupo?.team && (
            <div className={styles.guestStat}>
              <span className={styles.guestStatVal}>{grupo.team}</span>
              <span className={styles.guestStatLabel}>time</span>
            </div>
          )}
        </div>

        {/* Descrição */}
        {grupo?.description && (
          <div className={styles.guestSection}>
            <span className={styles.guestSectionLabel}>Sobre o grupo</span>
            <p className={styles.guestDescription}>{grupo.description}</p>
          </div>
        )}

        {/* Ponto de encontro */}
        {grupo?.meetPoint && (
          <div className={styles.guestMeet}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{grupo.meetPoint}</span>
          </div>
        )}

        {/* Preview dos membros */}
        {members.length > 0 && (
          <div className={styles.guestSection}>
            <span className={styles.guestSectionLabel}>Membros</span>
            <div className={styles.guestMembersRow}>
              {members.slice(0, 5).map(m => (
                <div
                  key={m._id}
                  className={styles.guestMemberAvatar}
                  style={{ background: avatarColor(m.name) }}
                  title={m.name}
                >
                  {initials(m.name)}
                </div>
              ))}
              {members.length > 5 && (
                <div className={styles.guestMemberMore}>+{members.length - 5}</div>
              )}
            </div>
          </div>
        )}

        {/* Área de chat bloqueada */}
        <div className={styles.lockedChat}>
          <div className={styles.lockedBubble} style={{ alignSelf: 'flex-start', width: '60%' }}/>
          <div className={styles.lockedBubble} style={{ alignSelf: 'flex-end',   width: '45%' }}/>
          <div className={styles.lockedBubble} style={{ alignSelf: 'flex-start', width: '70%' }}/>
          <div className={styles.lockedOverlay}>
            <div className={styles.lockIconWrap}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <p className={styles.lockTitle}>Chat exclusivo para membros</p>
            <p className={styles.lockSub}>Entre no grupo para conversar com a torcida</p>
          </div>
        </div>
      </div>

      {/* CTA fixo no rodapé */}
      <div className={styles.joinBar}>
        {joinStatus === 'pending' ? (
          <div className={styles.joinPendingBox}>
            <div className={styles.joinPendingIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <div>
              <p className={styles.joinPendingTitle}>Solicitação enviada!</p>
              <p className={styles.joinPendingSub}>Aguardando aprovação do líder</p>
            </div>
          </div>
        ) : (
          <>
            {isPrivate && grupo?.membershipFee > 0 && (
              <p className={styles.joinPrice}>
                R$ {(grupo.membershipFee / 100).toFixed(2).replace('.', ',')}<span>/mês</span>
              </p>
            )}
            <button
              className={styles.joinBtn}
              onClick={onJoin}
              disabled={joinStatus === 'requesting'}
            >
              {joinStatus === 'requesting' ? (
                <><span className={styles.joinSpinner}/> Aguarde...</>
              ) : joinStatus === 'pendingPayment' ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pagar mensalidade</>
              ) : isPrivate ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Assinar grupo</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg> Entrar no Grupo</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function GrupoScreen() {
  const { id }       = useParams()
  const location     = useLocation()
  const navigate     = useNavigate()
  const { user, logout } = useUser()
  const toast        = useToast()

  const [grupo,      setGrupo]      = useState(location.state?.grupo || null)
  const [messages,   setMessages]   = useState([])
  const [members,    setMembers]    = useState([])
  const [text,       setText]       = useState('')
  const [loading,    setLoading]    = useState(true)
  const [sending,    setSending]    = useState(false)
  const [showMenu,   setShowMenu]   = useState(false)
  const [showMembers,setShowMembers]= useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showEdit,   setShowEdit]   = useState(false)
  const [editLoading,setEditLoading]= useState(false)
  const [wsReady,    setWsReady]    = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [joinStatus, setJoinStatus] = useState(null) // null | 'requesting' | 'pending' | 'pendingPayment'
  const [showPayment, setShowPayment] = useState(false)

  const bottomRef = useRef(null)
  const wsRef     = useRef(null)
  const token     = user?.token

  const isLeader = grupo?.leader === user?.id || grupo?.leader?._id === user?.id

  // Verifica se o usuário logado é membro (ou líder)
  const isMember = isLeader || members.some(m =>
    (m._id && m._id === user?.id) || m === user?.id
  )

  // ── Carregar grupo e mensagens ─────────────────────────────────────────────
  const loadGrupo = useCallback(async () => {
    if (!id) return
    try {
      const [gRes, mRes, memRes] = await Promise.all([
        fetch(`${API_URL}/grupos/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${API_URL}/grupos/${id}/mensagens`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${API_URL}/grupos/${id}/membros`,   { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      ])
      if (gRes.ok)   { const d = await gRes.json();   setGrupo(d.group) }
      if (mRes.ok)   { const d = await mRes.json();   setMessages(d.messages || []) }
      if (memRes.ok) { const d = await memRes.json(); setMembers(d.members || []) }
    } catch (err) {
      console.error('[GrupoScreen] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => { loadGrupo() }, [loadGrupo])

  // ── Detectar solicitação pendente já existente ────────────────────────────
  useEffect(() => {
    if (!grupo || !user) return
    const pendingEntry = grupo.pendingMembers?.find(
      p => String(p.user) === String(user.id)
    )
    if (pendingEntry) {
      if (pendingEntry.status === 'pendingPayment') {
        setJoinStatus('pendingPayment')
      } else {
        setJoinStatus('pending')
      }
    }
  }, [grupo, user])

  // ── Entrar no grupo ────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!user) {
      toast.error('Faça login para entrar no grupo')
      return
    }

    // Se já está em pendingPayment (voltou para a tela), abrir modal direto
    if (joinStatus === 'pendingPayment') {
      setShowPayment(true)
      return
    }

    setJoinStatus('requesting')
    try {
      const res = await fetch(`${API_URL}/grupos/${id}/entrar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        if (data.status === 'pendingApproval') {
          setJoinStatus('pending')
          toast.success(data.message || 'Solicitação enviada ao líder!')
        } else if (data.status === 'pendingPayment') {
          setJoinStatus('pendingPayment')
          setShowPayment(true)
        } else {
          toast.success(data.message || 'Você entrou no grupo!')
          setJoinStatus(null)
          await loadGrupo()
        }
      } else if (res.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.')
        logout()
        navigate(ROUTES.LOGIN)
        return
      } else {
        toast.error(data.error || 'Erro ao solicitar entrada')
        setJoinStatus(null)
      }
    } catch {
      toast.error('Erro de conexão')
      setJoinStatus(null)
    }
  }

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    // 🔒 Enviar token JWT na conexão WebSocket para autenticação
    const ws = new WebSocket(`${WS_URL}/ws/grupos/${id}${token ? `?token=${token}` : ''}`)
    wsRef.current = ws

    ws.onopen  = () => setWsReady(true)
    ws.onclose = () => setWsReady(false)
    ws.onerror = () => setWsReady(false)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'message') {
          setMessages(prev => [...prev, msg.data])
        }
        if (msg.type === 'member_joined') {
          setMembers(prev => [...prev, msg.data])
          setMessages(prev => [...prev, {
            _id: Date.now(),
            type: 'system',
            text: `${msg.data.name} entrou no grupo`,
            createdAt: new Date().toISOString(),
          }])
        }
      } catch {}
    }

    return () => ws.close()
  }, [id, token]) // 🔒 Reconectar se o token mudar

  // ── Auto scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Enviar mensagem ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    // Otimistic update
    const optimistic = {
      _id:        `opt-${Date.now()}`,
      text:       trimmed,
      senderId:   user?.id,
      senderName: user?.name,
      createdAt:  new Date().toISOString(),
      type:       'text',
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    setSending(true)

    try {
      const res = await fetch(`${API_URL}/grupos/${id}/mensagens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: trimmed }),
      })
      if (!res.ok) {
        setMessages(prev => prev.filter(m => m._id !== optimistic._id))
        toast.error('Erro ao enviar mensagem')
      }
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id))
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ── Sair do grupo ──────────────────────────────────────────────────────────
  const leaveGroup = async () => {
    if (!confirm('Tem certeza que quer sair do grupo?')) return
    try {
      await fetch(`${API_URL}/grupos/${id}/sair`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      toast.success('Você saiu do grupo')
      navigate(ROUTES.GRUPOS)
    } catch {
      toast.error('Erro ao sair do grupo')
    }
  }

  // ── Editar grupo (líder) ──────────────────────────────────────────────────
  const handleEditGroup = async (updates) => {
    setEditLoading(true)
    try {
      const res = await fetch(`${API_URL}/grupos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Grupo atualizado!')
        setGrupo(data.group)
        setShowEdit(false)
      } else {
        toast.error(data.error)
      }
    } catch { toast.error('Erro de conexão') } finally { setEditLoading(false) }
  }

  // ── Aprovar/rejeitar membro (líder) ───────────────────────────────────────
  const handleApproveMember = async (userId) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/grupos/${id}/approve/${userId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); loadGrupo() }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setActionLoading(false) }
  }

  const handleRejectMember = async (userId) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/grupos/${id}/reject/${userId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); loadGrupo() }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setActionLoading(false) }
  }

  if (loading) return (
    <div className={styles.screen}>
      <div className={styles.skeletonHeader}/>
      <div className={styles.skeletonChat}>
        {[1,2,3].map(i => <div key={i} className={styles.skeletonBubble} style={{ width: `${50+i*12}%`, alignSelf: i%2 ? 'flex-end' : 'flex-start' }}/>)}
      </div>
    </div>
  )

  return (
    <div className={styles.screen}>
      {/* Header — sempre visível */}
      <GrupoHeader
        grupo={grupo}
        membersCount={members.length || 1}
        onBack={() => navigate(ROUTES.GRUPOS)}
        onMenu={() => isMember ? setShowMenu(true) : null}
      />

      {isMember ? (
        <>
          {/* Status WS */}
          {!wsReady && (
            <div className={styles.wsStatus}>
              <span className={styles.wsDot}/>
              Conectando ao chat...
            </div>
          )}

          {/* Área de mensagens */}
          <div className={styles.chatArea}>
            {messages.length === 0
              ? <EmptyChat onInvite={() => setShowInvite(true)} />
              : messages.map(msg => (
                  <MessageBubble
                    key={msg._id}
                    msg={msg}
                    isOwn={msg.senderId === user?.id}
                  />
                ))
            }
            <div ref={bottomRef}/>
          </div>

          {/* Campo de digitação */}
          <div className={styles.inputArea}>
            <textarea
              className={styles.msgInput}
              placeholder="Digite sua mensagem..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              aria-label="Digite sua mensagem"
            />
            <button
              className={`${styles.sendBtn} ${text.trim() ? styles.sendBtnActive : ''}`}
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              aria-label="Enviar mensagem"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            </button>
          </div>
        </>
      ) : (
        /* Vista de visitante */
        <GuestView
          grupo={grupo}
          members={members}
          joinStatus={joinStatus}
          onJoin={handleJoin}
        />
      )}

      {/* Modais — somente para membros */}
      {isMember && showMenu && (
        <OptionsMenu
          isLeader={isLeader}
          pendingCount={grupo?.pendingMembers?.length || 0}
          membersCount={members.length}
          onClose={() => setShowMenu(false)}
          onInvite={() => { setShowMenu(false); setShowInvite(true) }}
          onMembers={() => { setShowMenu(false); setShowMembers(true) }}
          onEdit={() => { setShowMenu(false); setShowEdit(true) }}
          onLeave={leaveGroup}
        />
      )}
      {showMembers && (
        <MembersModal
          members={members}
          pendingMembers={grupo?.pendingMembers || []}
          leaderId={grupo?.leader?._id || grupo?.leader}
          isLeader={isLeader}
          onClose={() => setShowMembers(false)}
          onInvite={() => { setShowMembers(false); setShowInvite(true) }}
          onApprove={handleApproveMember}
          onReject={handleRejectMember}
          actionLoading={actionLoading}
        />
      )}
      {showInvite && (
        <InviteModal
          grupo={grupo}
          onClose={() => setShowInvite(false)}
        />
      )}
      {showEdit && grupo && (
        <EditGroupModal
          grupo={grupo}
          onSave={handleEditGroup}
          onClose={() => setShowEdit(false)}
          loading={editLoading}
        />
      )}

      {/* Modal de pagamento Stripe */}
      {showPayment && grupo && (
        <PaymentModal
          type="group"
          targetId={id}
          description={`Assinatura · ${grupo.name}`}
          visible={showPayment}
          onClose={() => {
            setShowPayment(false)
            if (joinStatus === 'pendingPayment') setJoinStatus(null)
          }}
          onSuccess={() => {
            setShowPayment(false)
            setJoinStatus(null)
            toast.success('Pagamento confirmado! Bem-vindo ao grupo.')
            loadGrupo()
          }}
        />
      )}
    </div>
  )
}
