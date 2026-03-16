import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../utils/constants'
import { teamLogoUrl } from '../utils/bsdApi'
import styles from './LoginScreen.module.css'

// ─── Mock credentials ─────────────────────────────────────────────────────────
const MOCK_USERS = [
  { email: 'bianca@torcida.com', password: '123456', name: 'Bianca Rodrigues', initials: 'BR', team: 'Botafogo' },
  { email: 'carlos@torcida.com', password: '123456', name: 'Carlos Eduardo',   initials: 'CE', team: 'Botafogo' },
  { email: 'teste@email.com',    password: '123456', name: 'Usuário Teste',    initials: 'UT', team: 'Botafogo' },
]

// IDs de usuário já "em uso" no mock
const MOCK_USERNAMES = ['biancard23', 'carlose', 'torcedor10', 'fogao99', 'alvinegro']

// ─── 20 clubes do RJ ──────────────────────────────────────────────────────────
const CLUBES_RJ = [
  { id: 'botafogo',     name: 'Botafogo',      cidade: 'Rio de Janeiro', tipo: 'grande',      emoji: '⭐', cores: ['#111','#fff'],    apiId: 1958 },
  { id: 'flamengo',    name: 'Flamengo',       cidade: 'Rio de Janeiro', tipo: 'grande',      emoji: '🔴', cores: ['#CC0000','#000'], apiId: 5981 },
  { id: 'fluminense',  name: 'Fluminense',     cidade: 'Rio de Janeiro', tipo: 'grande',      emoji: '🟤', cores: ['#8B1A1A','#fff'], apiId: 1961 },
  { id: 'vasco',       name: 'Vasco da Gama',  cidade: 'Rio de Janeiro', tipo: 'grande',      emoji: '⚔️', cores: ['#000','#fff'],    apiId: 1974 },
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

// ─── Input com floating label ─────────────────────────────────────────────────
function InputField({ id, label, type='text', value, onChange, onBlur, autoComplete, error, success, hint, inputRef, maxLength, prefix }) {
  const [focused, setFocused] = useState(false)
  // Label flutua se focado OU se tem valor
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
          aria-label={label}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={!!error}
        />
        {isFloating && (
          <label htmlFor={id} className={styles.inputLabelFloat}>
            {label}
          </label>
        )}
        {success && (
          <span className={styles.inputSuccessIcon} aria-label="Disponível">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </span>
        )}
      </div>
      {error && <span id={`${id}-error`} className={styles.inputError} role="alert">{error}</span>}
      {!error && hint && <span id={`${id}-hint`} className={styles.inputHint}>{hint}</span>}
    </div>
  )
}

