import { useEffect, useRef, useState, memo } from 'react'
import { drawGameBackground } from '../utils/canvasHelpers'
import { teamLogoUrl } from '../utils/bsdApi'
import styles from './NextGame.module.css'

const PILL_ICONS = {
  users: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    </svg>
  ),
  clock: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
    </svg>
  ),
  pin: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  rides: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/>
      <path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9"/>
    </svg>
  ),
  location: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
}

// ─── Countdown hook ──────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate))

  useEffect(() => {
    if (!targetDate) return
    const id = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return timeLeft
}

function calcTimeLeft(target) {
  if (!target) return null
  const diff = new Date(target) - new Date()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, live: true }
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    live:    false,
  }
}

function pad(n) { return String(n).padStart(2, '0') }

// ─── Skeleton enquanto carrega ────────────────────────────────────────────────
export function NextGameSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Carregando próximo jogo..." role="status">
      <div className={styles.skelLabel} />
      <div className={styles.skelMatchup}>
        <div className={styles.skelShield} />
        <div className={styles.skelCenter}>
          <div className={styles.skelVs} />
          <div className={styles.skelDate} />
        </div>
        <div className={styles.skelShield} />
      </div>
      <div className={styles.skelPills}>
        {[1,2,3].map(i => <div key={i} className={styles.skelPill} />)}
      </div>
    </div>
  )
}

// ─── Shield com posição na tabela ────────────────────────────────────────────
function TeamShield({ team, position }) {
  const hasLogo = Boolean(team.apiId)
  return (
    <div className={styles.shieldWrap}>
      {hasLogo ? (
        <img
          src={teamLogoUrl(team.apiId)}
          alt={team.name}
          loading="lazy"
          className={styles.teamLogo}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      ) : null}
      <div
        className={styles.shield}
        style={{
          background: team.bg,
          color: team.color,
          display: hasLogo ? 'none' : 'flex',
        }}
        aria-label={team.name}
      >
        {team.code}
      </div>
      {/* ✅ Req 5 — Posição na tabela ao lado do escudo */}
      {position != null && (
        <span className={styles.position} title="Posição na tabela">
          {position}°
        </span>
      )}
    </div>
  )
}

// ─── Countdown display ───────────────────────────────────────────────────────
function CountdownTimer({ utcDate }) {
  const tl = useCountdown(utcDate)

  if (!tl) return null

  if (tl.live) {
    return (
      <div className={styles.countdown}>
        <div className={styles.countdownLive}>
          <span className={styles.liveDot} />
          AO VIVO
        </div>
      </div>
    )
  }

  return (
    <div className={styles.countdown}>
      <div className={styles.countdownLabel}>Falta para o jogo</div>
      <div className={styles.countdownBoxes}>
        {tl.days > 0 && (
          <div className={styles.countdownUnit}>
            <span className={styles.countdownNum}>{pad(tl.days)}</span>
            <span className={styles.countdownSub}>dias</span>
          </div>
        )}
        <div className={styles.countdownUnit}>
          <span className={styles.countdownNum}>{pad(tl.hours)}</span>
          <span className={styles.countdownSub}>hrs</span>
        </div>
        <div className={styles.countdownSep}>:</div>
        <div className={styles.countdownUnit}>
          <span className={styles.countdownNum}>{pad(tl.minutes)}</span>
          <span className={styles.countdownSub}>min</span>
        </div>
        <div className={styles.countdownSep}>:</div>
        <div className={styles.countdownUnit}>
          <span className={styles.countdownNum}>{pad(tl.seconds)}</span>
          <span className={styles.countdownSub}>seg</span>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default memo(function NextGame({ game, onCta, loading, ridesCount, homePosition, awayPosition }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => drawGameBackground(canvasRef.current))
    )
    return () => cancelAnimationFrame(raf)
  }, [])

  if (loading) return <NextGameSkeleton />

  // Extrai utcDate do evento bruto (_raw) ou do game
  const utcDate = game._raw?.event_date || game.utcDate || null

  // Formata data/hora de forma destacada
  const dateObj = utcDate ? new Date(utcDate) : null
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const bigDate = dateObj
    ? `${days[dateObj.getDay()]} ${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`
    : game.date?.split('•')[0]?.trim() ?? ''
  const bigTime = dateObj
    ? `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
    : game.date?.split('•')[1]?.trim() ?? ''

  // Pills dinâmicas
  const dynamicPills = []

  // ✅ Req 2 — Viagens reais disponíveis
  if (ridesCount != null) {
    dynamicPills.push({ icon: 'rides', text: `${ridesCount} carona${ridesCount !== 1 ? 's' : ''}` })
  } else if (game.pills) {
    // Fallback para pills estáticas
    const usersPill = game.pills.find(p => p.icon === 'users')
    if (usersPill) dynamicPills.push(usersPill)
  }

  // ✅ Req 4 — Local exato do jogo
  if (game.stadium && game.stadium !== 'A confirmar') {
    dynamicPills.push({ icon: 'location', text: game.stadium })
  }

  // Mantém pill de duração se existir
  const clockPill = game.pills?.find(p => p.icon === 'clock')
  if (clockPill) dynamicPills.push(clockPill)

  return (
    <section className={styles.card} aria-labelledby="game-title">
      <canvas ref={canvasRef} className={styles.canvas} width={362} height={280} />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.label}>
          <span className={styles.dot} aria-hidden="true" />
          <span id="game-title">{game.label}</span>
        </p>

        {/* ✅ Req 1 — Data e hora em DESTAQUE */}
        <div className={styles.dateHighlight}>
          <span className={styles.bigDate}>{bigDate}</span>
          <span className={styles.bigTimeSep}>•</span>
          <span className={styles.bigTime}>{bigTime}</span>
        </div>

        <div className={styles.matchup}>
          <div className={styles.team}>
            {/* ✅ Req 5 — Posição ao lado do escudo */}
            <TeamShield
              team={{ ...game.homeTeam, apiId: game.homeApiId }}
              position={homePosition}
            />
            <span className={styles.teamName}>{game.homeTeam.name}</span>
          </div>

          <div className={styles.center}>
            <span className={styles.vs} aria-hidden="true">VS</span>
          </div>

          <div className={styles.team}>
            <TeamShield
              team={{ ...game.awayTeam, apiId: game.awayApiId }}
              position={awayPosition}
            />
            <span className={styles.teamName}>{game.awayTeam.name}</span>
          </div>
        </div>

        {/* ✅ Req 4 — Local exato em destaque */}
        {game.stadium && (
          <div className={styles.venueRow}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span>{game.stadium}</span>
          </div>
        )}

        {/* ✅ Req 3 — Cronômetro regressivo */}
        <CountdownTimer utcDate={utcDate} />

        {dynamicPills.length > 0 && (
          <div className={styles.pills}>
            {dynamicPills.map((p) => (
              <div key={p.text} className={styles.pill}>
                <span aria-hidden="true">{PILL_ICONS[p.icon]}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        )}

        <button
          className={styles.cta}
          onClick={() => onCta?.(game)}
          aria-label={`Ver caronas para ${game.homeTeam.name} x ${game.awayTeam.name}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M7 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9"/>
          </svg>
          Ver caronas para este jogo
        </button>
      </div>
    </section>
  )
})
