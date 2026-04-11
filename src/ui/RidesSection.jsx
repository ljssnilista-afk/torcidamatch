import { memo } from 'react'
import styles from './RidesSection.module.css'

const VEHICLE_ICONS = {
  ônibus: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8l5 3-5 3" />
    </svg>
  ),
  van: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1" y="8" width="18" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2" />
      <circle cx="5.5" cy="18.5" r="1.5" /><circle cx="14.5" cy="18.5" r="1.5" />
    </svg>
  ),
  carro: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v3" />
      <rect x="9" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    </svg>
  ),
}

function RideCard({ ride }) {
  return (
    <div
      className={styles.card}
      role="listitem"
      aria-label={`${ride.name}, ${ride.vehicle}, ${ride.price}`}
    >
      <div className={styles.top}>
        <div className={styles.avatar} style={ride.avatarStyle}>
          {ride.initials}
        </div>
        <span className={styles.name}>{ride.name}</span>
      </div>

      <div className={styles.vehicle}>
        <span aria-hidden="true">{VEHICLE_ICONS[ride.vehicle]}</span>
        <span>{ride.vehicle}</span>
      </div>

      <p className={styles.price}>{ride.price}</p>
      <p className={styles.location}>{ride.location}</p>

      {ride.badge === 'oficial' && (
        <div className={styles.badgeOficial} aria-label="Caravana oficial">
          <span>★ Oficial</span>
        </div>
      )}
      {ride.badge === 'vagas' && (
        <div className={styles.badgeVagas}>
          <span>{ride.badgeText}</span>
        </div>
      )}
    </div>
  )
}

export default memo(function RidesSection({ rides, title, onViewAll }) {
  return (
    <section className={styles.section} aria-labelledby="rides-title">
      <div className={styles.header}>
        <div>
          <h3 className={styles.title} id="rides-title">{title}</h3>
        </div>
        <button className={styles.link} onClick={onViewAll}>
          Ver todas
        </button>
      </div>
      <div className={styles.scroll} role="list">
        {rides.map((ride) => (
          <RideCard key={ride.id} ride={ride} />
        ))}
      </div>
    </section>
  )
})
