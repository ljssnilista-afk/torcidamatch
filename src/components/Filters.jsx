import { useState } from 'react'
import styles from './Filters.module.css'

const HOME_FILTERS = [
  { id: 'todos',        label: '✦ Todos',          icon: null },
  { id: 'perto',        label: '📍 Perto de mim',  icon: null },
  { id: 'melhores',     label: '⭐ Melhores',       icon: null },
  { id: 'mais-vistos',  label: '🔥 Mais vistos',    icon: null },
  { id: 'recentes',     label: '🆕 Recentes',       icon: null },
  { id: 'feminino',     label: '♀ Feminino',        icon: null },
  { id: 'familia',      label: '👪 Família',        icon: null },
]

export default function Filters({ filters, defaultActive, onChange }) {
  const list = filters ?? HOME_FILTERS
  const [active, setActive] = useState(defaultActive ?? list[0]?.id)

  const handleClick = (id) => {
    setActive(id)
    onChange?.(id)
  }

  return (
    <nav className={styles.filterRow} aria-label="Filtrar grupos">
      {list.map((f) => (
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
