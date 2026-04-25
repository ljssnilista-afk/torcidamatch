import styles from '../PerfilScreen.module.css'

const ICONS = {
  bell:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  lock:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  logout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  pin:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  globe:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  info:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  chevron:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>,
  sun:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
}

export default function SettingsPanel({ onClose, onAction, isDark, onToggleTheme }) {
  const SETTINGS = [
    { id: 'theme',         icon: isDark ? 'sun' : 'moon', label: isDark ? 'Modo Claro' : 'Modo Escuro', isTheme: true },
    { id: 'notifications', icon: 'bell',   label: 'Notificações' },
    { id: 'privacy',       icon: 'lock',   label: 'Privacidade' },
    { id: 'location',      icon: 'pin',    label: 'Localização' },
    { id: 'language',      icon: 'globe',  label: 'Idioma', value: 'Português' },
    { id: 'about',         icon: 'info',   label: 'Sobre o app', value: 'v1.0.0' },
    { id: 'logout',        icon: 'logout', label: 'Sair da conta', danger: true },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.settingsSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle}/>
        <div className={styles.settingsHeader}>
          <span className={styles.settingsTitle}>Configurações</span>
          <button className={styles.settingsClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.settingsList}>
          {SETTINGS.map(item => (
            <button key={item.id}
              className={`${styles.settingsItem} ${item.danger ? styles.settingsItemDanger : ''}`}
              onClick={() => { if (item.isTheme) { onToggleTheme(); return } onAction(item.id); if (item.id !== 'theme') onClose() }}>
              <span className={`${styles.settingsItemIcon} ${item.danger ? styles.settingsItemIconDanger : ''}`}>
                {ICONS[item.icon]}
              </span>
              <span className={styles.settingsItemLabel}>{item.label}</span>
              {item.value && <span className={styles.settingsItemValue}>{item.value}</span>}
              {item.isTheme && (
                <span className={styles.themeToggle}>
                  <span className={`${styles.themeToggleTrack} ${!isDark ? styles.themeToggleOn : ''}`}>
                    <span className={styles.themeToggleThumb} />
                  </span>
                </span>
              )}
              {!item.isTheme && !item.danger && !item.value && (
                <span className={styles.settingsItemChevron}>{ICONS.chevron}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
