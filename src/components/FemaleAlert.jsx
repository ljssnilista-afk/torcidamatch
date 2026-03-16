import styles from './FemaleAlert.module.css'

export default function FemaleAlert({ alert, onCreate }) {
  return (
    <section className={styles.card} aria-labelledby="fem-title">
      <div className={styles.row}>
        <div className={styles.icon} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
        <div>
          <p className={styles.title} id="fem-title">{alert.title}</p>
          <p className={styles.description}>{alert.description}</p>
        </div>
      </div>
      <button
        className={styles.btn}
        onClick={() => onCreate?.(alert)}
        aria-label={alert.cta}
      >
        {alert.cta}
      </button>
    </section>
  )
}
