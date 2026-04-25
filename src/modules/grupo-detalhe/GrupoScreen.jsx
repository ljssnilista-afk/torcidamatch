import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useUser } from '@shared/contexts/UserContext'
import { useToast } from '@shared/contexts/ToastContext'
import { ROUTES } from '@shared/utils/constants'
import { API_URL, WS_URL } from '@shared/services/api'
import PaymentModal from '@shared/ui/PaymentModal'
import GrupoHeader from './components/GrupoHeader'
import { MessageBubble, EmptyChat } from './components/MessageBubble'
import EditGroupModal from './components/EditGroupModal'
import OptionsMenu from './components/OptionsMenu'
import MembersModal from './components/MembersModal'
import InviteModal from './components/InviteModal'
import GuestView from './components/GuestView'
import styles from './GrupoScreen.module.css'

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
  const [joinStatus, setJoinStatus] = useState(null)
  const [showPayment, setShowPayment] = useState(false)

  const bottomRef = useRef(null)
  const wsRef     = useRef(null)
  const token     = user?.token

  const isLeader = grupo?.leader === user?.id || grupo?.leader?._id === user?.id
  const isMember = isLeader || members.some(m =>
    (m._id && m._id === user?.id) || m === user?.id
  )

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

  useEffect(() => {
    if (!grupo || !user) return
    const pendingEntry = grupo.pendingMembers?.find(p => String(p.user) === String(user.id))
    if (pendingEntry) {
      setJoinStatus(pendingEntry.status === 'pendingPayment' ? 'pendingPayment' : 'pending')
    }
  }, [grupo, user])

  const handleJoin = async () => {
    if (!user) { toast.error('Faça login para entrar no grupo'); return }
    if (joinStatus === 'pendingPayment') { navigate(`/grupos/${id}/assinar`); return }
    setJoinStatus('requesting')
    try {
      const res = await fetch(`${API_URL}/grupos/${id}/entrar`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        if (data.status === 'pendingApproval') { setJoinStatus('pending'); toast.success(data.message || 'Solicitação enviada ao líder!') }
        else if (data.status === 'pendingPayment') { setJoinStatus('pendingPayment'); navigate(`/grupos/${id}/assinar`) }
        else { toast.success(data.message || 'Você entrou no grupo!'); setJoinStatus(null); await loadGrupo() }
      } else if (res.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.'); logout(); navigate(ROUTES.LOGIN)
      } else { toast.error(data.error || 'Erro ao solicitar entrada'); setJoinStatus(null) }
    } catch { toast.error('Erro de conexão'); setJoinStatus(null) }
  }

  useEffect(() => {
    if (!id) return
    const ws = new WebSocket(`${WS_URL}/ws/grupos/${id}${token ? `?token=${token}` : ''}`)
    wsRef.current = ws
    ws.onopen  = () => setWsReady(true)
    ws.onclose = () => setWsReady(false)
    ws.onerror = () => setWsReady(false)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'message') setMessages(prev => [...prev, msg.data])
        if (msg.type === 'member_joined') {
          setMembers(prev => [...prev, msg.data])
          setMessages(prev => [...prev, { _id: Date.now(), type: 'system', text: `${msg.data.name} entrou no grupo`, createdAt: new Date().toISOString() }])
        }
      } catch {}
    }
    return () => ws.close()
  }, [id, token])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    const optimistic = { _id: `opt-${Date.now()}`, text: trimmed, senderId: user?.id, senderName: user?.name, createdAt: new Date().toISOString(), type: 'text' }
    setMessages(prev => [...prev, optimistic])
    setText('')
    setSending(true)
    try {
      const res = await fetch(`${API_URL}/grupos/${id}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text: trimmed }),
      })
      if (!res.ok) { setMessages(prev => prev.filter(m => m._id !== optimistic._id)); toast.error('Erro ao enviar mensagem') }
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id)); toast.error('Erro ao enviar mensagem')
    } finally { setSending(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const leaveGroup = async () => {
    if (!confirm('Tem certeza que quer sair do grupo?')) return
    try {
      await fetch(`${API_URL}/grupos/${id}/sair`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      toast.success('Você saiu do grupo')
      navigate(ROUTES.GRUPOS)
    } catch { toast.error('Erro ao sair do grupo') }
  }

  const handleEditGroup = async (updates) => {
    setEditLoading(true)
    try {
      const res = await fetch(`${API_URL}/grupos/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message || 'Grupo atualizado!'); setGrupo(data.group); setShowEdit(false) }
      else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setEditLoading(false) }
  }

  const handleApproveMember = async (userId) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/grupos/${id}/approve/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); loadGrupo() } else toast.error(data.error)
    } catch { toast.error('Erro de conexão') } finally { setActionLoading(false) }
  }

  const handleRejectMember = async (userId) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/grupos/${id}/reject/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); loadGrupo() } else toast.error(data.error)
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
      <GrupoHeader
        grupo={grupo}
        membersCount={members.length || 1}
        onBack={() => navigate(ROUTES.GRUPOS)}
        onMenu={() => isMember ? setShowMenu(true) : null}
      />

      {isMember ? (
        <>
          {!wsReady && (
            <div className={styles.wsStatus}>
              <span className={styles.wsDot}/>
              Conectando ao chat...
            </div>
          )}
          <div className={styles.chatArea}>
            {messages.length === 0
              ? <EmptyChat onInvite={() => setShowInvite(true)} />
              : messages.map(msg => (
                  <MessageBubble key={msg._id} msg={msg} isOwn={msg.senderId === user?.id} />
                ))
            }
            <div ref={bottomRef}/>
          </div>
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
        <GuestView grupo={grupo} members={members} joinStatus={joinStatus} onJoin={handleJoin} />
      )}

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
      {showInvite && <InviteModal grupo={grupo} onClose={() => setShowInvite(false)} />}
      {showEdit && grupo && (
        <EditGroupModal grupo={grupo} onSave={handleEditGroup} onClose={() => setShowEdit(false)} loading={editLoading} />
      )}
      {showPayment && grupo && (
        <PaymentModal
          type="group" targetId={id}
          description={`Assinatura · ${grupo.name}`}
          visible={showPayment}
          onClose={() => { setShowPayment(false); if (joinStatus === 'pendingPayment') setJoinStatus(null) }}
          onSuccess={() => { setShowPayment(false); setJoinStatus(null); toast.success('Pagamento confirmado! Bem-vindo ao grupo.'); loadGrupo() }}
        />
      )}
    </div>
  )
}
