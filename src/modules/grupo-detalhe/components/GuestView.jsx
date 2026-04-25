import { avatarColor, initials } from './helpers'
import styles from '../GrupoScreen.module.css'

const TYPE_LABELS = {
  misto:      'Misto',
  organizada: 'Organizada',
  familia:    'Família',
  feminino:   'Feminino',
  jovem:      'Jovem',
}

export default function GuestView({ grupo, members, joinStatus, onJoin }) {
  const isPrivate = grupo?.privacy === 'private'

  return (
    <div className={styles.guestWrap}>
      <div className={styles.guestScroll}>

        <div className={styles.guestBadges}>
          <span className={`${styles.guestBadge} ${isPrivate ? styles.guestBadgePrivate : styles.guestBadgePublic}`}>
            {isPrivate ? 'Privado' : 'Público'}
          </span>
          {grupo?.groupType && (
            <span className={styles.guestBadge}>{TYPE_LABELS[grupo.groupType] ?? grupo.groupType}</span>
          )}
          {grupo?.zona && <span className={styles.guestBadge}>{grupo.zona}</span>}
        </div>

        <div className={styles.guestStats}>
          <div className={styles.guestStat}>
            <span className={styles.guestStatVal}>{members.length || grupo?.membersCount || '—'}</span>
            <span className={styles.guestStatLabel}>membros</span>
          </div>
          {grupo?.rating > 0 && (
            <div className={styles.guestStat}>
              <span className={styles.guestStatVal}>{Number(grupo.rating).toFixed(1)}</span>
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

        {grupo?.description && (
          <div className={styles.guestSection}>
            <span className={styles.guestSectionLabel}>Sobre o grupo</span>
            <p className={styles.guestDescription}>{grupo.description}</p>
          </div>
        )}

        {grupo?.meetPoint && (
          <div className={styles.guestMeet}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{grupo.meetPoint}</span>
          </div>
        )}

        {members.length > 0 && (
          <div className={styles.guestSection}>
            <span className={styles.guestSectionLabel}>Membros</span>
            <div className={styles.guestMembersRow}>
              {members.slice(0, 5).map(m => (
                <div key={m._id} className={styles.guestMemberAvatar}
                  style={{ background: avatarColor(m.name) }} title={m.name}>
                  {initials(m.name)}
                </div>
              ))}
              {members.length > 5 && <div className={styles.guestMemberMore}>+{members.length - 5}</div>}
            </div>
          </div>
        )}

        <div className={styles.lockedChat}>
          <div className={styles.lockedBubble} style={{ alignSelf: 'flex-start', width: '60%' }}/>
          <div className={styles.lockedBubble} style={{ alignSelf: 'flex-end', width: '45%' }}/>
          <div className={styles.lockedBubble} style={{ alignSelf: 'flex-start', width: '70%' }}/>
          <div className={styles.lockedOverlay}>
            <div className={styles.lockIconWrap}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <p className={styles.lockTitle}>Chat exclusivo para membros</p>
            <p className={styles.lockSub}>Entre no grupo para conversar com a torcida</p>
          </div>
        </div>
      </div>

      <div className={styles.joinBar}>
        {joinStatus === 'pending' ? (
          <div className={styles.joinPendingBox}>
            <div className={styles.joinPendingIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
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
            <button className={styles.joinBtn} onClick={onJoin} disabled={joinStatus === 'requesting'}>
              {joinStatus === 'requesting' ? 'Aguarde...'
               : joinStatus === 'pendingPayment' ? 'Pagar mensalidade'
               : isPrivate && grupo?.membershipFee > 0
                 ? `Entrar (R$ ${(grupo.membershipFee / 100).toFixed(2).replace('.', ',')}/mês)`
                 : 'Solicitar entrada'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
