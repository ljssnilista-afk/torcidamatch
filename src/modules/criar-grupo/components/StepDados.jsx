import { useState } from 'react'
import { useUser } from '@shared/contexts/UserContext'
import styles from '../CriarGrupoScreen.module.css'
import { Icons } from './icons'
import { ZONAS } from './constants'

export default function StepDados({ onNext, onBack, initial }) {
  const { user } = useUser()
  const userTeam = user?.team || user?.time || ''

  const [fields, setFields] = useState(initial || { name: '', bairro: '', zona: '', description: '' })
  const [errors, setErrors] = useState({})

  const set = (f) => (e) => {
    setFields(p => ({ ...p, [f]: e.target.value }))
    setErrors(p => ({ ...p, [f]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!fields.name.trim() || fields.name.length < 3) e.name = 'Mínimo 3 caracteres'
    if (fields.name.length > 50) e.name = 'Máximo 50 caracteres'
    if (!fields.bairro.trim()) e.bairro = 'Informe o bairro'
    if (!fields.zona) e.zona = 'Selecione a zona'
    if (fields.description.length > 140) e.description = 'Máximo 140 caracteres'
    return e
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onNext({ ...fields, team: userTeam })
  }

  return (
    <div className={styles.stepWrap}>
      <h2 className={styles.stepTitle}>Dados do grupo</h2>
      <p className={styles.stepSub}>Informações básicas do seu grupo</p>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Nome do grupo <span className={styles.required}>*</span></label>
          <input
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="Ex: Botafogo de Copacabana"
            value={fields.name} onChange={set('name')} maxLength={50}
          />
          <div className={styles.fieldMeta}>
            {errors.name
              ? <span className={styles.error}>{errors.name}</span>
              : <span className={styles.hint}>Nome único para seu time + bairro</span>}
            <span className={styles.counter}>{fields.name.length}/50</span>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Time</label>
          <div className={styles.teamBadge}>
            <span className={styles.teamBadgeText}>{userTeam || '—'}</span>
            <span className={styles.teamBadgeHint}>Definido no seu perfil</span>
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Bairro <span className={styles.required}>*</span></label>
            <input
              className={`${styles.input} ${errors.bairro ? styles.inputError : ''}`}
              placeholder="Ex: Copacabana" value={fields.bairro} onChange={set('bairro')}
            />
            {errors.bairro && <span className={styles.error}>{errors.bairro}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Zona <span className={styles.required}>*</span></label>
            <div className={styles.selectWrap}>
              <select
                className={`${styles.select} ${errors.zona ? styles.inputError : ''}`}
                value={fields.zona} onChange={set('zona')}
              >
                <option value="">Zona...</option>
                {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <span className={styles.selectChevron}>{Icons.chevronDown}</span>
            </div>
            {errors.zona && <span className={styles.error}>{errors.zona}</span>}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descrição <span className={styles.optional}>(opcional)</span></label>
          <textarea
            className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
            placeholder="Conte um pouco sobre seu grupo..."
            value={fields.description} onChange={set('description')} maxLength={140} rows={3}
          />
          <div className={styles.fieldMeta}>
            {errors.description && <span className={styles.error}>{errors.description}</span>}
            <span className={styles.counter}>{fields.description.length}/140</span>
          </div>
        </div>
      </div>

      <button className={styles.btnPrimary} onClick={handleNext}>Próximo →</button>
      <button className={styles.btnBack} onClick={onBack}>← Voltar</button>
    </div>
  )
}
