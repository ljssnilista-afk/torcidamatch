import { memo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../utils/constants'
import styles from './BottomNav.module.css'

const NAV_ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  bus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8l5 3-5 3" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
}

const BottomNav = memo(function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.route
        return (
          <button
            key={item.id}
            className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => navigate(item.route)}
          >
            <span className={styles.icon}>{NAV_ICONS[item.icon]}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
})

export default BottomNav

