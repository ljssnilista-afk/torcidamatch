import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../utils/constants'
import styles from './CriarGrupoScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

const TIMES_RJ = [
  'Botafogo','Flamengo','Fluminense','Vasco da Gama',
  'América-RJ','Bangu','Bonsucesso','Campo Grande',
  'Madureira','Olaria','Portuguesa-RJ','São Cristóvão',
  'Volta Redonda','Americano','Boavista-RJ','Cabofriense',
  'Nova Iguaçu','Friburguense','Goytacaz','Serrano',
]

const ZONAS = ['Zona Sul','Zona Norte','Zona Oeste','Centro','Niterói','Baixada','Interior']

/* ═══════════════════════════════════════════════════════════════════════════
   Ícones SVG reutilizáveis
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
      <rect x="3" y="3" width="18" height="14" rx="3"/>
      <path d="M3 10h18"/>
      <path d="M12 3v7"/>
      <circle cx="7" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>
      <path d="M5.5 17v3M18.5 17v3"/>
    </svg>
  ),
  pin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  crown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20"/>
      <path d="M4 20V9l4 4 4-7 4 7 4-4v11"/>
    </svg>
  ),
  lock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  mapPin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  check: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  ),
  chevronDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6,9 12,15 18,9"/>
    </svg>
  ),
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step Indicator — dots com pill ativo
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
   Toggle Switch
   ═══════════════════════════════════════════════════════════════════════════ */
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
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
      {/* Hero icon */}
      <div className={styles.introIconWrap}>
        <div className={styles.introIcon}>
          {Icons.people}
        </div>
      </div>

      <h2 className={styles.introTitle}>Crie seu grupo</h2>
      <p className={styles.introSub}>
        Reúna torcedores do seu bairro, organize viagens e vá junto ao estádio com quem você conhece.
      </p>

      <div className={styles.benefitsList}>
        {features.map(f => (
          <div key={f.text} className={styles.benefitItem}>
            <div className={styles.benefitIcon} style={{ color: f.color }}>
              {f.icon}
            </div>
            <span className={styles.benefitText}>{f.text}</span>
          </div>
        ))}
      </div>

      <button className={styles.btnPrimary} onClick={onNext}>
        Criar meu grupo →
      </button>
      <button className={styles.btnBack} onClick={onBack}>
        ← Voltar
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Etapa 2 — Dados do grupo
   ═══════════════════════════════════════════════════════════════════════════ */
