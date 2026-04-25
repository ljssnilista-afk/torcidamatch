import { useState } from 'react'
import styles from '../PerfilScreen.module.css'

const EDIT_FIELDS = [
  { id: 'name',   label: 'Nome completo', type: 'text' },
  { id: 'age',    label: 'Idade',         type: 'number' },
  { id: 'bairro', label: 'Bairro',        type: 'text' },
  { id: 'zona',   label: 'Zona',          type: 'text' },
]

export default function EditPanel({ user, onSave, onClose }) {
  const [fields, setFields] = useState({ name: user.name ?? '', age: user.age ?? '', bairro: user.bairro ?? '', zona: user.zona ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = f => e => { setFields(p => ({ ...p, [f]: e.target.value })); setErrors(p => ({ ...p, [f]: '' })) }

  const validate = () => {
    const e = {}
    if (!fields.name.trim() || fields.name.length < 3) e.name = 'Mínimo 3 caracteres'
    const age = parseInt(fields.age); if (!fields.age || isNaN(age) || age < 13 || age > 100) e.age = 'Idade inválida (13–100)'
    if (!fields.bairro.trim()) e.bairro = 'Informe seu bairro'
    if (!fields.zona.trim()) e.zona = 'Informe sua zona'
    return e
  }

  const handleSave = async () => {
    const errs = validate(); if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true); await new Promise(r => setTimeout(r, 400)); onSave(fields)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle}/>
        <div className={styles.sheetHeader}>
          <button className={styles.sheetCancelBtn} onClick={onClose}>Cancelar</button>
          <span className={styles.sheetTitle}>Editar perfil</span>
          <button className={styles.sheetSaveBtn} onClick={handleSave} disabled={saving}>{saving ? '...' : 'Salvar'}</button>
        </div>
        <div className={styles.sheetBody}>
          {EDIT_FIELDS.map(f => (
            <div key={f.id} className={styles.editField}>
              <label className={styles.editLabel}>{f.label}</label>
              <input type={f.type} value={fields[f.id]} onChange={set(f.id)}
                className={`${styles.editInput} ${errors[f.id] ? styles.editInputErr : ''}`} />
              {errors[f.id] && <span className={styles.editErr}>{errors[f.id]}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
