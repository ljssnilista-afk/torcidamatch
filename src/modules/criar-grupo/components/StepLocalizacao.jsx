import { useState } from 'react'
import styles from '../CriarGrupoScreen.module.css'
import { Icons } from './icons'
import MapPicker from './MapPicker'

export default function StepLocalizacao({ onNext, onBack, initial, dados }) {
  const [fields, setFields] = useState(initial || {
    meetPoint: '',
    groupType: 'public',
    monthlyFee: '',
    lat: null,
    lng: null,
  })
  const [mapOpen,   setMapOpen]   = useState(false)
  const [locLabel,  setLocLabel]  = useState(initial?.locLabel || '')
  const [errors,    setErrors]    = useState({})

  const set = (f) => (e) => {
    setFields(p => ({ ...p, [f]: e.target.value }))
    setErrors(p => ({ ...p, [f]: '' }))
  }

  const handleMapConfirm = (pin, address) => {
    const label = address || `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`
    setFields(p => ({ ...p, lat: pin.lat, lng: pin.lng, meetPoint: label }))
    setLocLabel(label)
    setMapOpen(false)
  }

  const handleFeeChange = (e) => {
    const raw = e.target.value.replace(/[^\d,\.]/g, '')
    setFields(p => ({ ...p, monthlyFee: raw }))
    setErrors(p => ({ ...p, monthlyFee: '' }))
  }

  const validate = () => {
    const e = {}
    if (!fields.meetPoint.trim()) e.meetPoint = 'Marque no mapa ou informe um ponto de referência'
    if (fields.groupType === 'private') {
      const fee = parseFloat(fields.monthlyFee.replace(',', '.'))
      if (!fields.monthlyFee || isNaN(fee) || fee <= 0) e.monthlyFee = 'Informe o valor da mensalidade'
    }
    return e
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onNext({ ...fields, locLabel })
  }

  return (
    <div className={styles.stepWrap}>
      <h2 className={styles.stepTitle}>Localização</h2>
      <p className={styles.stepSub}>Onde seu grupo se reúne?</p>

      <div className={styles.resumoCard}>
        <div className={styles.resumoRow}>
          <span className={styles.resumoLabel}>Grupo</span>
          <span className={styles.resumoValueBold}>{dados.name}</span>
        </div>
        <div className={styles.resumoRow}>
          <span className={styles.resumoLabel}>Time</span>
          <span className={styles.resumoValueBrand}>{dados.team} · {dados.bairro}, {dados.zona}</span>
        </div>
      </div>

      <div className={styles.form}>
        <button type="button" className={styles.btnLocation} onClick={() => setMapOpen(true)}>
          {Icons.mapPin}
          {fields.lat ? 'Alterar localização' : 'Marcar localização'}
        </button>

        {locLabel && (
          <div className={styles.locResult}>
            <span className={styles.locResultIcon}>{Icons.mapPin}</span>
            <span className={styles.locResultText}>{locLabel}</span>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Ponto de referência <span className={styles.required}>*</span></label>
          <input
            className={`${styles.input} ${errors.meetPoint ? styles.inputError : ''}`}
            placeholder="Ex: Bar do Zé, praça central, esquina da padaria..."
            value={fields.meetPoint} onChange={set('meetPoint')}
          />
          {errors.meetPoint && <span className={styles.error}>{errors.meetPoint}</span>}
          <span className={styles.hint}>Preenchido pelo mapa — edite se quiser</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tipo de grupo</label>
          <div className={styles.radioGroup}>
            <button
              type="button"
              className={`${styles.radioCard} ${fields.groupType === 'public' ? styles.radioCardActive : ''}`}
              onClick={() => setFields(p => ({ ...p, groupType: 'public', monthlyFee: '' }))}
            >
              <div className={styles.radioContent}>
                <span className={styles.radioLabel}>Público</span>
                <span className={styles.radioDesc}>Aparece para todos</span>
                <div className={styles.radioFeatures}>
                  <span className={styles.radioFeature}>Solicitação enviada pelo usuário</span>
                  <span className={styles.radioFeature}>Líder aprova manualmente</span>
                </div>
              </div>
              <div className={`${styles.radioCircle} ${fields.groupType === 'public' ? styles.radioCircleActive : ''}`}>
                {fields.groupType === 'public' && <div className={styles.radioCircleDot} />}
              </div>
            </button>

            <button
              type="button"
              className={`${styles.radioCard} ${fields.groupType === 'private' ? styles.radioCardActive : ''}`}
              onClick={() => setFields(p => ({ ...p, groupType: 'private' }))}
            >
              <div className={styles.radioContent}>
                <span className={styles.radioLabel}>
                  Privado <span className={styles.badgePrivado}>Privado</span>
                </span>
                <span className={styles.radioDesc}>Aparece para todos com selo</span>
                <div className={styles.radioFeatures}>
                  <span className={styles.radioFeature}>Exige pagamento para entrar</span>
                  <span className={styles.radioFeature}>Entrada automática após confirmação</span>
                  <span className={styles.radioFeatureHighlight}>Mensalidade definida pelo líder</span>
                </div>
              </div>
              <div className={`${styles.radioCircle} ${fields.groupType === 'private' ? styles.radioCircleActive : ''}`}>
                {fields.groupType === 'private' && <div className={styles.radioCircleDot} />}
              </div>
            </button>
          </div>
        </div>

        {fields.groupType === 'private' && (
          <div className={styles.feeSection}>
            <div className={styles.field}>
              <label className={styles.label}>Valor da mensalidade <span className={styles.required}>*</span></label>
              <div className={styles.feeInputWrap}>
                <span className={styles.feeCurrency}>R$</span>
                <input
                  className={`${styles.input} ${styles.feeInput} ${errors.monthlyFee ? styles.inputError : ''}`}
                  placeholder="0,00"
                  value={fields.monthlyFee}
                  onChange={handleFeeChange}
                  inputMode="decimal"
                />
              </div>
              {errors.monthlyFee && <span className={styles.error}>{errors.monthlyFee}</span>}
              <span className={styles.hint}>Valor cobrado mensalmente de cada membro</span>
            </div>
          </div>
        )}
      </div>

      <button className={styles.btnPrimary} onClick={handleNext}>Revisar e criar →</button>
      <button className={styles.btnBack} onClick={onBack}>← Voltar</button>

      <MapPicker
        visible={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapConfirm}
        initialLat={fields.lat}
        initialLng={fields.lng}
      />
    </div>
  )
}
