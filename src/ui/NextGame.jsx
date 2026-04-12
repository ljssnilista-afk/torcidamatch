import { useEffect, useRef, memo } from 'react'
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
}

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

// ─── Shield: tenta logo real, fallback para sigla ────────────────────────────
function TeamShield({ team }) {
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
            // Se a imagem falhar, mostra a sigla
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
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default memo(function NextGame({ game, onCta, loading }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => drawGameBackground(canvasRef.current))
    )
    return () => cancelAnimationFrame(raf)
  }, [])

  if (loading) return <NextGameSkeleton />

  return (
    <section className={styles.card} aria-labelledby="game-title">
      <canvas ref={canvasRef} className={styles.canvas} width={362} height={208} />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.label}>
          <span className={styles.dot} aria-hidden="true" />
          <span id="game-title">{game.label}</span>
        </p>

        <div className={styles.matchup}>
          <div className={styles.team}>
            <TeamShield team={{ ...game.homeTeam, apiId: game.homeApiId }} />
            <span className={styles.teamName}>{game.homeTeam.name}</span>
          </div>

          <div className={styles.center}>
            <span className={styles.vs} aria-hidden="true">×</span>
            <span className={styles.date}>{game.date}</span>
            <span className={styles.stadium}>{game.stadium}</span>
          </div>

          <div className={styles.team}>
            <TeamShield team={{ ...game.awayTeam, apiId: game.awayApiId }} />
            <span className={styles.teamName}>{game.awayTeam.name}</span>
          </div>
        </div>

        {game.pills?.length > 0 && (
          <div className={styles.pills}>
            {game.pills.map((p) => (
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

