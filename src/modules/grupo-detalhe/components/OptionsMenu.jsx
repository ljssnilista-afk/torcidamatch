import styles from '../GrupoScreen.module.css'

export default function OptionsMenu({ onClose, onInvite, onMembers, onEdit, onLeave, isLeader, pendingCount, membersCount }) {
  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.menuSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        {[
          ...(isLeader && pendingCount > 0 ? [{ icon: '\ud83d\udd14', label: `Solicitações (${pendingCount})`, action: onMembers, highlight: true }] : []),
          { icon: '\ud83d\udc65', label: `Ver membros (${membersCount})`, action: onMembers },
          { icon: '\ud83d\udd17', label: 'Convidar pessoas', action: onInvite  },
          ...(isLeader ? [{ icon: '\u270f\ufe0f', label: 'Editar grupo', action: onEdit }] : []),
          { icon: '\ud83d\udeaa', label: 'Sair do grupo', action: onLeave, danger: true },
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
