import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../utils/constants'
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
        <img src={grupo.photo} alt={grupo.name} className={styles.headerPhoto} />
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
  })
  const [photoPreview, setPhotoPreview] = useState(grupo.photo || null)
  const [photoData, setPhotoData] = useState(null) // base64 to send
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
        canvas.width = 300
        canvas.height = 300
        const ctx = canvas.getContext('2d')
        // Center crop
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 300, 300)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
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
              <span className={styles.photoUploadHint}>JPEG ou PNG, máx 300KB</span>
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
        </div>
      </div>
    </div>
  )
}

function OptionsMenu({ onClose, onInvite, onMembers, onEdit, onLeave, isLeader }) {
  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.menuSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        {[
          { icon: '👥', label: 'Ver membros',      action: onMembers },
          { icon: '🔗', label: 'Convidar pessoas', action: onInvite  },
          ...(isLeader ? [{ icon: '✏️', label: 'Editar grupo', action: onEdit }] : []),
          { icon: '🚪', label: 'Sair do grupo',    action: onLeave, danger: true },
        ].map(item => (
          <button
            key={item.label}
            className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ''}`}
            onClick={() => { onClose(); item.action?.() }}
          >
            <span className={styles.menuItemIcon}>{item.icon}</span>
            <span>{item.label}</span>
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
function MembersModal({ members, leaderId, onClose, onInvite }) {
  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.membersSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        <div className={styles.membersHeader}>
          <span className={styles.membersTitle}>Membros ({members.length})</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
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

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function GrupoScreen() {
  const { id }       = useParams()
  const location     = useLocation()
  const navigate     = useNavigate()
  const { user }     = useUser()
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

  const bottomRef = useRef(null)
  const wsRef     = useRef(null)
  const token     = user?.token

  const isLeader = grupo?.leader === user?.id || grupo?.leader?._id === user?.id

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
      {/* Header */}
      <GrupoHeader
        grupo={grupo}
        membersCount={members.length || 1}
        onBack={() => navigate(ROUTES.GRUPOS)}
        onMenu={() => setShowMenu(true)}
      />

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

      {/* Modais */}
      {showMenu && (
        <OptionsMenu
          isLeader={isLeader}
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
          leaderId={grupo?.leader?._id || grupo?.leader}
          onClose={() => setShowMembers(false)}
          onInvite={() => { setShowMembers(false); setShowInvite(true) }}
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
    </div>
  )
}
