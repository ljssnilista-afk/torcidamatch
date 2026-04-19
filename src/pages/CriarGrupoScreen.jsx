import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../utils/constants'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import styles from './CriarGrupoScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

const ZONAS = ['Zona Sul','Zona Norte','Zona Oeste','Centro','Niterói','Baixada','Interior']

/* Pin personalizado verde */
const greenPin = L.divIcon({
  className: '',
  html: `<div style="
    width:32px;height:32px;border-radius:50% 50% 50% 0;
    background:var(--color-brand,#22C55E);transform:rotate(-45deg);
    border:2px solid rgba(255,255,255,0.3);
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
  "><div style="width:10px;height:10px;border-radius:50%;background:#fff;transform:rotate(45deg)"/></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

/* ═══════════════════════════════════════════════════════════════════════════
   Ícones SVG
   ═══════════════════════════════════════════════════════════════════════════ */
const Icons = {
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  people: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  bus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M12 3v7"/>
      <circle cx="7" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>
      <path d="M5.5 17v3M18.5 17v3"/>
    </svg>
  ),
  pin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  crown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20"/><path d="M4 20V9l4 4 4-7 4 7 4-4v11"/>
    </svg>
  ),
  lock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  mapPin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  check: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  ),
  chevronDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6,9 12,15 18,9"/>
    </svg>
  ),
  crosshair: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/>
      <line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/>
      <line x1="12" y1="22" x2="12" y2="18"/>
    </svg>
  ),
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step Indicator
   ═══════════════════════════════════════════════════════════════════════════ */
function StepIndicator({ current, total }) {
  return (
    <div className={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`${styles.stepDot} ${
            i < current ? styles.stepDotDone :
            i === current ? styles.stepDotActive : ''
          }`}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MapClickHandler — captura cliques no mapa Leaflet
   ═══════════════════════════════════════════════════════════════════════════ */
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng)
    },
  })
  return null
}

/* ═══════════════════════════════════════════════════════════════════════════
   MapPicker Modal — mapa fullscreen para selecionar localização
   ═══════════════════════════════════════════════════════════════════════════ */
function MapPicker({ visible, onClose, onConfirm, initialLat, initialLng }) {
  const DEFAULT_LAT = -22.9068
  const DEFAULT_LNG = -43.1729

  const [pin, setPin] = useState(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng }
      : null
  )
  const [locating, setLocating] = useState(false)
  const [address, setAddress] = useState('')
  const mapRef = useRef(null)

  // Reverse geocode quando pin muda
  useEffect(() => {
    if (!pin) { setAddress(''); return }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pin.lat}&lon=${pin.lng}&format=json&accept-language=pt-BR`,
          { headers: { 'User-Agent': 'TorcidaMatch/1.0' } }
        )
        const data = await res.json()
        if (cancelled) return
        const road = data.address?.road || ''
        const bairro = data.address?.suburb || data.address?.neighbourhood || ''
        setAddress(road ? `${road}, ${bairro}` : `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`)
      } catch {
        if (!cancelled) setAddress(`${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`)
      }
    })()
    return () => { cancelled = true }
  }, [pin?.lat, pin?.lng])

  const handleMyLocation = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPin(coords)
        mapRef.current?.flyTo([coords.lat, coords.lng], 16, { duration: 1 })
        setLocating(false)
      },
      () => { setLocating(false) },
      { timeout: 8000 }
    )
  }

  if (!visible) return null

  return (
    <div className={styles.mapOverlay}>
      <div className={styles.mapModal}>
        {/* Header */}
        <div className={styles.mapHeader}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            {Icons.close}
          </button>
          <span className={styles.mapHeaderTitle}>Marcar localização</span>
          <div style={{ width: 34 }} />
        </div>

        {/* Instrução */}
        <p className={styles.mapHint}>Toque no mapa para posicionar o ponto de encontro</p>

        {/* Mapa — OpenStreetMap padrão */}
        <div className={styles.mapContainer}>
          <MapContainer
            center={pin ? [pin.lat, pin.lng] : [DEFAULT_LAT, DEFAULT_LNG]}
            zoom={14}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapClickHandler onLocationSelect={(latlng) => setPin(latlng)} />
            {pin && <Marker position={[pin.lat, pin.lng]} icon={greenPin} />}
          </MapContainer>

          {/* Botão "minha localização" flutuante */}
          <button
            className={styles.mapLocateBtn}
            onClick={handleMyLocation}
            disabled={locating}
            aria-label="Minha localização"
          >
            {Icons.crosshair}
          </button>
        </div>

        {/* Endereço detectado */}
        {address && (
          <div className={styles.mapAddress}>
            <span className={styles.mapAddressIcon}>{Icons.mapPin}</span>
            <span className={styles.mapAddressText}>{address}</span>
          </div>
        )}

        {/* Confirmar */}
        <button
          className={styles.btnPrimary}
          onClick={() => pin && onConfirm(pin, address)}
          disabled={!pin}
          style={{ margin: '12px 16px 16px' }}
        >
          Confirmar localização
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Etapa 1 — Introdução / Boas-vindas
   ═══════════════════════════════════════════════════════════════════════════ */
function StepIntro({ onNext, onBack }) {
  const features = [
    { icon: Icons.bus,   color: '#4FC3F7', text: 'Organize viagens para os jogos' },
    { icon: Icons.pin,   color: '#FF5252', text: 'Conecte torcedores da sua região' },
    { icon: Icons.crown, color: '#FFD740', text: 'Você será o líder do grupo' },
    { icon: Icons.lock,  color: 'var(--color-text-secondary)', text: 'Limite de 100 membros por grupo' },
  ]

  return (
    <div className={styles.stepWrap}>
      <div className={styles.introIconWrap}>
        <div className={styles.introIcon}>{Icons.people}</div>
      </div>

      <h2 className={styles.introTitle}>Crie seu grupo</h2>
      <p className={styles.introSub}>
        Reúna torcedores do seu bairro, organize viagens e vá junto ao estádio com quem você conhece.
      </p>

      <div className={styles.benefitsList}>
        {features.map(f => (
          <div key={f.text} className={styles.benefitItem}>
            <div className={styles.benefitIcon} style={{ color: f.color }}>{f.icon}</div>
            <span className={styles.benefitText}>{f.text}</span>
          </div>
        ))}
      </div>

      <button className={styles.btnPrimary} onClick={onNext}>Criar meu grupo →</button>
      <button className={styles.btnBack} onClick={onBack}>← Voltar</button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Etapa 2 — Dados do grupo
   ═══════════════════════════════════════════════════════════════════════════ */
function StepDados({ onNext, onBack, initial }) {
  const { user } = useUser()
  const userTeam = user?.team || user?.time || ''

  const [fields, setFields] = useState(initial || {
    name: '', bairro: '', zona: '', description: '',
  })
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

/* ═══════════════════════════════════════════════════════════════════════════
   Etapa 3 — Localização & Tipo de Grupo
   ═══════════════════════════════════════════════════════════════════════════ */
function StepLocalizacao({ onNext, onBack, initial, dados }) {
  const [fields, setFields] = useState(initial || {
    meetPoint: '',
    groupType: 'public',   // 'public' | 'private'
    monthlyFee: '',
    lat: null, lng: null,
  })
  const [mapOpen, setMapOpen] = useState(false)
  const [locLabel, setLocLabel] = useState(initial?.locLabel || '')
  const [errors, setErrors] = useState({})

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
      if (!fields.monthlyFee || isNaN(fee) || fee <= 0) {
        e.monthlyFee = 'Informe o valor da mensalidade'
      }
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

      {/* Resumo */}
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
        {/* Botão marcar localização → abre mapa */}
        <button
          type="button"
          className={styles.btnLocation}
          onClick={() => setMapOpen(true)}
        >
          {Icons.mapPin}
          {fields.lat ? 'Alterar localização' : 'Marcar localização'}
        </button>

        {locLabel && (
          <div className={styles.locResult}>
            <span className={styles.locResultIcon}>{Icons.mapPin}</span>
            <span className={styles.locResultText}>{locLabel}</span>
          </div>
        )}

        {/* Ponto de referência — preenchido pelo mapa, editável pelo usuário */}
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

        {/* ─── Tipo de Grupo ─── */}
        <div className={styles.field}>
          <label className={styles.label}>Tipo de grupo</label>
          <div className={styles.radioGroup}>
            {/* Público */}
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

            {/* Privado */}
            <button
              type="button"
              className={`${styles.radioCard} ${fields.groupType === 'private' ? styles.radioCardActive : ''}`}
              onClick={() => setFields(p => ({ ...p, groupType: 'private' }))}
            >
              <div className={styles.radioContent}>
                <span className={styles.radioLabel}>
                  Privado
                  <span className={styles.badgePrivado}>Privado</span>
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

        {/* ─── Mensalidade (só aparece se privado) ─── */}
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

      {/* Modal do mapa */}
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

/* ═══════════════════════════════════════════════════════════════════════════
   Etapa 4 — Confirmação e envio
   ═══════════════════════════════════════════════════════════════════════════ */
function StepConfirm({ dados, localizacao, onConfirm, loading }) {
  const isPrivate = localizacao.groupType === 'private'
  const rows = [
    ['Nome',       dados.name],
    ['Time',       dados.team],
    ['Bairro',     `${dados.bairro}, ${dados.zona}`],
    ['Referência', localizacao.meetPoint],
    ['Tipo',       isPrivate ? 'Privado (pago)' : 'Público'],
  ]
  if (dados.description) rows.splice(3, 0, ['Descrição', dados.description])
  if (isPrivate && localizacao.monthlyFee) {
    rows.push(['Mensalidade', `R$ ${localizacao.monthlyFee}/mês`])
  }
  if (localizacao.locLabel) {
    rows.push(['Local', localizacao.locLabel])
  }

  return (
    <div className={styles.stepWrap}>
      <div className={styles.confirmIconWrap}>
        <div className={styles.confirmIcon}>{Icons.check}</div>
      </div>
      <h2 className={styles.stepTitle}>Tudo pronto!</h2>
      <p className={styles.stepSub}>Confirme os dados do seu grupo</p>

      <div className={styles.confirmCard}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{label}</span>
            <span className={styles.confirmValue}>{value}</span>
          </div>
        ))}
      </div>

      <button
        className={`${styles.btnPrimary} ${loading ? styles.btnLoading : ''}`}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading
          ? <span className={styles.dots}><span/><span/><span/></span>
          : 'Criar grupo →'
        }
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tela principal — orquestra as etapas
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CriarGrupoScreen() {
  const navigate = useNavigate()
  const { user, ensureValidToken, logout } = useUser()
  const toast    = useToast()

  const [step,        setStep]        = useState(0)
  const [dados,       setDados]       = useState(null)
  const [localizacao, setLocalizacao] = useState(null)
  const [loading,     setLoading]     = useState(false)

  const TOTAL_STEPS = 4

  const handleConfirm = async () => {
    setLoading(true)
    try {
      // Garante token válido antes de enviar (renova se necessário)
      const token = await ensureValidToken()
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.')
        logout()
        navigate(ROUTES.LOGIN)
        return
      }

      const isPrivate = localizacao.groupType === 'private'
      const body = {
        name:             dados.name,
        team:             dados.team,
        bairro:           dados.bairro,
        zona:             dados.zona,
        description:      dados.description,
        meetPoint:        localizacao.meetPoint,
        privacy:          localizacao.groupType,
        approvalRequired: localizacao.groupType === 'public',
        ...(isPrivate && localizacao.monthlyFee ? {
          membershipFee: Math.round(parseFloat(localizacao.monthlyFee.replace(',', '.')) * 100),
        } : {}),
        ...(localizacao.lat && localizacao.lng ? {
          location: { lat: localizacao.lat, lng: localizacao.lng }
        } : {}),
      }

      const res = await fetch(`${API_URL}/grupos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      // Se 401 mesmo após refresh → sessão inválida
      if (res.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.')
        logout()
        navigate(ROUTES.LOGIN)
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar grupo')

      toast.success('Grupo criado com sucesso!')
      navigate(`/grupos/${data.group._id}`, { state: { grupo: data.group } })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.closeBtn} onClick={() => navigate(ROUTES.GRUPOS)} aria-label="Fechar">
          {Icons.close}
        </button>
        <span className={styles.headerTitle}>Criar grupo</span>
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      <div className={styles.scrollArea}>
        {step === 0 && (
          <StepIntro
            onNext={() => setStep(1)}
            onBack={() => navigate(ROUTES.GRUPOS)}
          />
        )}
        {step === 1 && (
          <StepDados
            initial={dados}
            onNext={(d) => { setDados(d); setStep(2) }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepLocalizacao
            initial={localizacao}
            dados={dados}
            onNext={(l) => { setLocalizacao(l); setStep(3) }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepConfirm
            dados={dados}
            localizacao={localizacao}
            onConfirm={handleConfirm}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}
