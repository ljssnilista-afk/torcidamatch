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
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/>
      </svg>
      <span className={styles.text}>
        Dia de jogo! <strong>Vamos Comigo!</strong> Veja ofertas perto de você
      </span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </button>
  )
}
