import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { fetchEvents } from '../utils/bsdApi'
import { ROUTES } from '../utils/constants'
import styles from './CriarViagemScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatGameDate(iso) {
  const d = new Date(iso)
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} • ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function fmt(d) { return d.toISOString().split('T')[0] }

const VEHICLE_OPTIONS = [
  { id: 'carro',  label: 'Carro',  icon: '🚗', maxSeats: 4 },
  { id: 'van',    label: 'Van',    icon: '🚐', maxSeats: 15 },
  { id: 'onibus', label: 'Ônibus', icon: '🚌', maxSeats: 50 },
]

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div className={styles.steps}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`${styles.stepDot} ${i <= current ? styles.stepDotActive : ''}`} />
      ))}
    </div>
  )
}

// ─── Game Card ──────────────────────────────────────────────────────────────

function GameCard({ game, selected, onSelect }) {
  const isSelected = selected?._raw?.id === game._raw?.id
  return (
    <button
      className={`${styles.gameCard} ${isSelected ? styles.gameCardSelected : ''}`}
      onClick={() => onSelect(game)}
    >
      <div className={styles.gameTeams}>
        <span className={styles.gameHome}>{game.homeTeam}</span>
        <span className={styles.gameVs}>×</span>
        <span className={styles.gameAway}>{game.awayTeam}</span>
      </div>
      <div className={styles.gameMeta}>
        <span>{game.date}</span>
        <span>•</span>
        <span>{game.stadium}</span>
      </div>
      {isSelected && <div className={styles.gameCheck}>✓</div>}
    </button>
  )
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function CriarViagemScreen() {
  const navigate = useNavigate()
  const toast    = useToast()
  const { user } = useUser()
  const token    = user?.token

  // Step control
  const [step, setStep] = useState(0)

  // Step 0: Selecionar jogo
  const [games,       setGames]       = useState([])
  const [gamesLoading,setGamesLoading]= useState(true)
  const [selectedGame,setSelectedGame]= useState(null)

  // Step 1: Veículo e vagas
  const [vehicle,  setVehicle]  = useState('carro')
  const [seats,    setSeats]    = useState(3)

  // Step 2: Preço e logística
  const [price,       setPrice]       = useState('')
  const [memberPrice, setMemberPrice] = useState('')
  const [meetPoint,   setMeetPoint]   = useState('')
  const [bairro,      setBairro]      = useState(user?.bairro || '')
  const [zona,        setZona]        = useState(user?.zona || '')
  const [departureHour,   setDepartureHour]   = useState('14')
  const [departureMinute, setDepartureMinute] = useState('00')

  // Submit
  const [submitting, setSubmitting] = useState(false)

  // Verificar se é líder (pode criar van/ônibus)
  const [isLeader,  setIsLeader]  = useState(false)
  const [leaderGroup, setLeaderGroup] = useState(null)

  // ── Carregar próximos jogos via BSD API ────────────────────────────────
  useEffect(() => {
    async function loadGames() {
      try {
        const today = new Date()
        const in60d = new Date(today)
        in60d.setDate(today.getDate() + 60)

        const data = await fetchEvents({
          team:     user?.team || 'Botafogo',
          dateFrom: fmt(today),
          dateTo:   fmt(in60d),
          status:   'notstarted',
        })

        const sorted = (data.results ?? [])
          .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
          .slice(0, 10)
          .map(ev => ({
            homeTeam: ev.home_team,
            awayTeam: ev.away_team,
            date:     formatGameDate(ev.event_date),
            rawDate:  ev.event_date,
            stadium:  ev.venue || 'A confirmar',
            league:   ev.league?.name || '',
            _raw:     ev,
          }))

        setGames(sorted)
      } catch (err) {
        console.error('[CriarViagem] erro ao buscar jogos:', err)
        toast.error('Erro ao buscar jogos')
      } finally {
        setGamesLoading(false)
      }
    }
    loadGames()
  }, [user?.team])

  // ── Verificar se é líder de grupo ─────────────────────────────────────
  useEffect(() => {
    async function checkLeader() {
      if (!token) return
      try {
        const res = await fetch(`${API_URL}/grupos`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const myGroup = (data.groups || []).find(
            g => String(g.leader?._id || g.leader) === String(user?.id)
          )
          if (myGroup) {
            setIsLeader(true)
            setLeaderGroup(myGroup)
          }
        }
      } catch {}
    }
    checkLeader()
  }, [token, user?.id])

  // ── Vehicle max seats ─────────────────────────────────────────────────
  const currentVehicle = VEHICLE_OPTIONS.find(v => v.id === vehicle)
  const maxSeats = currentVehicle?.maxSeats || 4

  useEffect(() => {
    if (seats > maxSeats) setSeats(maxSeats)
  }, [vehicle, maxSeats])

  // ── Navegação entre steps ─────────────────────────────────────────────
  const canNext = () => {
    if (step === 0) return !!selectedGame
    if (step === 1) return !!vehicle && seats >= 1
    if (step === 2) return !!price && !!meetPoint
    return false
  }

  const nextStep = () => {
    if (canNext() && step < 2) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
    else navigate(-1)
  }

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canNext() || submitting) return
    setSubmitting(true)

    try {
      // Combinar data do jogo com horário de saída escolhido
      const gameDate = new Date(selectedGame.rawDate)
      gameDate.setHours(parseInt(departureHour), parseInt(departureMinute), 0, 0)

      const body = {
        vehicle,
        totalSeats: seats,
        price: Math.round(parseFloat(price) * 100),  // reais → centavos
        memberPrice: memberPrice ? Math.round(parseFloat(memberPrice) * 100) : null,
        meetPoint,
        bairro,
        zona,
        departureTime: gameDate.toISOString(),
        game: {
          homeTeam: selectedGame.homeTeam,
          awayTeam: selectedGame.awayTeam,
          date:     selectedGame.rawDate,
          stadium:  selectedGame.stadium,
        },
        groupId: isLeader && leaderGroup ? leaderGroup._id : null,
      }

      const res = await fetch(`${API_URL}/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Viagem criada com sucesso!')
        navigate(ROUTES.VAMOS_COMIGO)
      } else {
        toast.error(data.error || 'Erro ao criar viagem')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={prevStep} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Criar viagem</h1>
        <div style={{ width: 36 }} />
      </div>

      <StepIndicator current={step} total={3} />

      <div className={styles.content}>

        {/* ─── STEP 0: Selecionar jogo ─────────────────────────────────── */}
        {step === 0 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Escolha o jogo</h2>
            <p className={styles.stepSub}>Próximos jogos do {user?.team || 'seu time'}</p>

            {gamesLoading ? (
              <div className={styles.loadingGames}>
                {[1,2,3].map(i => (
                  <div key={i} className={styles.skeletonGame}>
                    <div className={styles.skLine} style={{ width: '80%' }} />
                    <div className={styles.skLine} style={{ width: '60%' }} />
                  </div>
                ))}
              </div>
            ) : games.length === 0 ? (
              <div className={styles.emptyGames}>
                <p>Nenhum jogo encontrado nos próximos 60 dias</p>
              </div>
            ) : (
              <div className={styles.gamesList}>
                {games.map((g, i) => (
                  <GameCard
                    key={i}
                    game={g}
                    selected={selectedGame}
                    onSelect={setSelectedGame}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 1: Veículo e vagas ─────────────────────────────────── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Veículo e vagas</h2>
            <p className={styles.stepSub}>
              {selectedGame?.homeTeam} × {selectedGame?.awayTeam}
            </p>

            <label className={styles.fieldLabel}>Tipo de veículo</label>
            <div className={styles.vehicleGrid}>
              {VEHICLE_OPTIONS.map(v => {
                const disabled = v.id !== 'carro' && !isLeader
                return (
                  <button
                    key={v.id}
                    className={`${styles.vehicleBtn} ${vehicle === v.id ? styles.vehicleBtnActive : ''} ${disabled ? styles.vehicleBtnDisabled : ''}`}
                    onClick={() => !disabled && setVehicle(v.id)}
                    disabled={disabled}
                    title={disabled ? 'Apenas líderes de grupo' : ''}
                  >
                    <span className={styles.vehicleIcon}>{v.icon}</span>
                    <span className={styles.vehicleName}>{v.label}</span>
                    {disabled && <span className={styles.vehicleLock}>👑</span>}
                  </button>
                )
              })}
            </div>
            {!isLeader && (
              <p className={styles.leaderHint}>
                Van e ônibus só para líderes de grupo 👑
              </p>
            )}

            <label className={styles.fieldLabel}>Vagas disponíveis</label>
            <div className={styles.seatsControl}>
              <button
                className={styles.seatsBtn}
                onClick={() => setSeats(Math.max(1, seats - 1))}
                disabled={seats <= 1}
              >
                −
              </button>
              <span className={styles.seatsNum}>{seats}</span>
              <button
                className={styles.seatsBtn}
                onClick={() => setSeats(Math.min(maxSeats, seats + 1))}
                disabled={seats >= maxSeats}
              >
                +
              </button>
              <span className={styles.seatsMax}>máx. {maxSeats}</span>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Preço e logística ───────────────────────────────── */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Preço e ponto de encontro</h2>

            <label className={styles.fieldLabel}>Preço por vaga (R$)</label>
            <div className={styles.priceRow}>
              <span className={styles.pricePrefix}>R$</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="25,00"
                className={styles.priceInput}
              />
            </div>

            {isLeader && leaderGroup && (
              <>
                <label className={styles.fieldLabel}>
                  Preço para membros do {leaderGroup.name} (R$)
                  <span className={styles.optional}> — opcional</span>
                </label>
                <div className={styles.priceRow}>
                  <span className={styles.pricePrefix}>R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={memberPrice}
                    onChange={e => setMemberPrice(e.target.value)}
                    placeholder="20,00"
                    className={styles.priceInput}
                  />
                </div>
              </>
            )}

            <label className={styles.fieldLabel}>Ponto de encontro</label>
            <input
              type="text"
              value={meetPoint}
              onChange={e => setMeetPoint(e.target.value)}
              placeholder="Ex: Praça do Botafogo, em frente ao metrô"
              className={styles.textInput}
            />

            <div className={styles.twoCol}>
              <div>
                <label className={styles.fieldLabel}>Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={e => setBairro(e.target.value)}
                  placeholder="Botafogo"
                  className={styles.textInput}
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Zona</label>
                <select
                  value={zona}
                  onChange={e => setZona(e.target.value)}
                  className={styles.textInput}
                >
                  <option value="">Selecione</option>
                  <option value="Sul">Zona Sul</option>
                  <option value="Norte">Zona Norte</option>
                  <option value="Oeste">Zona Oeste</option>
                  <option value="Centro">Centro</option>
                </select>
              </div>
            </div>

            <label className={styles.fieldLabel}>Horário de saída</label>
            <div className={styles.timePickerRow}>
              <div className={styles.timeCol}>
                <label className={styles.timeLabel}>Hora</label>
                <select
                  value={departureHour}
                  onChange={e => setDepartureHour(e.target.value)}
                  className={styles.timeSelect}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <span className={styles.timeSep}>:</span>
              <div className={styles.timeCol}>
                <label className={styles.timeLabel}>Min</label>
                <select
                  value={departureMinute}
                  onChange={e => setDepartureMinute(e.target.value)}
                  className={styles.timeSelect}
                >
                  {['00','15','30','45'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <span className={styles.timePreview}>
                Saída às {departureHour}:{departureMinute} no dia do jogo
              </span>
            </div>

            {/* Resumo */}
            <div className={styles.summary}>
              <div className={styles.summaryTitle}>Resumo da viagem</div>
              <div className={styles.summaryRow}>
                <span>Jogo</span>
                <span>{selectedGame?.homeTeam} × {selectedGame?.awayTeam}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Veículo</span>
                <span>{currentVehicle?.icon} {currentVehicle?.label} • {seats} vagas</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Preço</span>
                <span>R$ {price || '0,00'}</span>
              </div>
              {memberPrice && (
                <div className={styles.summaryRow}>
                  <span>Preço membro</span>
                  <span>R$ {memberPrice}</span>
                </div>
              )}
              {isLeader && leaderGroup && (
                <div className={styles.summaryRow}>
                  <span>Grupo</span>
                  <span>★ {leaderGroup.name}</span>
                </div>
              )}
              <div className={styles.summaryNote}>
                O app retém 20% de comissão sobre cada vaga paga.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className={styles.bottomBar}>
        {step < 2 ? (
          <button
            className={styles.btnNext}
            onClick={nextStep}
            disabled={!canNext()}
          >
            Próximo
          </button>
        ) : (
          <button
            className={styles.btnSubmit}
            onClick={handleSubmit}
            disabled={!canNext() || submitting}
          >
            {submitting ? 'Criando...' : 'Criar viagem'}
          </button>
        )}
      </div>
    </div>
  )
}
