import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../utils/constants'
import { registerUser, loginUser } from '../services/authApi'
import styles from './LoginScreen.module.css'

// URL de imagem via proxy Railway (sem CORS)
const teamLogoUrl = (apiId) =>
  `https://torcida-match-api-production.up.railway.app/api/bsd/img/team/${apiId}/`

// ─── 20 clubes do RJ ──────────────────────────────────────────────────────────
const CLUBES_RJ = [
  { id: 'botafogo',     name: 'Botafogo',      cidade: 'Rio de Janeiro', tipo: 'grande',      emoji: '⭐', cores: ['#111','#fff'],     apiId: 1958 },
  { id: 'flamengo',    name: 'Flamengo',       cidade: 'Rio de Janeiro', tipo: 'grande',      emoji: '🔴', cores: ['#CC0000','#000'], apiId: 5981 },
  { id: 'fluminense',  name: 'Fluminense',     cidade: 'Rio de Janeiro', tipo: 'grande',      emoji: '🟤', cores: ['#8B1A1A','#fff'], apiId: 1961 },
  { id: 'vasco',       name: 'Vasco da Gama',  cidade: 'Rio de Janeiro', tipo: 'grande',      emoji: '⚔️', cores: ['#000','#fff'],     apiId: 1974 },
  { id: 'america',     name: 'América-RJ',     cidade: 'Rio de Janeiro', tipo: 'tradicional', emoji: '🟡', cores: ['#FFD700','#000'] },
  { id: 'bangu',       name: 'Bangu',          cidade: 'Rio de Janeiro', tipo: 'tradicional', emoji: '⚪', cores: ['#fff','#CC0000'] },
  { id: 'bonsucesso',  name: 'Bonsucesso',     cidade: 'Rio de Janeiro', tipo: 'tradicional', emoji: '🔵', cores: ['#003399','#fff'] },
  { id: 'campo-grande',name: 'Campo Grande',   cidade: 'Rio de Janeiro', tipo: 'tradicional', emoji: '🟢', cores: ['#006400','#fff'] },
  { id: 'madureira',   name: 'Madureira',      cidade: 'Rio de Janeiro', tipo: 'tradicional', emoji: '🟠', cores: ['#FF6600','#000'] },
  { id: 'olaria',      name: 'Olaria',         cidade: 'Rio de Janeiro', tipo: 'tradicional', emoji: '⚫', cores: ['#000','#FFD700'] },
  { id: 'portuguesa',  name: 'Portuguesa-RJ',  cidade: 'Rio de Janeiro', tipo: 'tradicional', emoji: '🟩', cores: ['#006400','#CC0000'] },
  { id: 'sao-cristovao',name:'São Cristóvão',  cidade: 'Rio de Janeiro', tipo: 'tradicional', emoji: '🔵', cores: ['#003399','#FFD700'] },
  { id: 'volta-redonda',name:'Volta Redonda',  cidade: 'Volta Redonda',  tipo: 'interior',    emoji: '⚫', cores: ['#000','#CC0000'] },
  { id: 'americano',   name: 'Americano',      cidade: 'Campos',         tipo: 'interior',    emoji: '🔴', cores: ['#CC0000','#fff'] },
  { id: 'boavista',    name: 'Boavista-RJ',    cidade: 'Saquarema',      tipo: 'interior',    emoji: '🔴', cores: ['#CC0000','#000'] },
  { id: 'cabofriense', name: 'Cabofriense',    cidade: 'Cabo Frio',      tipo: 'interior',    emoji: '🔵', cores: ['#003399','#fff'] },
  { id: 'nova-iguacu', name: 'Nova Iguaçu',    cidade: 'Nova Iguaçu',    tipo: 'interior',    emoji: '🟡', cores: ['#FFD700','#000'] },
  { id: 'friburguense',name: 'Friburguense',   cidade: 'Nova Friburgo',  tipo: 'interior',    emoji: '🟢', cores: ['#006400','#fff'] },
  { id: 'goytacaz',    name: 'Goytacaz',       cidade: 'Campos',         tipo: 'interior',    emoji: '⚫', cores: ['#000','#fff'] },
  { id: 'serrano',     name: 'Serrano',        cidade: 'Petrópolis',     tipo: 'interior',    emoji: '🔴', cores: ['#CC0000','#000'] },
]
const TIPO_LABELS = { grande: '4 Grandes', tradicional: 'Tradicionais', interior: 'Interior' }

