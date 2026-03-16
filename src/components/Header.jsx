import { memo, useState, useRef, useEffect } from 'react'
import styles from './Header.module.css'

function Header({ onSearch, onNotification }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  // Foca o input assim que expande
  useEffect(() => {
    if (searchOpen) {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => inputRef.current?.focus())
      )
      return () => cancelAnimationFrame(raf)
    }
  }, [searchOpen])

  const handleOpen = () => setSearchOpen(true)

  const handleClose = () => {
    setSearchOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose()
    if (e.key === 'Enter') onSearch?.(query)
  }

  return (
    <header className={styles.header}>
      {searchOpen ? (
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 3.5 3.5" />
          </svg>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="search"
            placeholder="Buscar grupos, caronas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Campo de busca"
          />
          <button
            className={styles.searchCancelBtn}
            onClick={handleClose}
            aria-label="Fechar busca"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <>
          <div className={styles.logo} aria-label="TorcidaMatch">
            <span className={styles.logoName}>Torcida<em>Match</em></span>
          </div>
          <div className={styles.actions}>
            <button className={styles.iconBtn} aria-label="Buscar grupos e caronas" onClick={handleOpen}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 3.5 3.5" />
              </svg>
            </button>
            <button className={styles.iconBtn} aria-label="Notificações — 1 nova" onClick={onNotification}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span className={styles.notifDot} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </header>
  )
}

export default memo(Header)
