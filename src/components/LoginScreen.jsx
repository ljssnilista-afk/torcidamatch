import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../utils/constants'
import { registerUser, loginUser } from '../services/authApi'
import styles from './LoginScreen.module.css'

const teamLogoUrl = (apiId) =>
  `https://torcida-match-api-production.up.railway.app/api/bsd/img/team/${apiId}/`

const CLUBES_RJ = [
  { id: 'botafogo',      name: 'Botafogo',      tipo: 'grande',      emoji: '⭐', cores: ['#1a1a1a','#fff'], apiId: 1958 },
  { id: 'flamengo',     name: 'Flamengo',       tipo: 'grande',      emoji: '🔴', cores: ['#CC0000','#fff'], apiId: 5981 },
  { id: 'fluminense',   name: 'Fluminense',     tipo: 'grande',      emoji: '🟤', cores: ['#8B1A1A','#fff'], apiId: 1961 },
  { id: 'vasco',        name: 'Vasco da Gama',  tipo: 'grande',      emoji: '⚔️', cores: ['#1a1a1a','#fff'], apiId: 1974 },
  { id: 'america',      name: 'América-RJ',     tipo: 'tradicional', emoji: '🟡', cores: ['#FFD700','#000'] },
  { id: 'bangu',        name: 'Bangu',          tipo: 'tradicional', emoji: '⚪', cores: ['#cc0000','#fff'] },
  { id: 'bonsucesso',   name: 'Bonsucesso',     tipo: 'tradicional', emoji: '🔵', cores: ['#003399','#fff'] },
  { id: 'campo-grande', name: 'Campo Grande',   tipo: 'tradicional', emoji: '🟢', cores: ['#006400','#fff'] },
  { id: 'madureira',    name: 'Madureira',      tipo: 'tradicional', emoji: '🟠', cores: ['#FF6600','#000'] },
  { id: 'olaria',       name: 'Olaria',         tipo: 'tradicional', emoji: '⚫', cores: ['#222','#FFD700'] },
  { id: 'portuguesa',   name: 'Portuguesa-RJ',  tipo: 'tradicional', emoji: '🟩', cores: ['#006400','#fff'] },
  { id: 'sao-cristovao',name: 'São Cristóvão',  tipo: 'tradicional', emoji: '🔵', cores: ['#003399','#FFD700'] },
  { id: 'volta-redonda',name: 'Volta Redonda',  tipo: 'interior',    emoji: '⚫', cores: ['#111','#CC0000'] },
  { id: 'americano',    name: 'Americano',      tipo: 'interior',    emoji: '🔴', cores: ['#CC0000','#fff'] },
  { id: 'boavista',     name: 'Boavista-RJ',    tipo: 'interior',    emoji: '🔴', cores: ['#CC0000','#111'] },
  { id: 'cabofriense',  name: 'Cabofriense',    tipo: 'interior',    emoji: '🔵', cores: ['#003399','#fff'] },
  { id: 'nova-iguacu',  name: 'Nova Iguaçu',    tipo: 'interior',    emoji: '🟡', cores: ['#FFD700','#111'] },
  { id: 'friburguense', name: 'Friburguense',   tipo: 'interior',    emoji: '🟢', cores: ['#006400','#fff'] },
  { id: 'goytacaz',     name: 'Goytacaz',       tipo: 'interior',    emoji: '⚫', cores: ['#111','#fff'] },
  { id: 'serrano',      name: 'Serrano',        tipo: 'interior',    emoji: '🔴', cores: ['#CC0000','#111'] },
]

const ZONAS = ['Zona Sul', 'Zona Norte', 'Zona Oeste', 'Centro', 'Niterói', 'Baixada', 'Interior']