// ─── Componentes Auxiliares ─────────────────────────────────────────────────
function InputField({ id, label, type='text', value, onChange, onBlur, autoComplete, error, success, hint, inputRef, maxLength, prefix }) {
  const [focused, setFocused] = useState(false)
  const isFloating = focused || (value !== undefined && value !== null && String(value).length > 0)

  return (
    <div className={`${styles.inputWrap} ${error ? styles.inputWrapError : ''} ${success ? styles.inputWrapSuccess : ''}`}>
      <div className={styles.inputInner}>
        {prefix && <span className={styles.inputPrefix}>{prefix}</span>}
        <input
          ref={inputRef} id={id} type={type} value={value}
          autoComplete={autoComplete}
          maxLength={maxLength}
          placeholder={!isFloating ? label : ''}
          className={`${styles.input} ${prefix ? styles.inputWithPrefix : ''}`}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.() }}
          onChange={onChange}
        />
        {isFloating && <label htmlFor={id} className={styles.inputLabelFloat}>{label}</label>}
      </div>
      {error && <span className={styles.inputError} role="alert">{error}</span>}
      {!error && hint && <span className={styles.inputHint}>{hint}</span>}
    </div>
  )
}

function StepDados({ onNext, onBack }) {
  const [fields, setFields] = useState({ name: '', age: '', bairro: '', zona: '', username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)

  const set = (field) => (e) => {
    setFields(p => ({ ...p, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!fields.name.trim()) e.name = 'Informe seu nome'
    if (!fields.age) e.age = 'Informe sua idade'
    if (!fields.bairro.trim()) e.bairro = 'Informe seu bairro'
    if (!fields.zona.trim()) e.zona = 'Informe sua zona'
    if (!fields.username.trim()) e.username = 'Escolha um ID'
    if (!fields.email.trim()) e.email = 'E-mail obrigatório'
    if (fields.password.length < 6) e.password = 'Mínimo 6 caracteres'
    if (fields.password !== fields.confirm) e.confirm = 'Senhas não conferem'
    return e
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onNext({ ...fields, username: fields.username.replace('@', '') })
  }

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHeader}>
        <button className={styles.backLink} onClick={onBack}>← Voltar</button>
      </div>
      <h2 className={styles.stepTitle}>Criar conta</h2>
      <div className={styles.form}>
        <InputField id="r-name" label="Nome completo" value={fields.name} onChange={set('name')} error={errors.name} />
        <div className={styles.row2}>
          <InputField id="r-age" label="Idade" type="number" value={fields.age} onChange={set('age')} error={errors.age} />
          <InputField id="r-zona" label="Zona" value={fields.zona} onChange={set('zona')} error={errors.zona} />
        </div>
        <InputField id="r-bairro" label="Bairro" value={fields.bairro} onChange={set('bairro')} error={errors.bairro} />
        <InputField id="r-username" label="ID de usuário" value={fields.username} prefix="@" onChange={set('username')} error={errors.username} />
        <InputField id="r-email" label="E-mail" type="email" value={fields.email} onChange={set('email')} error={errors.email} />
        <InputField id="r-pass" label="Senha" type={showPass ? 'text' : 'password'} value={fields.password} onChange={set('password')} error={errors.password} />
        <InputField id="r-confirm" label="Confirmar senha" type={showPass ? 'text' : 'password'} value={fields.confirm} onChange={set('confirm')} error={errors.confirm} />
        <button className={styles.submitBtn} onClick={handleNext}>Próximo →</button>
      </div>
    </div>
  )
}

function StepClube({ onNext, onBack }) {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const filtered = CLUBES_RJ.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHeader}><button className={styles.backLink} onClick={onBack}>← Voltar</button></div>
      <h2 className={styles.stepTitle}>Seu clube</h2>
      <input className={styles.clubeSearchInput} placeholder="Buscar clube..." onChange={e => setSearch(e.target.value)} />
      <div className={styles.clubeList}>
        <div className={styles.clubeGrid}>
          {filtered.map(clube => (
            <button key={clube.id} className={`${styles.clubeCard} ${selected?.id === clube.id ? styles.clubeCardSelected : ''}`} onClick={() => setSelected(clube)}>
              <span className={styles.clubeName}>{clube.emoji} {clube.name}</span>
            </button>
          ))}
        </div>
      </div>
      <button className={styles.submitBtn} onClick={() => onNext({ team: selected.name, teamEmoji: selected.emoji, teamId: selected.id })} disabled={!selected}>Próximo →</button>
    </div>
  )
}

