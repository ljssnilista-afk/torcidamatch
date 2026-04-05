import { useState, useEffect, memo } from 'react'
import styles from './StatusBar.module.css'

function getTime() {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const StatusBar = memo(function StatusBar() {
  const [time, setTime] = useState(getTime)

  useEffect(() => {
    const now = new Date()
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    let interval
    const startInterval = () => {
      setTime(getTime())
      interval = setInterval(() => setTime(getTime()), 60_000)
    }
    const timeout = setTimeout(startInterval, msUntilNextMinute)
    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [])

  return (
    <div className={styles.statusBar} aria-hidden="true">
      <span className={styles.time}>{time}</span>
      <div className={styles.icons}>
        <svg width="15" height="12" viewBox="0 0 16 12" fill="none">
          <rect x="0" y="4" width="3" height="8" rx="1" fill="#fff" />
          <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#fff" />
          <rect x="9" y="1" width="3" height="11" rx="1" fill="#fff" />
          <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="rgba(255,255,255,0.3)" />
        </svg>
        <svg width="24" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="20" height="11" rx="3.5" stroke="rgba(255,255,255,0.5)" />
          <rect x="2" y="2" width="13" height="8" rx="2" fill="#fff" />
          <path d="M22 4v4c1-.5 1.5-1.2 1.5-2S23 4.5 22 4z" fill="rgba(255,255,255,0.4)" />
        </svg>
      </div>
    </div>
  )
})

export default StatusBar

