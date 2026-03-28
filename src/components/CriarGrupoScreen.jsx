import { useState } from 'react'
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

// ─── Indicador de etapas ──────────────────────────────────────────────────────
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

// ─── Etapa 1: Introdução ──────────────────────────────────────────────────────
function StepIntro({ onNext, onBack }) {
  return (
    <div className={styles.stepWrap}>
      <div className={styles.introIcon}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      </div>
      <h2 className={styles.introTitle}>Crie seu grupo</h2>
      <p className={styles.introSub}>
        Reúna torcedores do seu bairro, organize caronas e vá junto ao estádio com quem você conhece.
      </p>

      <div className={styles.benefitsList}>
        {[
          { icon: '🚌', text: 'Organize caronas para os jogos' },
          { icon: '📍', text: 'Conecte torcedores da sua região' },
          { icon: '👑', text: 'Você será o líder do grupo' },
          { icon: '🔒', text: 'Limite de 100 membros por grupo' },
        ].map(b => (
          <div key={b.text} className={styles.benefitItem}>
            <span className={styles.benefitEmoji}>{b.icon}</span>
            <span className={styles.benefitText}>{b.text}</span>
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

// ─── Etapa 2: Dados básicos ───────────────────────────────────────────────────
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
          <label className={styles.label}>Nome do grupo *</label>
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
          <label className={styles.label}>Time *</label>
          <select
            className={`${styles.select} ${errors.team ? styles.inputError : ''}`}
            value={fields.team}
            onChange={set('team')}
          >
            <option value="">Selecione o time...</option>
            {TIMES_RJ.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.team && <span className={styles.error}>{errors.team}</span>}
        </div>

        {/* Bairro + Zona */}
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Bairro *</label>
            <input
              className={`${styles.input} ${errors.bairro ? styles.inputError : ''}`}
              placeholder="Ex: Copacabana"
              value={fields.bairro}
              onChange={set('bairro')}
            />
            {errors.bairro && <span className={styles.error}>{errors.bairro}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Zona *</label>
            <select
              className={`${styles.select} ${errors.zona ? styles.inputError : ''}`}
              value={fields.zona}
              onChange={set('zona')}
            >
              <option value="">Zona...</option>
              {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
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

// ─── Etapa 3: Localização ─────────────────────────────────────────────────────
function StepLocalizacao({ onNext, onBack, initial, dados }) {
  const [fields, setFields] = useState(initial || {
    meetPoint: '', privacy: 'public', approvalRequired: false,
  })
  const [locLoading, setLocLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (f) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFields(p => ({ ...p, [f]: val }))
    setErrors(p => ({ ...p, [f]: '' }))
  }

  const getLocation = () => {
    setLocLoading(true)
    navigator.geolocation?.getCurrentPosition(
      () => { setLocLoading(false) },
      () => { setLocLoading(false) }
    )
  }

  const validate = () => {
    const e = {}
    if (!fields.meetPoint.trim()) e.meetPoint = 'Informe o ponto de encontro'
    return e
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onNext(fields)
  }

  return (
    <div className={styles.stepWrap}>
      <h2 className={styles.stepTitle}>Localização</h2>
      <p className={styles.stepSub}>Onde seu grupo se reúne?</p>

      {/* Resumo dos dados anteriores */}
      <div className={styles.resumoCard}>
        <span className={styles.resumoLabel}>Grupo</span>
        <span className={styles.resumoValue}>{dados.name}</span>
        <span className={styles.resumoLabel}>Time</span>
        <span className={styles.resumoValue}>{dados.team} • {dados.bairro}, {dados.zona}</span>
      </div>

      <div className={styles.form}>
        {/* Ponto de encontro */}
        <div className={styles.field}>
          <label className={styles.label}>Ponto de encontro *</label>
          <input
            className={`${styles.input} ${errors.meetPoint ? styles.inputError : ''}`}
            placeholder="Ex: Av. Atlântica, 3000 — em frente ao posto"
            value={fields.meetPoint}
            onChange={set('meetPoint')}
          />
          {errors.meetPoint && <span className={styles.error}>{errors.meetPoint}</span>}
        </div>

        {/* Botão localização */}
        <button
          type="button"
          className={styles.btnLocation}
          onClick={getLocation}
          disabled={locLoading}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {locLoading ? 'Detectando...' : 'Usar minha localização'}
        </button>

        {/* Privacidade */}
        <div className={styles.field}>
          <label className={styles.label}>Privacidade</label>
          <div className={styles.radioGroup}>
            {[
              { value: 'public',  label: 'Público',  desc: 'Aparece na busca para todos' },
              { value: 'private', label: 'Privado',   desc: 'Apenas por convite' },
            ].map(opt => (
              <label
                key={opt.value}
                className={`${styles.radioCard} ${fields.privacy === opt.value ? styles.radioCardActive : ''}`}
              >
                <input
                  type="radio" name="privacy" value={opt.value}
                  checked={fields.privacy === opt.value}
                  onChange={set('privacy')}
                  className={styles.radioInput}
                />
                <div>
                  <span className={styles.radioLabel}>{opt.label}</span>
                  <span className={styles.radioDesc}>{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Aprovação manual */}
        <label className={styles.checkCard}>
          <input
            type="checkbox"
            checked={fields.approvalRequired}
            onChange={set('approvalRequired')}
            className={styles.checkInput}
          />
          <div>
            <span className={styles.checkLabel}>Aprovação manual de membros</span>
            <span className={styles.checkDesc}>Você aprova cada solicitação de entrada</span>
          </div>
          <div className={`${styles.checkBox} ${fields.approvalRequired ? styles.checkBoxActive : ''}`}>
            {fields.approvalRequired && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            )}
          </div>
        </label>
      </div>

      <button className={styles.btnPrimary} onClick={handleNext}>Revisar e criar →</button>
      <button className={styles.btnBack} onClick={onBack}>← Voltar</button>
    </div>
  )
}

// ─── Etapa 4: Confirmação e envio ─────────────────────────────────────────────
function StepConfirm({ dados, localizacao, onConfirm, loading }) {
  const rows = [
    ['Nome',          dados.name],
    ['Time',          dados.team],
    ['Bairro',        `${dados.bairro}, ${dados.zona}`],
    ['Ponto',         localizacao.meetPoint],
    ['Privacidade',   localizacao.privacy === 'public' ? 'Público' : 'Privado'],
    ['Aprovação',     localizacao.approvalRequired ? 'Manual' : 'Automática'],
  ]
  if (dados.description) rows.splice(3, 0, ['Descrição', dados.description])

  return (
    <div className={styles.stepWrap}>
      <div className={styles.confirmIcon}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
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
          : '🚀 Criar grupo'
        }
      </button>
    </div>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function CriarGrupoScreen() {
  const navigate = useNavigate()
  const { user } = useUser()
  const toast    = useToast()

  const [step,        setStep]        = useState(0) // 0=intro 1=dados 2=local 3=confirm
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

      toast.success(`Grupo "${dados.name}" criado com sucesso! 🎉`)
      navigate(ROUTES.GRUPOS)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.closeBtn} onClick={() => navigate(ROUTES.GRUPOS)} aria-label="Fechar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Criar grupo</span>
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {/* Conteúdo por etapa */}
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
