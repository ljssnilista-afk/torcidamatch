import { useEffect, useRef } from 'react'
import { drawChampionBanner } from '../utils/canvasHelpers'
import styles from './ChampionBanner.module.css'

export default function ChampionBanner({ info }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => drawChampionBanner(canvasRef.current))
    )
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={styles.banner}
      role="button"
      tabIndex={0}
      aria-label="Botafogo Campeão da Libertadores 2024"
    >
      <canvas ref={canvasRef} className={styles.canvas} width={362} height={80} />
      <div className={styles.content}>
        <div className={styles.star} aria-hidden="true">
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <circle cx="21" cy="21" r="20" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8" />
            <polygon points="21,6 24.5,16.5 35.5,16.5 26.5,23 30,33.5 21,27 12,33.5 15.5,23 6.5,16.5 17.5,16.5" fill="#D4AF37" />
            <polygon points="21,9 24,17.5 33,17.5 26,22.5 28.5,31 21,26.5 13.5,31 16,22.5 9,17.5 18,17.5" fill="#F0C842" />
          </svg>
        </div>
        <div className={styles.text}>
          <p className={styles.eyebrow}>{info.eyebrow}</p>
          <p className={styles.title}>{info.title}</p>
          <p className={styles.subtitle}>{info.subtitle}</p>
        </div>
        <div className={styles.arrow} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>
  )
}

