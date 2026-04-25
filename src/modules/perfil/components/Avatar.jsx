import { useRef } from 'react'
import styles from '../PerfilScreen.module.css'

const CameraIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

export default function Avatar({ initials, photo, size = 82, onPickFile }) {
  const inputRef = useRef(null)
  return (
    <div className={styles.avatarWrap} style={{ width: size, height: size }}>
      {photo
        ? <img src={photo} alt={initials} className={styles.avatarPhoto}/>
        : <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.3 }}>{initials}</div>}
      <div className={styles.avatarOnline}/>
      <button className={styles.avatarUploadBtn} onClick={() => inputRef.current?.click()} aria-label="Alterar foto">
        {CameraIcon}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className={styles.avatarInput} onChange={e => {
        const file = e.target.files?.[0]; if (!file) return
        const reader = new FileReader()
        reader.onload = ev => onPickFile(ev.target.result)
        reader.readAsDataURL(file); e.target.value = ''
      }} />
    </div>
  )
}