// ─── Etapa 1: Dados pessoais ──────────────────────────────────────────────────
function StepDados({ onNext, onBack }) {
  const [fields, setFields] = useState({
    name: '', age: '', bairro: '', zona: '', username: '', email: '', password: '', confirm: ''
  })
  const [errors,  setErrors]  = useState({})
  const [hints,   setHints]   = useState({})
  const [showPass, setShowPass] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const usernameTimer = useRef(null)

  const set = (field) => (e) => {
    setFields(p => ({ ...p, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: '' }))
    setHints(p => ({ ...p, [field]: '' }))
  }

  // Verificação de username em tempo real (mock)
  const checkUsername = useCallback((val) => {
    const clean = val.replace(/^@/, '').toLowerCase().trim()
    if (!clean || clean.length < 3) return
    setUsernameChecking(true)
    clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(() => {
      setUsernameChecking(false)
      if (MOCK_USERNAMES.includes(clean)) {
        setErrors(p => ({ ...p, username: `@${clean} já está em uso` }))
        setHints(p => ({ ...p, username: '' }))
      } else {
        setErrors(p => ({ ...p, username: '' }))
        setHints(p => ({ ...p, username: `@${clean} está disponível ✓` }))
      }
    }, 600)
  }, [])

  const validate = () => {
    const e = {}
    if (!fields.name.trim() || fields.name.trim().length < 3) e.name = 'Mínimo 3 caracteres'
    const age = parseInt(fields.age)
    if (!fields.age || isNaN(age) || age < 13) e.age = 'Idade mínima: 13 anos'
    if (age > 100) e.age = 'Idade inválida'
    if (!fields.bairro.trim()) e.bairro = 'Informe seu bairro'
    if (!fields.zona.trim()) e.zona = 'Informe sua zona'
    const user = fields.username.replace(/^@/, '').trim()
    if (!user || user.length < 3) e.username = 'Mínimo 3 caracteres'
    else if (!/^[a-zA-Z0-9_.]+$/.test(user)) e.username = 'Use apenas letras, números, _ ou .'
    else if (MOCK_USERNAMES.includes(user.toLowerCase())) e.username = `@${user} já está em uso`
    if (!fields.email.trim() || !/\S+@\S+\.\S+/.test(fields.email)) e.email = 'E-mail inválido'
    if (!fields.password || fields.password.length < 6) e.password = 'Mínimo 6 caracteres'
    if (fields.password !== fields.confirm) e.confirm = 'Senhas não conferem'
    return e
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const user = fields.username.replace(/^@/, '').trim()
    onNext({
      name:     fields.name.trim(),
      age:      parseInt(fields.age),
      bairro:   fields.bairro.trim(),
      zona:     fields.zona.trim(),
      username: `@${user}`,
      email:    fields.email.trim().toLowerCase(),
      password: fields.password,
    })
  }

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHeader}>
        <button className={styles.backLink} onClick={onBack}>← Voltar ao login</button>
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${styles.stepDotActive}`}/>
          <div className={styles.stepDot}/>
          <div className={styles.stepDot}/>
        </div>
      </div>

      <h2 className={styles.stepTitle}>Criar conta</h2>
      <p className={styles.stepSub}>Dados pessoais</p>

      <div className={styles.form}>
        <InputField id="r-name" label="Nome completo" value={fields.name}
          onChange={set('name')} error={errors.name} />

        <div className={styles.row2}>
          <InputField id="r-age" label="Idade" type="number" value={fields.age}
            onChange={set('age')} error={errors.age} maxLength={3} />
          <InputField id="r-zona" label="Zona (ex: Zona Sul)" value={fields.zona}
            onChange={set('zona')} error={errors.zona} />
        </div>

        <InputField id="r-bairro" label="Bairro" value={fields.bairro}
          onChange={set('bairro')} error={errors.bairro} />

        <InputField
          id="r-username" label="ID de usuário" value={fields.username}
          prefix="@"
          onChange={(e) => { set('username')(e); checkUsername(e.target.value) }}
          error={errors.username}
          hint={usernameChecking ? 'Verificando...' : hints.username}
          success={!errors.username && !!hints.username && hints.username.includes('disponível')}
        />

        <InputField id="r-email" label="E-mail" type="email" value={fields.email}
          onChange={set('email')} autoComplete="email" error={errors.email} />

        <div className={styles.passwordWrap}>
          <InputField id="r-pass" label="Senha" value={fields.password}
            type={showPass ? 'text' : 'password'} autoComplete="new-password"
            onChange={set('password')} error={errors.password} />
          <button type="button" className={styles.eyeBtn}
            onClick={() => setShowPass(v => !v)}
            aria-label={showPass ? 'Ocultar' : 'Mostrar'}>
            {showPass
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>

        <InputField id="r-confirm" label="Confirmar senha" value={fields.confirm}
          type={showPass ? 'text' : 'password'} autoComplete="new-password"
          onChange={set('confirm')} error={errors.confirm} />

        <button className={styles.submitBtn} onClick={handleNext}>
          Próximo →
        </button>
      </div>
    </div>
  )
}

// ─── Etapa 2: Clube ───────────────────────────────────────────────────────────
function StepClube({ onNext, onBack }) {
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')
  const [error,    setError]    = useState('')

  const tipos = ['grande', 'tradicional', 'interior']
  const filtered = search.trim()
    ? CLUBES_RJ.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.cidade.toLowerCase().includes(search.toLowerCase()))
    : CLUBES_RJ

  const handleNext = () => {
    if (!selected) { setError('Selecione seu clube do coração'); return }
    onNext({ team: selected.name, teamId: selected.id, teamEmoji: selected.emoji, teamCores: selected.cores })
  }

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHeader}>
        <button className={styles.backLink} onClick={onBack}>← Voltar</button>
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${styles.stepDotDone}`}/>
          <div className={`${styles.stepDot} ${styles.stepDotActive}`}/>
          <div className={styles.stepDot}/>
        </div>
      </div>

      <h2 className={styles.stepTitle}>Seu clube</h2>
      <p className={styles.stepSub}>Qual é o time do seu coração?</p>

      <div className={styles.clubeSearch}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 3.5 3.5"/>
        </svg>
        <input type="text" value={search} placeholder="Buscar clube..."
          className={styles.clubeSearchInput}
          onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={styles.clubeList}>
        {(search.trim() ? [''] : tipos).map(tipo => {
          const list = search.trim() ? filtered : filtered.filter(c => c.tipo === tipo)
          if (!list.length) return null
          return (
            <div key={tipo} className={styles.clubeGroup}>
              {!search.trim() && <p className={styles.clubeGroupLabel}>{TIPO_LABELS[tipo]}</p>}
              <div className={styles.clubeGrid}>
                {list.map(clube => {
                  const isSel = selected?.id === clube.id
                  return (
                    <button key={clube.id}
                      className={`${styles.clubeCard} ${isSel ? styles.clubeCardSelected : ''}`}
                      onClick={() => { setSelected(clube); setError('') }}
                      aria-pressed={isSel} aria-label={`Selecionar ${clube.name}`}>
                      {clube.apiId ? (
                        <img src={teamLogoUrl(clube.apiId)} alt={clube.name}
                          className={styles.clubeLogo}
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                      ) : null}
                      <div className={styles.clubeShield}
                        style={{ background: clube.cores[0], color: clube.cores[1], display: clube.apiId ? 'none' : 'flex' }}>
                        {clube.name.slice(0,2).toUpperCase()}
                      </div>
                      <span className={styles.clubeName}>{clube.name}</span>
                      <span className={styles.clubeCidade}>{clube.cidade}</span>
                      {isSel && (
                        <div className={styles.clubeCheck}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {error && <p className={styles.clubeError}>{error}</p>}
      {selected && (
        <div className={styles.clubeSelected}>
          Selecionado: <strong>{selected.name}</strong> {selected.emoji}
        </div>
      )}
      <button
        className={`${styles.submitBtn} ${!selected ? styles.submitBtnDisabled : ''}`}
        onClick={handleNext}>
        Próximo →
      </button>
    </div>
  )
}

// ─── Etapa 3: Confirmação ─────────────────────────────────────────────────────
function StepConfirm({ dados, onConfirm, loading }) {
  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHeader}>
        <div/>
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${styles.stepDotDone}`}/>
          <div className={`${styles.stepDot} ${styles.stepDotDone}`}/>
          <div className={`${styles.stepDot} ${styles.stepDotActive}`}/>
        </div>
      </div>

      <div className={styles.confirmIcon}>
        {dados.teamApiId ? (
          <img src={teamLogoUrl(dados.teamApiId)} alt={dados.team}
            className={styles.confirmLogo}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
        ) : null}
        <div className={styles.confirmShield}
          style={{ background: dados.teamCores?.[0]??'#111', color: dados.teamCores?.[1]??'#fff',
                   display: dados.teamApiId ? 'none' : 'flex' }}>
          {dados.team?.slice(0,2).toUpperCase()}
        </div>
      </div>

      <h2 className={styles.stepTitle}>Tudo certo!</h2>
      <p className={styles.stepSub}>Confirme seus dados antes de entrar</p>

      <div className={styles.confirmCard}>
        {[
          ['Nome',     dados.name],
          ['Idade',    `${dados.age} anos`],
          ['Bairro',   dados.bairro],
          ['Zona',     dados.zona],
          ['ID',       dados.username],
          ['E-mail',   dados.email],
          ['Clube',    `${dados.team} ${dados.teamEmoji}`],
        ].map(([label, value]) => (
          <div key={label} className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{label}</span>
            <span className={styles.confirmValue}>{value}</span>
          </div>
        ))}
      </div>

      <button
        className={`${styles.submitBtn} ${loading ? styles.submitBtnLoading : ''}`}
        onClick={onConfirm} disabled={loading} aria-busy={loading}>
        {loading
          ? <span className={styles.loadingDots}><span/><span/><span/></span>
          : 'Criar minha conta 🖤'
        }
      </button>
    </div>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function LoginScreen() {
  const navigate  = useNavigate()
  const { login } = useUser()
  const toast     = useToast()

  const [mode, setMode]       = useState('login')
  const [regDados, setRegDados] = useState({})

  // Login state
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const emailRef = useRef(null)

  useEffect(() => { if (mode === 'login') emailRef.current?.focus() }, [mode])

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!email.trim()) errs.email = 'Informe seu e-mail'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'E-mail inválido'
    if (!password) errs.password = 'Informe sua senha'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setErrors({})
    await new Promise(r => setTimeout(r, 700))
    const match = MOCK_USERS.find(u => u.email === email.trim().toLowerCase() && u.password === password)
    if (match) {
      login({ name: match.name, initials: match.initials, team: match.team, email: match.email })
      toast.success(`Bem-vinda, ${match.name.split(' ')[0]}! 🖤⭐`)
      navigate(ROUTES.HOME)
    } else {
      setLoading(false)
      setErrors({ password: 'E-mail ou senha incorretos' })
      toast.error('Credenciais inválidas')
    }
  }

  // Cadastro handlers
  const handleDadosNext  = (dados) => { setRegDados(dados); setMode('register-clube') }
  const handleClubeNext  = (clube) => {
    const clubeObj = CLUBES_RJ.find(c => c.id === clube.teamId)
    setRegDados(p => ({ ...p, ...clube, teamApiId: clubeObj?.apiId ?? null }))
    setMode('register-confirm')
  }
  const handleConfirm = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    const initials = regDados.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
    login({
      name:      regDados.name,
      initials,
      age:       regDados.age,
      bairro:    regDados.bairro,
      zona:      regDados.zona,
      handle:    regDados.username,
      team:      regDados.team,
      teamEmoji: regDados.teamEmoji,
      email:     regDados.email,
    })
    toast.success(`Bem-vindo, ${regDados.name.split(' ')[0]}! ${regDados.teamEmoji}`)
    navigate(ROUTES.HOME)
  }

  // Shells dos passos de cadastro
  const registerShell = (child) => (
    <div className={styles.screen}>
      <div className={styles.bgDeco} aria-hidden="true">
        <div className={styles.bgCircle1}/><div className={styles.bgCircle2}/>
      </div>
      <div className={`${styles.content} ${mode === 'register-clube' ? styles.contentClube : ''}`}>
        <div className={styles.brand}>
          <h1 className={styles.brandName}>Torcida<em>Match</em></h1>
        </div>
        {child}
      </div>
    </div>
  )

  if (mode === 'register-dados')   return registerShell(<StepDados   onNext={handleDadosNext} onBack={() => setMode('login')} />)
  if (mode === 'register-clube')   return registerShell(<StepClube   onNext={handleClubeNext} onBack={() => setMode('register-dados')} />)
  if (mode === 'register-confirm') return registerShell(<StepConfirm dados={regDados} onConfirm={handleConfirm} loading={loading} />)

  // ── Login ──
  return (
    <div className={styles.screen}>
      <div className={styles.bgDeco} aria-hidden="true">
        <div className={styles.bgCircle1}/><div className={styles.bgCircle2}/>
      </div>
      <div className={styles.content}>
        <div className={styles.brand}>
          <h1 className={styles.brandName}>Torcida<em>Match</em></h1>
          <p className={styles.brandTagline}>Conecte-se com sua torcida. Vá junto ao estádio.</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin} noValidate>
          <div className={`${styles.inputWrap} ${errors.email ? styles.inputWrapError : ''}`}>
            <div className={styles.inputInner}>
              <input ref={emailRef} id="l-email" type="email" value={email}
                autoComplete="email"
                placeholder="E-mail"
                className={styles.input}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:''})) }}
                aria-label="E-mail"
                aria-invalid={!!errors.email} />
            </div>
            {errors.email && <span className={styles.inputError}>{errors.email}</span>}
          </div>

          <div className={styles.passwordWrap}>
            <div className={`${styles.inputWrap} ${errors.password ? styles.inputWrapError : ''}`}>
              <div className={styles.inputInner}>
                <input id="l-pass" type={showPass ? 'text' : 'password'} value={password}
                  autoComplete="current-password"
                  placeholder="Senha"
                  className={styles.input}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password:''})) }}
                  aria-label="Senha"
                  aria-invalid={!!errors.password} />
              </div>
              {errors.password && <span className={styles.inputError}>{errors.password}</span>}
            </div>
            <button type="button" className={styles.eyeBtn}
              onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Ocultar' : 'Mostrar'}>
              {showPass
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>

          <div className={styles.forgotRow}>
            <button type="button" className={styles.forgotBtn}>Esqueci a senha</button>
          </div>

          <button type="submit"
            className={`${styles.submitBtn} ${loading ? styles.submitBtnLoading : ''}`}
            disabled={loading} aria-busy={loading}>
            {loading ? <span className={styles.loadingDots}><span/><span/><span/></span> : 'Entrar'}
          </button>
        </form>

        <div className={styles.divider} aria-hidden="true">
          <div className={styles.dividerLine}/><span className={styles.dividerText}>ou</span><div className={styles.dividerLine}/>
        </div>

        <button type="button" className={styles.demoBtn}
          onClick={() => { setEmail('bianca@torcida.com'); setPassword('123456'); setErrors({}) }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
          Acesso rápido (demo)
        </button>

        <p className={styles.registerText}>
          Não tem conta?{' '}
          <button type="button" className={styles.registerBtn}
            onClick={() => setMode('register-dados')}>
            Cadastre-se
          </button>
        </p>

        <div className={styles.hint}>
          <p className={styles.hintTitle}>Credenciais de teste</p>
          <p className={styles.hintText}>bianca@torcida.com / 123456</p>
        </div>
      </div>
    </div>
  )
}
