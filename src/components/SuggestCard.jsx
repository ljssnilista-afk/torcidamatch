import styles from './SuggestCard.module.css'

const VARIANT_STYLES = {
  green: {
    avatar: { background: 'rgba(34,197,94,0.12)', color: '#22C55E' },
    tag: { background: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    audience: { background: 'rgba(255,200,50,0.1)', color: '#f0b820' },
    btn: {},
  },
  feminine: {
    avatar: { background: 'rgba(192,96,192,0.1)', color: '#C060C0' },
    tag: { background: 'rgba(192,96,192,0.1)', color: '#C060C0' },
    audience: { background: 'rgba(192,96,192,0.08)', color: '#C060C0' },
    btn: { color: '#C060C0', borderColor: 'rgba(192,96,192,0.3)' },
  },
  silver: {
    avatar: { background: 'rgba(200,200,200,0.08)', color: '#C8C8C8' },
    tag: { background: 'rgba(212,175,55,0.1)', color: '#D4AF37' },
    audience: { background: 'rgba(200,200,200,0.06)', color: '#C8C8C8' },
    btn: {},
  },
}

export default function SuggestCard({ suggestion, onCreate }) {
  const v = VARIANT_STYLES[suggestion.variant] ?? VARIANT_STYLES.green

  return (
    <div className={styles.card} role="listitem">
      <div className={styles.top}>
        <div className={styles.avatar} style={v.avatar}>
          {suggestion.initials}
        </div>
        <span className={styles.tag} style={v.tag}>
          {suggestion.tag}
        </span>
      </div>
      <p className={styles.name}>{suggestion.name}</p>
      <p className={styles.location}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {suggestion.location}
      </p>
      <span className={styles.audience} style={v.audience}>
        {suggestion.audience}
      </span>
      <button
        className={styles.btn}
        style={v.btn}
        onClick={() => onCreate?.(suggestion)}
        aria-label={`Criar grupo ${suggestion.name}`}
      >
        Criar grupo
      </button>
    </div>
  )
}
