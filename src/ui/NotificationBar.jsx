import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../utils/constants'
import styles from './NotificationBar.module.css'

export default function NotificationBar({ text, onClick }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) onClick()
    else navigate(ROUTES.VAMOS_COMIGO)
  }

  return (
    <button
      className={styles.bar}
      onClick={handleClick}
      aria-label="Ver ofertas de caronas"
    >
      <div className={styles.pulse} aria-hidden="true"/>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon}>
        <path d="M7 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9"/>
      </svg>
      <span className={styles.text}>
        Dia de jogo! <strong>Vamos Comigo!</strong> Veja ofertas perto de você
      </span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </button>
  )
}

