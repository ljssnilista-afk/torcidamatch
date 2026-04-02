import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { fetchEvents, teamLogoUrl } from '../utils/bsdApi'
import { ROUTES } from '../utils/constants'
import styles from './CriarViagemScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

function formatGameDate(iso) {
  const d = new Date(iso)
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}
function formatGameTime(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function fmt(d) { return d.toISOString().split('T')[0] }

// Mapa de apiId por time — para filtrar jogos do time certo (ex: Botafogo-RJ vs Botafogo-SP)
const TEAM_API_IDS = {
  'Botafogo':     1958,
  'Flamengo':     5981,
  'Fluminense':   1961,
  'Vasco da Gama':1974,
}

// ─── Vehicle SVGs ───────────────────────────────────────────────────────────
function CarSVG({ active }) {
  const c = active ? '#22C55E' : 'rgba(255,255,255,0.35)'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="22" width="36" height="14" rx="4" stroke={c} strokeWidth="1.5" fill={active ? 'rgba(34,197,94,0.08)' : 'none'}/>
      <path d="M12 22L16 12H32L36 22" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="36" r="3" stroke={c} strokeWidth="1.5"/>
      <circle cx="34" cy="36" r="3" stroke={c} strokeWidth="1.5"/>
      <line x1="10" y1="28" x2="16" y2="28" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="28" x2="38" y2="28" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function VanSVG({ active, locked }) {
  const c = locked ? 'rgba(255,255,255,0.15)' : active ? '#22C55E' : 'rgba(255,255,255,0.35)'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="4" y="16" width="32" height="18" rx="3" stroke={c} strokeWidth="1.5" fill={active ? 'rgba(34,197,94,0.08)' : 'none'}/>
      <path d="M36 24L44 28V34H36" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="36" r="3" stroke={c} strokeWidth="1.5"/>
      <circle cx="34" cy="36" r="3" stroke={c} strokeWidth="1.5"/>
      <line x1="18" y1="16" x2="18" y2="34" stroke={c} strokeWidth="1" opacity="0.4"/>
      <line x1="26" y1="16" x2="26" y2="34" stroke={c} strokeWidth="1" opacity="0.4"/>
    </svg>
  )
}
function BusSVG({ active, locked }) {
  const c = locked ? 'rgba(255,255,255,0.15)' : active ? '#22C55E' : 'rgba(255,255,255,0.35)'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="36" height="26" rx="4" stroke={c} strokeWidth="1.5" fill={active ? 'rgba(34,197,94,0.08)' : 'none'}/>
      <line x1="6" y1="20" x2="42" y2="20" stroke={c} strokeWidth="1" opacity="0.4"/>
      <circle cx="14" cy="38" r="3" stroke={c} strokeWidth="1.5"/>
      <circle cx="34" cy="38" r="3" stroke={c} strokeWidth="1.5"/>
      <rect x="10" y="12" width="6" height="6" rx="1" stroke={c} strokeWidth="1" opacity="0.5"/>
      <rect x="18" y="12" width="6" height="6" rx="1" stroke={c} strokeWidth="1" opacity="0.5"/>
      <rect x="26" y="12" width="6" height="6" rx="1" stroke={c} strokeWidth="1" opacity="0.5"/>
      <rect x="34" y="12" width="6" height="6" rx="1" stroke={c} strokeWidth="1" opacity="0.5"/>
    </svg>
  )
}
const VEHICLE_OPTIONS = [
  { id: 'carro',  label: 'Carro',  maxSeats: 4,  Svg: CarSVG },
  { id: 'van',    label: 'Van',    maxSeats: 15, Svg: VanSVG },
  { id: 'onibus', label: 'Ônibus', maxSeats: 50, Svg: BusSVG },
]

function StepIndicator({ current, total }) {
  return (
    <div className={styles.steps}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`${styles.stepDot} ${i <= current ? styles.stepDotActive : ''}`}>
          <span className={styles.stepNum}>{i + 1}</span>
        </div>
      ))}
      <div className={styles.stepLine}>
        <div className={styles.stepLineFill} style={{ width: `${(current / (total - 1)) * 100}%` }} />
      </div>
    </div>
  )
}