function StepConfirm({ dados, onConfirm, loading }) {
  return (
    <div className={styles.stepWrap}>
      <h2 className={styles.stepTitle}>Tudo certo!</h2>
      <div className={styles.confirmCard}>
        <p><strong>Nome:</strong> {dados.name}</p>
        <p><strong>Time:</strong> {dados.team} {dados.teamEmoji}</p>
        <p><strong>E-mail:</strong> {dados.email}</p>
      </div>
      <button className={styles.submitBtn} onClick={onConfirm} disabled={loading}>
        {loading ? 'Criando conta...' : 'Criar minha conta 🖤'}
      </button>
    </div>
  )
}

// ─── TELA PRINCIPAL ─────────────────────────────────────────────────────────
export default function LoginScreen() {
  const navigate = useNavigate()
  const { login } = useUser()
  const toast = useToast()

  const [mode, setMode] = useState('login')
  const [regDados, setRegDados] = useState({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // 1. LOGIN REAL
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginUser(email, password)
      login({ ...res.user, token: res.token })
      toast.success(`Bem-vindo de volta!`)
      navigate(ROUTES.HOME)
    } catch (err) {
      toast.error(err.message || 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  // 2. CADASTRO REAL
  const handleConfirm = async () => {
    setLoading(true)
    try {
      const finalData = {
        name: regDados.name,
        age: Number(regDados.age),
        bairro: regDados.bairro,
        zona: regDados.zona,
        handle: regDados.username,
        email: regDados.email,
        password: regDados.password,
        team: regDados.team,
        teamEmoji: regDados.teamEmoji,
        teamId: regDados.teamId
      }

      const res = await registerUser(finalData)
      login({ ...res.user, token: res.token })
      toast.success(`Conta criada com sucesso! ${regDados.teamEmoji}`)
      navigate(ROUTES.HOME)
    } catch (err) {
      toast.error(err.message || 'Erro no cadastro')
    } finally {
      setLoading(false)
    }
  }

  const registerShell = (child) => (
    <div className={styles.screen}>
      <div className={styles.content}>
        <div className={styles.brand}><h1 className={styles.brandName}>Torcida<em>Match</em></h1></div>
        {child}
      </div>
    </div>
  )

  if (mode === 'register-dados') return registerShell(<StepDados onNext={(d) => { setRegDados(d); setMode('register-clube') }} onBack={() => setMode('login')} />)
  if (mode === 'register-clube') return registerShell(<StepClube onNext={(c) => { setRegDados(p => ({...p, ...c})); setMode('register-confirm') }} onBack={() => setMode('register-dados')} />)
  if (mode === 'register-confirm') return registerShell(<StepConfirm dados={regDados} onConfirm={handleConfirm} loading={loading} />)

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <div className={styles.brand}><h1 className={styles.brandName}>Torcida<em>Match</em></h1></div>
        <form className={styles.form} onSubmit={handleLogin}>
          <InputField label="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <InputField label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
        <p className={styles.registerText}>Não tem conta? <button onClick={() => setMode('register-dados')} className={styles.registerBtn}>Cadastre-se</button></p>
      </div>
    </div>
  )
}