// ─── Input com label flutuante ────────────────────────────────────────────────
function Field({ id, label, type = 'text', value, onChange, error, prefix, icon, maxLength }) {
  const [focused, setFocused] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const hasValue = value !== undefined && String(value).length > 0
  const isFloat  = focused || hasValue
  const isPw     = type === 'password'

  return (
    <div className={`${styles.field} ${error ? styles.fieldError : ''} ${focused ? styles.fieldFocused : ''}`}>
      {icon && <span className={styles.fieldIcon}>{icon}</span>}
      {prefix && isFloat && <span className={styles.fieldPrefix}>{prefix}</span>}
      <input
        id={id}
        type={isPw ? (showPw ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={!isFloat && !prefix ? '' : ''}
        className={`${styles.fieldInput} ${icon ? styles.fieldInputIcon : ''} ${(prefix && isFloat) ? styles.fieldInputPrefix : ''}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={isPw ? 'current-password' : 'on'}
      />
      {!isFloat && (
        <label htmlFor={id} className={styles.fieldLabel} style={{ left: icon ? 44 : 14 }}>
          {label}
        </label>
      )}
      {isFloat && (
        <label htmlFor={id} className={`${styles.fieldLabel} ${styles.fieldLabelFloat}`}>
          {label}
        </label>
      )}
      {isPw && (
        <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(p => !p)} tabIndex={-1}>
          {showPw
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      )}
      {error && <span className={styles.fieldErr}>{error}</span>}
    </div>
  )
}

// ─── Indicador de etapas ──────────────────────────────────────────────────────
function Steps({ current, total }) {
  return (
    <div className={styles.steps}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`${styles.step} ${i === current ? styles.stepActive : i < current ? styles.stepDone : ''}`} />
      ))}
    </div>
  )
}

// ─── Etapa 1: Dados pessoais ──────────────────────────────────────────────────
function StepDados({ onNext, onBack }) {
  const [f, setF] = useState({ name: '', age: '', bairro: '', zona: '', username: '', email: '', password: '', confirm: '' })
  const [errs, setErrs] = useState({})

  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErrs(p => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!f.name.trim())        e.name    = 'Informe seu nome'
    if (!f.age || f.age < 1)   e.age     = 'Informe sua idade'
    if (!f.bairro.trim())      e.bairro  = 'Informe seu bairro'
    if (!f.zona)               e.zona    = 'Selecione sua zona'
    if (!f.username.trim())    e.username= 'Escolha um @ID'
    if (!f.email.trim())       e.email   = 'E-mail obrigatório'
    if (f.password.length < 6) e.password= 'Mínimo 6 caracteres'
    if (f.password !== f.confirm) e.confirm = 'Senhas não conferem'
    return e
  }

  const next = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrs(e); return }
    onNext({ ...f, username: f.username.replace('@', '') })
  }

  return (
    <div className={styles.regWrap}>
      <div className={styles.regTop}>
        <button className={styles.regBack} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <Steps current={0} total={3} />
      </div>
      <h2 className={styles.regTitle}>Criar conta</h2>
      <p className={styles.regSub}>Preencha seus dados para começar</p>

      <div className={styles.regForm}>
        <Field id="rn" label="Nome completo" value={f.name} onChange={set('name')} error={errs.name}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />

        <div className={styles.row2}>
          <Field id="ra" label="Idade" type="number" value={f.age} onChange={set('age')} error={errs.age} maxLength={3} />
          <div className={`${styles.field} ${errs.zona ? styles.fieldError : ''}`}>
            <select className={styles.fieldSelect} value={f.zona} onChange={set('zona')}>
              <option value="">Zona</option>
              {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            {errs.zona && <span className={styles.fieldErr}>{errs.zona}</span>}
          </div>
        </div>

        <Field id="rb" label="Bairro" value={f.bairro} onChange={set('bairro')} error={errs.bairro}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>} />

        <Field id="ru" label="ID de usuário" value={f.username} onChange={set('username')} error={errs.username} prefix="@" />

        <Field id="re" label="E-mail" type="email" value={f.email} onChange={set('email')} error={errs.email}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} />

        <Field id="rp" label="Senha" type="password" value={f.password} onChange={set('password')} error={errs.password} />
        <Field id="rc" label="Confirmar senha" type="password" value={f.confirm} onChange={set('confirm')} error={errs.confirm} />
      </div>

      <button className={styles.btnPrimary} onClick={next}>Próximo →</button>
    </div>
  )
}

// ─── Etapa 2: Seleção de clube ────────────────────────────────────────────────
function StepClube({ onNext, onBack }) {
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')

  const groups = { grande: [], tradicional: [], interior: [] }
  CLUBES_RJ
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .forEach(c => groups[c.tipo]?.push(c))

  const labels = { grande: '🏆 4 Grandes', tradicional: '🏟️ Tradicionais', interior: '📍 Interior' }

  return (
    <div className={styles.regWrap}>
      <div className={styles.regTop}>
        <button className={styles.regBack} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <Steps current={1} total={3} />
      </div>
      <h2 className={styles.regTitle}>Seu clube</h2>
      <p className={styles.regSub}>Escolha o time do seu coração</p>

      <div className={styles.clubeSearch}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 3.5 3.5"/></svg>
        <input placeholder="Buscar clube..." onChange={e => setSearch(e.target.value)} className={styles.clubeSearchInput} />
      </div>

      <div className={styles.clubeScroll}>
        {Object.entries(groups).map(([tipo, list]) => list.length > 0 && (
          <div key={tipo}>
            <p className={styles.clubeGroupLabel}>{labels[tipo]}</p>
            <div className={styles.clubeGrid}>
              {list.map(clube => (
                <button
                  key={clube.id}
                  className={`${styles.clubeCard} ${selected?.id === clube.id ? styles.clubeCardSelected : ''}`}
                  onClick={() => setSelected(clube)}
                >
                  <div className={styles.clubeImgWrap}>
                    {clube.apiId ? (
                      <img
                        src={teamLogoUrl(clube.apiId)}
                        alt={clube.name}
                        className={styles.clubeLogo}
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
                      />
                    ) : null}
                    <div
                      className={styles.clubeShield}
                      style={{ background: clube.cores[0], color: clube.cores[1], display: clube.apiId ? 'none' : 'flex' }}
                    >
                      {clube.name.slice(0,2).toUpperCase()}
                    </div>
                    {selected?.id === clube.id && (
                      <div className={styles.clubeCheck}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
                      </div>
                    )}
                  </div>
                  <span className={styles.clubeName}>{clube.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.clubeFooter}>
        {selected && (
          <div className={styles.clubeSelected}>
            <span>✓ {selected.name} {selected.emoji}</span>
          </div>
        )}
        <button
          className={`${styles.btnPrimary} ${!selected ? styles.btnDisabled : ''}`}
          onClick={() => selected && onNext({ team: selected.name, teamEmoji: selected.emoji, teamId: selected.id })}
          disabled={!selected}
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}

// ─── Etapa 3: Confirmação ─────────────────────────────────────────────────────
function StepConfirm({ dados, onConfirm, loading }) {
  return (
    <div className={styles.regWrap}>
      <div className={styles.regTop}>
        <div />
        <Steps current={2} total={3} />
      </div>

      <div className={styles.confirmHero}>
        <div className={styles.confirmIcon}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        </div>
        <h2 className={styles.regTitle}>Tudo certo!</h2>
        <p className={styles.regSub}>Confirme os dados da sua conta</p>
      </div>

      <div className={styles.confirmCard}>
        {[
          ['👤 Nome',   dados.name],
          ['⚽ Time',   `${dados.team} ${dados.teamEmoji}`],
          ['📍 Bairro', `${dados.bairro} • ${dados.zona}`],
          ['✉️ E-mail', dados.email],
        ].map(([label, value]) => (
          <div key={label} className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{label}</span>
            <span className={styles.confirmValue}>{value}</span>
          </div>
        ))}
      </div>

      <button className={`${styles.btnPrimary} ${loading ? styles.btnLoading : ''}`} onClick={onConfirm} disabled={loading}>
        {loading
          ? <span className={styles.dots}><span/><span/><span/></span>
          : '🖤 Criar minha conta'
        }
      </button>
    </div>
  )
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function LoginScreen() {
  const navigate = useNavigate()
  const { login } = useUser()
  const toast     = useToast()

  const [mode,     setMode]     = useState('login')
  const [regDados, setRegDados] = useState({})
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginUser(email, password)
      // Normaliza _id → id para uso consistente no app
      const userData = { ...res.user, id: res.user._id || res.user.id, token: res.token }
      login(userData)
      toast.success('Bem-vindo de volta!')
      navigate(ROUTES.HOME)
    } catch (err) {
      toast.error(err.message || 'Erro ao entrar')
    } finally { setLoading(false) }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await registerUser({
        name: regDados.name, age: Number(regDados.age),
        bairro: regDados.bairro, zona: regDados.zona,
        handle: regDados.username, email: regDados.email,
        password: regDados.password, team: regDados.team,
        teamEmoji: regDados.teamEmoji, teamId: regDados.teamId,
      })
      // Normaliza _id → id
      const userData = { ...res.user, id: res.user._id || res.user.id, token: res.token }
      login(userData)
      toast.success(`Conta criada! ${regDados.teamEmoji}`)
      navigate(ROUTES.HOME)
    } catch (err) {
      toast.error(err.message || 'Erro no cadastro')
    } finally { setLoading(false) }
  }

  // ── Fluxo de cadastro ──────────────────────────────────────────────────────
  if (mode === 'register-dados') return (
    <div className={styles.screen}>
      <div className={styles.regLogo}><span className={styles.brandName}>Torcida<em>Match</em></span></div>
      <StepDados onNext={d => { setRegDados(d); setMode('register-clube') }} onBack={() => setMode('login')} />
    </div>
  )
  if (mode === 'register-clube') return (
    <div className={styles.screen}>
      <div className={styles.regLogo}><span className={styles.brandName}>Torcida<em>Match</em></span></div>
      <StepClube onNext={c => { setRegDados(p => ({...p,...c})); setMode('register-confirm') }} onBack={() => setMode('register-dados')} />
    </div>
  )
  if (mode === 'register-confirm') return (
    <div className={styles.screen}>
      <div className={styles.regLogo}><span className={styles.brandName}>Torcida<em>Match</em></span></div>
      <StepConfirm dados={regDados} onConfirm={handleConfirm} loading={loading} />
    </div>
  )

  // ── Tela de login ──────────────────────────────────────────────────────────
  return (
    <div className={styles.screen}>
      {/* Fundo decorativo */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgGlow1}/>
        <div className={styles.bgGlow2}/>
        <div className={styles.bgGrid}/>
      </div>

      <div className={styles.loginWrap}>
        {/* Logo */}
        <div className={styles.logoBlock}>
          <div className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--color-danger)" stroke="var(--color-danger)" strokeWidth="1.2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </div>
          <h1 className={styles.brandName}>Torcida<em>Match</em></h1>
          <p className={styles.tagline}>Conecte-se. Torça junto. Vá ao estádio.</p>
        </div>

        {/* Formulário */}
        <div className={styles.loginCard}>
          <form onSubmit={handleLogin} noValidate>
            <Field
              id="le" label="E-mail" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
            />
            <Field
              id="lp" label="Senha" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <div className={styles.forgotRow}>
              <button type="button" className={styles.forgotBtn}>Esqueci a senha</button>
            </div>
            <button type="submit" className={`${styles.btnPrimary} ${loading ? styles.btnLoading : ''}`} disabled={loading}>
              {loading ? <span className={styles.dots}><span/><span/><span/></span> : 'Entrar'}
            </button>
          </form>

          <div className={styles.divider}><div className={styles.divLine}/><span>ou</span><div className={styles.divLine}/></div>

          <button
            className={styles.demoBtn}
            onClick={() => { setEmail('bianca@torcida.com'); setPassword('123456') }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Acesso rápido (demo)
          </button>
        </div>

        {/* Hint de teste */}
        <div className={styles.hintBox}>
          <span className={styles.hintLabel}>CREDENCIAIS DE TESTE</span>
          <span className={styles.hintValue}>bianca@torcida.com / 123456</span>
        </div>

        {/* Cadastro */}
        <p className={styles.signupText}>
          Não tem conta?{' '}
          <button className={styles.signupBtn} onClick={() => setMode('register-dados')}>
            Cadastre-se grátis →
          </button>
        </p>
      </div>
    </div>
  )
}
