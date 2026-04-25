import { avatarColor, initials } from './helpers'
import styles from '../GrupoScreen.module.css'

export default function MembersModal({ members, pendingMembers, leaderId, isLeader, onClose, onInvite, onApprove, onReject, actionLoading }) {
  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.membersSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        <div className={styles.membersHeader}>
          <span className={styles.membersTitle}>Membros ({members.length})</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {isLeader && pendingMembers?.length > 0 && (
          <div className={styles.pendingSection}>
            <span className={styles.pendingSectionTitle}>Pendentes ({pendingMembers.length})</span>
            {pendingMembers.map(p => (
              <div key={String(p.user)} className={styles.pendingRow}>
                <div className={styles.memberAvatar} style={{ background: avatarColor(p.name || '?') }}>
                  {initials(p.name || '?')}
                </div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>{p.name}</span>
                  <span className={styles.pendingStatus}>
                    {p.status === 'pendingApproval' ? 'Aguardando aprovação' : 'Aguardando pagamento'}
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
              {m._id === leaderId && <span className={styles.leaderBadge}>Líder</span>}
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
