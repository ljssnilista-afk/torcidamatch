import { useState } from 'react'
import styles from './Filters.module.css'

export default function Filters({ filters, defaultActive = filters[0]?.id, onChange }) {
  const [active, setActive] = useState(defaultActive)

  const handleClick = (id) => {
    setActive(id)
    onChange?.(id)
  }

  return (
    <nav className={styles.filterRow} aria-label="Filtrar grupos">
      {filters.map((f) => (
        <button
          key={f.id}
          className={`${styles.chip} ${active === f.id ? styles.chipActive : ''}`}
          aria-pressed={active === f.id}
          onClick={() => handleClick(f.id)}
        >
          {f.label}
        </button>
      ))}
    </nav>
  )
}