function GameCard({ game, selected, onSelect }) {
  const isSelected = selected?._raw?.id === game._raw?.id
  const homeId = game._raw?.home_team_obj?.api_id
  const awayId = game._raw?.away_team_obj?.api_id
  return (
    <button className={`${styles.gameCard} ${isSelected ? styles.gameCardSelected : ''}`} onClick={() => onSelect(game)}>
      {isSelected && <div className={styles.gameGlow} />}
      <div className={styles.gameTop}>
        {game.league && <span className={styles.gameLeague}>{game.league}</span>}
        <span className={styles.gameDate}>{game.date} • {game.time}</span>
      </div>
      <div className={styles.gameMatchup}>
        <div className={styles.gameTeam}>
          {homeId
            ? <img src={teamLogoUrl(homeId)} alt="" className={styles.teamLogo} onError={e => { e.target.style.display = 'none' }} />
            : <div className={styles.teamLogoPlaceholder}>{game.homeTeam.slice(0,3).toUpperCase()}</div>}
          <span className={styles.teamName}>{game.homeTeam}</span>
        </div>
        <div className={styles.gameVsBlock}><span className={styles.gameVs}>VS</span></div>
        <div className={styles.gameTeam}>
          {awayId
            ? <img src={teamLogoUrl(awayId)} alt="" className={styles.teamLogo} onError={e => { e.target.style.display = 'none' }} />
            : <div className={styles.teamLogoPlaceholder}>{game.awayTeam.slice(0,3).toUpperCase()}</div>}
          <span className={styles.teamName}>{game.awayTeam}</span>
        </div>
      </div>
      <div className={styles.gameBottom}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>{game.stadium}</span>
      </div>
      {isSelected && (
        <div className={styles.gameCheck}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
        </div>
      )}
    </button>
  )
}