function StepDados({ onNext, onBack, initial }) {
  const [fields, setFields] = useState(initial || {
    name: '', team: '', bairro: '', zona: '', description: '',
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
    if (!fields.team) e.team = 'Selecione o time'
    if (!fields.bairro.trim()) e.bairro = 'Informe o bairro'
    if (!fields.zona) e.zona = 'Selecione a zona'
    if (fields.description.length > 140) e.description = 'Máximo 140 caracteres'
    return e
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onNext(fields)
  }

  return (
    <div className={styles.stepWrap}>
      <h2 className={styles.stepTitle}>Dados do grupo</h2>
      <p className={styles.stepSub}>Informações básicas do seu grupo</p>

      <div className={styles.form}>
        {/* Nome */}
        <div className={styles.field}>
          <label className={styles.label}>Nome do grupo <span className={styles.required}>*</span></label>
          <input
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="Ex: Botafogo de Copacabana"
            value={fields.name}
            onChange={set('name')}
            maxLength={50}
          />
          <div className={styles.fieldMeta}>
            {errors.name
              ? <span className={styles.error}>{errors.name}</span>
              : <span className={styles.hint}>Nome único para seu time + bairro</span>
            }
            <span className={styles.counter}>{fields.name.length}/50</span>
          </div>
        </div>

        {/* Time */}
        <div className={styles.field}>
          <label className={styles.label}>Time <span className={styles.required}>*</span></label>
          <div className={styles.selectWrap}>
            <select
              className={`${styles.select} ${errors.team ? styles.inputError : ''}`}
              value={fields.team}
              onChange={set('team')}
            >
              <option value="">Selecione o time...</option>
              {TIMES_RJ.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className={styles.selectChevron}>{Icons.chevronDown}</span>
          </div>
          {errors.team && <span className={styles.error}>{errors.team}</span>}
        </div>

        {/* Bairro + Zona */}
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Bairro <span className={styles.required}>*</span></label>
            <input
              className={`${styles.input} ${errors.bairro ? styles.inputError : ''}`}
              placeholder="Ex: Copacabana"
              value={fields.bairro}
              onChange={set('bairro')}
            />
            {errors.bairro && <span className={styles.error}>{errors.bairro}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Zona <span className={styles.required}>*</span></label>
            <div className={styles.selectWrap}>
              <select
                className={`${styles.select} ${errors.zona ? styles.inputError : ''}`}
                value={fields.zona}
                onChange={set('zona')}
              >
                <option value="">Zona...</option>
                {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <span className={styles.selectChevron}>{Icons.chevronDown}</span>
            </div>
            {errors.zona && <span className={styles.error}>{errors.zona}</span>}
          </div>
        </div>

        {/* Descrição */}
        <div className={styles.field}>
          <label className={styles.label}>Descrição <span className={styles.optional}>(opcional)</span></label>
          <textarea
            className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
            placeholder="Conte um pouco sobre seu grupo..."
            value={fields.description}
            onChange={set('description')}
            maxLength={140}
            rows={3}
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
   Helpers de geocodificação (Nominatim / OpenStreetMap)
   ═══════════════════════════════════════════════════════════════════════════ */

// Geocodificação reversa: coordenadas → endereço legível
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
    { headers: { 'User-Agent': 'TorcidaMatch/1.0' } }
  )
  const data = await res.json()
  const { road = '', house_number = '', suburb = '', neighbourhood = '', city = '' } = data.address || {}
  const street = road ? `${road}${house_number ? ', ' + house_number : ''}` : ''
  const bairro = suburb || neighbourhood
  const parts = [street, bairro, city].filter(Boolean)
  return parts.join(' — ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

// Geocodificação direta: endereço → coordenadas (limita ao Brasil)
async function forwardGeocode(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=br&accept-language=pt-BR`,
    { headers: { 'User-Agent': 'TorcidaMatch/1.0' } }
  )
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name }
}

// Validação: coordenadas dentro do Brasil (bounding box aproximado)
function isWithinBrazil(lat, lng) {
  return lat >= -33.75 && lat <= 5.27 && lng >= -73.99 && lng <= -28.83
}

/* ═══════════════════════════════════════════════════════════════════════════
   MapPicker — mapa Leaflet com marcador arrastável
   ═══════════════════════════════════════════════════════════════════════════ */
function MapPicker({ lat, lng, onMove }) {
  const containerRef = useRef(null)
  const mapRef      = useRef(null)
  const markerRef   = useRef(null)

  useEffect(() => {
    // Injeta CSS do Leaflet uma única vez
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id   = 'leaflet-css'
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Carrega o script do Leaflet dinamicamente
    const loadLeaflet = () => new Promise((resolve) => {
      if (window.L) return resolve(window.L)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => resolve(window.L)
      document.head.appendChild(script)
    })

    loadLeaflet().then((L) => {
      if (mapRef.current || !containerRef.current) return

      const initialLat = lat || -22.9068
      const initialLng = lng || -43.1729

      const map = L.map(containerRef.current, { zoomControl: true }).setView([initialLat, initialLng], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // Ícone personalizado verde para o marcador
      const greenIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:#22c55e;border:3px solid #fff;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(34,197,94,0.5)
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })

      const marker = L.marker([initialLat, initialLng], { draggable: true, icon: greenIcon }).addTo(map)

      marker.on('dragend', (e) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng()
        onMove(newLat, newLng)
      })

      // Clique no mapa também move o marcador
      map.on('click', (e) => {
        marker.setLatLng(e.latlng)
        onMove(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current    = map
      markerRef.current = marker
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current    = null
        markerRef.current = null
      }
    }
  }, []) // monta apenas uma vez

  // Sincroniza marcador quando lat/lng mudam externamente (ex: "usar minha localização")
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current?.setView([lat, lng], 15)
    }
  }, [lat, lng])

  return (
    <div
      ref={containerRef}
      className={styles.mapContainer}
      aria-label="Mapa para selecionar ponto de encontro"
    />
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Etapa 3 — Localização & Privacidade
   ═══════════════════════════════════════════════════════════════════════════ */
function StepLocalizacao({ onNext, onBack, initial, dados }) {
  const [fields, setFields] = useState(initial || {
    meetPoint: '', privacy: 'public', approvalRequired: false,
    mensalidade: '', lat: null, lng: null,
  })
  const [locLoading,    setLocLoading]    = useState(false)
  const [geocodeTimer,  setGeocodeTimer]  = useState(null)
  const [errors,        setErrors]        = useState({})

  const set = (f) => (e) => {
    const val = e.target.value
    setFields(p => ({ ...p, [f]: val }))
    setErrors(p => ({ ...p, [f]: '' }))

    // Quando o usuário digita no campo de endereço, faz geocodificação direta (debounced 800ms)
    if (f === 'meetPoint') {
      clearTimeout(geocodeTimer)
      if (val.trim().length > 5) {
        const t = setTimeout(async () => {
          try {
            const result = await forwardGeocode(val)
            if (result) {
              setFields(p => ({ ...p, lat: result.lat, lng: result.lng }))
            }
          } catch { /* silencioso */ }
        }, 800)
        setGeocodeTimer(t)
      }
    }
  }

  const setPrivacy = (value) => {
    setFields(p => ({ ...p, privacy: value, mensalidade: value === 'public' ? '' : p.mensalidade }))
  }

  // Chamado quando o marcador é arrastado ou o mapa é clicado → geocodificação reversa
  const handleMapMove = async (lat, lng) => {
    setFields(p => ({ ...p, lat, lng }))
    try {
      const label = await reverseGeocode(lat, lng)
      setFields(p => ({ ...p, meetPoint: label }))
      setErrors(p => ({ ...p, meetPoint: '' }))
    } catch { /* mantém o endereço anterior */ }
  }

  // Botão "Usar minha localização" → GPS → geocodificação reversa → preenche campo
  const getLocation = () => {
    if (!navigator.geolocation) return
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        if (!isWithinBrazil(lat, lng)) {
          setErrors(p => ({ ...p, meetPoint: 'Localização fora do Brasil' }))
          setLocLoading(false)
          return
        }
        setFields(p => ({ ...p, lat, lng }))
        try {
          const label = await reverseGeocode(lat, lng)
          setFields(p => ({ ...p, meetPoint: label }))
          setErrors(p => ({ ...p, meetPoint: '' }))
        } catch {
          setFields(p => ({ ...p, meetPoint: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }))
        }
        setLocLoading(false)
      },
      () => {
        setErrors(p => ({ ...p, meetPoint: 'Não foi possível obter sua localização' }))
        setLocLoading(false)
      },
      { timeout: 8000 }
    )
  }

  const validate = () => {
    const e = {}
    if (!fields.meetPoint.trim())
      e.meetPoint = 'Informe o ponto de encontro'
    if (!fields.lat || !fields.lng)
      e.meetPoint = 'Confirme a localização no mapa'
    if (fields.lat && fields.lng && !isWithinBrazil(fields.lat, fields.lng))
      e.meetPoint = 'Ponto de encontro deve estar no Brasil'
    if (fields.privacy === 'private') {
      const valor = parseFloat(fields.mensalidade)
      if (!fields.mensalidade || isNaN(valor) || valor < 5)
        e.mensalidade = 'Valor mínimo R$ 5,00'
    }
    return e
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onNext(fields)
  }

  const privacyOptions = [
    { value: 'public',  label: 'Público',  desc: 'Aparece na busca para todos' },
    { value: 'private', label: 'Privado',  desc: 'Apenas por convite' },
  ]

  return (
    <div className={styles.stepWrap}>
      <h2 className={styles.stepTitle}>Localização</h2>
      <p className={styles.stepSub}>Onde seu grupo se reúne?</p>

      {/* Resumo dos dados anteriores */}
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
        {/* Ponto de encontro */}
        <div className={styles.field}>
          <label className={styles.label}>Ponto de encontro <span className={styles.required}>*</span></label>
          <input
            className={`${styles.input} ${errors.meetPoint ? styles.inputError : ''}`}
            placeholder="Ex: Av. Atlântica, 3000 — em frente ao posto"
            value={fields.meetPoint}
            onChange={set('meetPoint')}
          />
          {errors.meetPoint && <span className={styles.error}>{errors.meetPoint}</span>}
          {!errors.meetPoint && fields.lat && fields.lng && (
            <span className={styles.hint}>
              📍 {fields.lat.toFixed(5)}, {fields.lng.toFixed(5)}
            </span>
          )}
        </div>

        {/* Botão usar minha localização */}
        <button
          type="button"
          className={styles.btnLocation}
          onClick={getLocation}
          disabled={locLoading}
        >
          {Icons.mapPin}
          {locLoading ? 'Detectando...' : 'Usar minha localização'}
        </button>

        {/* Mapa interativo Leaflet */}
        <div className={styles.field}>
          <label className={styles.label}>Confirme no mapa <span className={styles.required}>*</span></label>
          <p className={styles.hint} style={{ marginBottom: 8 }}>
            Clique ou arraste o marcador para ajustar o ponto exato
          </p>
          <MapPicker
            lat={fields.lat}
            lng={fields.lng}
            onMove={handleMapMove}
          />
        </div>

        {/* Privacidade */}
        <div className={styles.field}>
          <label className={styles.label}>Privacidade</label>
          <div className={styles.radioGroup}>
            {privacyOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.radioCard} ${fields.privacy === opt.value ? styles.radioCardActive : ''}`}
                onClick={() => setPrivacy(opt.value)}
              >
                <div className={styles.radioContent}>
                  <span className={styles.radioLabel}>{opt.label}</span>
                  <span className={styles.radioDesc}>{opt.desc}</span>
                </div>
                <div className={`${styles.radioCircle} ${fields.privacy === opt.value ? styles.radioCircleActive : ''}`}>
                  {fields.privacy === opt.value && <div className={styles.radioCircleDot} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mensalidade — apenas para grupos privados */}
        {fields.privacy === 'private' && (
          <div className={styles.field}>
            <label className={styles.label}>Mensalidade <span className={styles.required}>*</span></label>
            <input
              type="number"
              min="5"
              step="0.01"
              className={`${styles.input} ${errors.mensalidade ? styles.inputError : ''}`}
              placeholder="R$ 0,00 (mínimo R$ 5,00)"
              value={fields.mensalidade}
              onChange={set('mensalidade')}
            />
            {errors.mensalidade
              ? <span className={styles.error}>{errors.mensalidade}</span>
              : <span className={styles.hint}>Valor cobrado mensalmente dos membros</span>
            }
          </div>
        )}

        {/* Aprovação manual */}
        <div className={styles.approvalCard}>
          <div className={styles.approvalContent}>
            <span className={styles.approvalLabel}>Aprovação manual de membros</span>
            <span className={styles.approvalDesc}>Você aprova cada solicitação de entrada</span>
          </div>
          <ToggleSwitch
            checked={fields.approvalRequired}
            onChange={(v) => setFields(p => ({ ...p, approvalRequired: v }))}
          />
        </div>
      </div>

      <button className={styles.btnPrimary} onClick={handleNext}>Revisar e criar →</button>
      <button className={styles.btnBack} onClick={onBack}>← Voltar</button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Etapa 4 — Confirmação e envio
   ═══════════════════════════════════════════════════════════════════════════ */
function StepConfirm({ dados, localizacao, onConfirm, loading }) {
  const rows = [
    ['Nome',          dados.name],
    ['Time',          dados.team],
    ['Bairro',        `${dados.bairro}, ${dados.zona}`],
    ['Ponto',         localizacao.meetPoint],
    ['Privacidade',   localizacao.privacy === 'public' ? 'Público' : 'Privado'],
    ...(localizacao.privacy === 'private' ? [['Mensalidade', `R$ ${parseFloat(localizacao.mensalidade).toFixed(2)}/mês`]] : []),
    ['Aprovação',     localizacao.approvalRequired ? 'Manual' : 'Automática'],
  ]
  if (dados.description) rows.splice(3, 0, ['Descrição', dados.description])

  return (
    <div className={styles.stepWrap}>
      <div className={styles.confirmIconWrap}>
        <div className={styles.confirmIcon}>
          {Icons.check}
        </div>
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
  const { user } = useUser()
  const toast    = useToast()

  const [step,        setStep]        = useState(0)
  const [dados,       setDados]       = useState(null)
  const [localizacao, setLocalizacao] = useState(null)
  const [loading,     setLoading]     = useState(false)

  const TOTAL_STEPS = 4

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const token = user?.token
      const body = {
        name:             dados.name,
        team:             dados.team,
        bairro:           dados.bairro,
        zona:             dados.zona,
        description:      dados.description,
        meetPoint:        localizacao.meetPoint,
        privacy:          localizacao.privacy,
        approvalRequired: localizacao.approvalRequired,
        ...(localizacao.privacy === 'private' ? { mensalidade: parseFloat(localizacao.mensalidade) } : {}),
        ...(localizacao.lat && localizacao.lng ? {
          location: { lat: localizacao.lat, lng: localizacao.lng }
        } : {}),
      }

      const res = await fetch(`${API_URL}/grupos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar grupo')

      toast.success(`Grupo criado com sucesso!`)
      navigate(`/grupos/${data.group._id}`, { state: { grupo: data.group } })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      {/* Header fixo */}
      <div className={styles.header}>
        <button className={styles.closeBtn} onClick={() => navigate(ROUTES.GRUPOS)} aria-label="Fechar">
          {Icons.close}
        </button>
        <span className={styles.headerTitle}>Criar grupo</span>
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {/* Conteúdo scrollável por etapa */}
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
