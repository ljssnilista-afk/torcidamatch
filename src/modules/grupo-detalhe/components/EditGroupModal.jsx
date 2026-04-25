import { useState, useRef } from 'react'
import styles from '../GrupoScreen.module.css'

export default function EditGroupModal({ grupo, onSave, onClose, loading }) {
  const [fields, setFields] = useState({
    name: grupo.name || '',
    description: grupo.description || '',
    bairro: grupo.bairro || '',
    zona: grupo.zona || '',
    meetPoint: grupo.meetPoint || '',
    privacy: grupo.privacy || 'public',
    approvalRequired: grupo.approvalRequired || false,
    groupType: grupo.groupType || 'misto',
    locationLat: grupo.location?.lat || null,
    locationLng: grupo.location?.lng || null,
  })
  const [photoPreview, setPhotoPreview] = useState(grupo.photo || null)
  const [photoData, setPhotoData] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locLabel, setLocLabel] = useState(
    grupo.location?.lat ? `${grupo.location.lat.toFixed(4)}, ${grupo.location.lng.toFixed(4)}` : ''
  )
  const fileRef = useRef(null)

  const set = f => e => setFields(p => ({ ...p, [f]: typeof e === 'object' ? e.target.value : e }))

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 600; canvas.height = 600
        const ctx = canvas.getContext('2d')
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 600, 600)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setPhotoPreview(dataUrl); setPhotoData(dataUrl)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const updates = { ...fields }
    if (photoData) updates.photo = photoData
    if (fields.locationLat && fields.locationLng) {
      updates.location = { lat: fields.locationLat, lng: fields.locationLng }
    }
    delete updates.locationLat; delete updates.locationLng
    onSave(updates)
  }

  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.editSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        <div className={styles.editHeader}>
          <button className={styles.editCancelBtn} onClick={onClose}>Cancelar</button>
          <span className={styles.editTitle}>Editar grupo</span>
          <button className={styles.editSaveBtn} onClick={handleSave} disabled={loading}>{loading ? '...' : 'Salvar'}</button>
        </div>
        <div className={styles.editBody}>
          <label className={styles.editLabel}>Foto do grupo</label>
          <div className={styles.photoUploadRow}>
            <div className={styles.photoPreview} onClick={() => fileRef.current?.click()}>
              {photoPreview
                ? <img src={photoPreview} alt="Foto do grupo" className={styles.photoPreviewImg} />
                : <div className={styles.photoPlaceholder}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
              }
            </div>
            <div className={styles.photoUploadInfo}>
              <button className={styles.photoUploadBtn} onClick={() => fileRef.current?.click()}>
                {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              <span className={styles.photoUploadHint}>JPEG ou PNG, máx 800KB</span>
              {photoPreview && (
                <button className={styles.photoRemoveBtn} onClick={() => { setPhotoPreview(null); setPhotoData('') }}>
                  Remover
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} style={{ display: 'none' }} />
          </div>

          <label className={styles.editLabel}>Nome do grupo</label>
          <input type="text" value={fields.name} onChange={set('name')} maxLength={50} className={styles.editInput} />

          <label className={styles.editLabel}>Descrição</label>
          <textarea value={fields.description} onChange={set('description')} maxLength={140} rows={3} className={styles.editInput} style={{ resize: 'none' }} />

          <label className={styles.editLabel}>Ponto de encontro</label>
          <input type="text" value={fields.meetPoint} onChange={set('meetPoint')} className={styles.editInput} placeholder="Ex: Praça dos Bancários" />

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label className={styles.editLabel}>Bairro</label>
              <input type="text" value={fields.bairro} onChange={set('bairro')} className={styles.editInput} />
            </div>
            <div style={{ flex: 1 }}>
              <label className={styles.editLabel}>Zona</label>
              <select value={fields.zona} onChange={set('zona')} className={styles.editInput}>
                <option value="">Selecione</option>
                {['Sul','Norte','Oeste','Centro'].map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
            </div>
          </div>

          <label className={styles.editLabel}>Privacidade</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['public', 'private'].map(p => (
              <button key={p} onClick={() => setFields(prev => ({ ...prev, privacy: p }))}
                style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: fields.privacy === p ? 'var(--color-brand-dim)' : 'var(--color-surface-2)',
                  color: fields.privacy === p ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
                  border: `0.5px solid ${fields.privacy === p ? 'var(--color-brand)' : 'var(--color-border)'}` }}>
                {p === 'public' ? 'Público' : 'Privado'}
              </button>
            ))}
          </div>

          <label className={styles.editLabel}>Tipo do grupo</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['misto','Misto'],['organizada','Organizada'],['familia','Família'],['feminino','Feminino'],['jovem','Jovem']].map(([id, label]) => (
              <button key={id} onClick={() => setFields(prev => ({ ...prev, groupType: id }))}
                style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: fields.groupType === id ? 'var(--color-brand-dim)' : 'var(--color-surface-2)',
                  color: fields.groupType === id ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
                  border: `0.5px solid ${fields.groupType === id ? 'var(--color-brand)' : 'var(--color-border)'}` }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