export default function CriarViagemScreen() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useUser()
  const token = user?.token
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [games, setGames] = useState([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState(null)
  const [vehicle, setVehicle] = useState('carro')
  const [seats, setSeats] = useState(3)
  const [price, setPrice] = useState('')
  const [memberPrice, setMemberPrice] = useState('')
  const [meetPoint, setMeetPoint] = useState('')
  const [bairro, setBairro] = useState(user?.bairro || '')
  const [zona, setZona] = useState(user?.zona || '')
  const [departureHour, setDepartureHour] = useState('14')
  const [departureMinute, setDepartureMinute] = useState('00')
  const [submitting, setSubmitting] = useState(false)
  const [isLeader, setIsLeader] = useState(false)
  const [leaderGroup, setLeaderGroup] = useState(null)

  useEffect(() => {
    async function loadGames() {
      try {
        const today = new Date(); const in60d = new Date(today); in60d.setDate(today.getDate() + 60)
        const data = await fetchEvents({ team: user?.team || 'Botafogo', dateFrom: fmt(today), dateTo: fmt(in60d), status: 'notstarted' })
        const expectedApiId = TEAM_API_IDS[user?.team] || null
        const filtered = (data.results ?? []).filter(ev => {
          // Se temos o apiId do time, filtrar para só mostrar jogos desse time exato
          if (expectedApiId) {
            const homeApiId = ev.home_team_obj?.api_id
            const awayApiId = ev.away_team_obj?.api_id
            return homeApiId === expectedApiId || awayApiId === expectedApiId
          }
          return true
        })
        const sorted = filtered.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).slice(0, 10).map(ev => ({
          homeTeam: ev.home_team, awayTeam: ev.away_team, date: formatGameDate(ev.event_date), time: formatGameTime(ev.event_date),
          rawDate: ev.event_date, stadium: ev.venue || 'A confirmar', league: ev.league?.name || '', _raw: ev,
        }))
        setGames(sorted)
      } catch (err) { toast.error('Erro ao buscar jogos') } finally { setGamesLoading(false) }
    }
    loadGames()
  }, [user?.team])

  useEffect(() => {
    async function checkLeader() {
      if (!token) return
      try {
        const res = await fetch(`${API_URL}/grupos`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          const myGroup = (data.groups || []).find(g => String(g.leader?._id || g.leader) === String(user?.id))
          if (myGroup) { setIsLeader(true); setLeaderGroup(myGroup) }
        }
      } catch {}
    }
    checkLeader()
  }, [token, user?.id])

  const currentVehicle = VEHICLE_OPTIONS.find(v => v.id === vehicle)
  const maxSeats = currentVehicle?.maxSeats || 4
  useEffect(() => { if (seats > maxSeats) setSeats(maxSeats) }, [vehicle, maxSeats])

  const canNext = () => {
    if (step === 0) return !!selectedGame
    if (step === 1) return !!vehicle && seats >= 1
    if (step === 2) return !!price && !!meetPoint
    return false
  }
  const nextStep = () => { if (canNext() && step < 2) { setDirection('forward'); setStep(step + 1) } }
  const prevStep = () => { if (step > 0) { setDirection('back'); setStep(step - 1) } else navigate(-1) }

  const handleSubmit = async () => {
    if (!canNext() || submitting) return
    setSubmitting(true)
    try {
      const gameDate = new Date(selectedGame.rawDate)
      gameDate.setHours(parseInt(departureHour), parseInt(departureMinute), 0, 0)
      const body = {
        vehicle, totalSeats: seats, price: Math.round(parseFloat(price) * 100),
        memberPrice: memberPrice ? Math.round(parseFloat(memberPrice) * 100) : null,
        meetPoint, bairro, zona, departureTime: gameDate.toISOString(),
        game: { homeTeam: selectedGame.homeTeam, awayTeam: selectedGame.awayTeam, date: selectedGame.rawDate, stadium: selectedGame.stadium },
        groupId: isLeader && leaderGroup ? leaderGroup._id : null,
      }
      const res = await fetch(`${API_URL}/rides`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) { toast.success(data.message || 'Viagem criada!'); navigate(ROUTES.VAMOS_COMIGO) }
      else toast.error(data.error || 'Erro ao criar viagem')
    } catch { toast.error('Erro de conexão') } finally { setSubmitting(false) }
  }

  const STEP_LABELS = ['Jogo', 'Veículo', 'Detalhes']

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={prevStep} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className={styles.headerCenter}>
          <h1 className={styles.headerTitle}>Criar viagem</h1>
          <span className={styles.headerStep}>{STEP_LABELS[step]}</span>
        </div>
        <div style={{ width: 36 }} />
      </div>
      <StepIndicator current={step} total={3} />
      <div className={styles.content}>
        <div key={step} className={`${styles.stepContent} ${direction === 'forward' ? styles.slideInRight : styles.slideInLeft}`}>

        {step === 0 && (
          <>
            <h2 className={styles.stepTitle}>Escolha o <span className={styles.green}>jogo</span></h2>
            <p className={styles.stepSub}>Próximos jogos do {user?.team || 'seu time'}</p>
            {gamesLoading ? (
              <div className={styles.loadingGames}>{[1,2,3].map(i => (<div key={i} className={styles.skeletonGame}><div className={styles.skLine} style={{ width: '60%' }} /><div className={styles.skMatchup}><div className={styles.skCircle} /><div className={styles.skLine} style={{ width: '30%' }} /><div className={styles.skCircle} /></div><div className={styles.skLine} style={{ width: '50%' }} /></div>))}</div>
            ) : games.length === 0 ? (
              <div className={styles.emptyGames}><p>Nenhum jogo encontrado nos próximos 60 dias</p></div>
            ) : (
              <div className={styles.gamesList}>{games.map((g, i) => (<GameCard key={i} game={g} selected={selectedGame} onSelect={setSelectedGame} />))}</div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h2 className={styles.stepTitle}>Tipo de <span className={styles.green}>veículo</span></h2>
            <p className={styles.stepSub}>{selectedGame?.homeTeam} × {selectedGame?.awayTeam}</p>
            <div className={styles.vehicleGrid}>
              {VEHICLE_OPTIONS.map(v => {
                const locked = v.id !== 'carro' && !isLeader
                const active = vehicle === v.id
                return (
                  <button key={v.id} className={`${styles.vehicleBtn} ${active ? styles.vehicleBtnActive : ''} ${locked ? styles.vehicleBtnLocked : ''}`} onClick={() => !locked && setVehicle(v.id)} disabled={locked}>
                    {active && <div className={styles.vehicleGlow} />}
                    <v.Svg active={active} locked={locked} />
                    <span className={styles.vehicleName}>{v.label}</span>
                    <span className={styles.vehicleSeats}>até {v.maxSeats} vagas</span>
                    {locked && <span className={styles.vehicleLock}>👑 Líder</span>}
                  </button>
                )
              })}
            </div>
            <div className={styles.seatsSection}>
              <label className={styles.fieldLabel}>Vagas disponíveis</label>
              <div className={styles.seatsControl}>
                <button className={styles.seatsBtn} onClick={() => setSeats(Math.max(1, seats - 1))} disabled={seats <= 1}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div className={styles.seatsDisplay}><span className={styles.seatsNum}>{seats}</span><span className={styles.seatsLabel}>{seats === 1 ? 'vaga' : 'vagas'}</span></div>
                <button className={styles.seatsBtn} onClick={() => setSeats(Math.min(maxSeats, seats + 1))} disabled={seats >= maxSeats}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
              <div className={styles.seatsBar}><div className={styles.seatsBarFill} style={{ width: `${(seats / maxSeats) * 100}%` }} /></div>
              <span className={styles.seatsMax}>{seats} de {maxSeats}</span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={styles.stepTitle}>Preço e <span className={styles.green}>encontro</span></h2>
            <label className={styles.fieldLabel}>Preço por vaga</label>
            <div className={styles.priceRow}><span className={styles.pricePrefix}>R$</span><input type="number" min="0" step="0.50" value={price} onChange={e => setPrice(e.target.value)} placeholder="25,00" className={styles.priceInput} /></div>
            {isLeader && leaderGroup && (<><label className={styles.fieldLabel}>Preço para membros do {leaderGroup.name}<span className={styles.optional}> — opcional</span></label><div className={styles.priceRow}><span className={styles.pricePrefixMember}>R$</span><input type="number" min="0" step="0.50" value={memberPrice} onChange={e => setMemberPrice(e.target.value)} placeholder="20,00" className={styles.priceInput} /></div></>)}
            <label className={styles.fieldLabel}>Ponto de encontro</label>
            <input type="text" value={meetPoint} onChange={e => setMeetPoint(e.target.value)} placeholder="Ex: Praça do Botafogo, em frente ao metrô" className={styles.textInput} />
            <div className={styles.twoCol}><div><label className={styles.fieldLabel}>Bairro</label><input type="text" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Botafogo" className={styles.textInput} /></div><div><label className={styles.fieldLabel}>Zona</label><select value={zona} onChange={e => setZona(e.target.value)} className={styles.textInput}><option value="">Selecione</option><option value="Sul">Zona Sul</option><option value="Norte">Zona Norte</option><option value="Oeste">Zona Oeste</option><option value="Centro">Centro</option></select></div></div>
            <label className={styles.fieldLabel}>Horário de saída</label>
            <div className={styles.timePickerRow}>
              <div className={styles.timeCol}><label className={styles.timeLabel}>Hora</label><select value={departureHour} onChange={e => setDepartureHour(e.target.value)} className={styles.timeSelect}>{Array.from({ length: 24 }, (_, i) => (<option key={i} value={String(i).padStart(2,'0')}>{String(i).padStart(2,'0')}</option>))}</select></div>
              <span className={styles.timeSep}>:</span>
              <div className={styles.timeCol}><label className={styles.timeLabel}>Min</label><select value={departureMinute} onChange={e => setDepartureMinute(e.target.value)} className={styles.timeSelect}>{['00','15','30','45'].map(m => (<option key={m} value={m}>{m}</option>))}</select></div>
              <span className={styles.timePreview}>Saída às {departureHour}:{departureMinute}</span>
            </div>
            {/* Ticket summary */}
            <div className={styles.ticket}>
              <div className={styles.ticketHeader}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/></svg><span>Resumo da viagem</span></div>
              <div className={styles.ticketDivider}><div className={styles.ticketNotchLeft} /><div className={styles.ticketDash} /><div className={styles.ticketNotchRight} /></div>
              <div className={styles.ticketBody}>
                <div className={styles.ticketRow}><span>Jogo</span><span className={styles.ticketVal}>{selectedGame?.homeTeam} × {selectedGame?.awayTeam}</span></div>
                <div className={styles.ticketRow}><span>Veículo</span><span className={styles.ticketVal}>{currentVehicle?.label} • {seats} {seats === 1 ? 'vaga' : 'vagas'}</span></div>
                <div className={styles.ticketRow}><span>Preço</span><span className={styles.ticketPrice}>R$ {price || '0,00'}</span></div>
                {memberPrice && <div className={styles.ticketRow}><span>Membros</span><span className={styles.ticketPriceMember}>R$ {memberPrice}</span></div>}
                {isLeader && leaderGroup && <div className={styles.ticketRow}><span>Grupo</span><span className={styles.ticketVal}>★ {leaderGroup.name}</span></div>}
              </div>
              <div className={styles.ticketFooter}>O app retém 20% de comissão sobre cada vaga paga.</div>
            </div>
          </>
        )}

        </div>
      </div>

      <div className={styles.bottomBar}>
        {step < 2 ? (
          <button className={styles.btnNext} onClick={nextStep} disabled={!canNext()}>
            <span>Próximo</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        ) : (
          <button className={`${styles.btnSubmit} ${submitting ? styles.btnSubmitting : ''}`} onClick={handleSubmit} disabled={!canNext() || submitting}>
            {submitting ? <span className={styles.spinner} /> : (<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg><span>Criar viagem</span></>)}
          </button>
        )}
      </div>
    </div>
  )
}
