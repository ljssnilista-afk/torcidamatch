import styles from './NotificationBar.module.css'

export default function NotificationBar({ text, onClick }) {
  return (
    <button
      className={styles.bar}
      onClick={onClick}
      aria-label={text}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span className={styles.text}>{text}</span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </button>
  )
}
