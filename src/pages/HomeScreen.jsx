import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../utils/constants'
import { useUser } from '../context/UserContext'
import { useGame } from '../context/GameContext'
import NewsBanner from '../ui/NewsBanner'
import NotificationBar from '../ui/NotificationBar'
import Filters from '../ui/Filters'
import GroupCard from '../ui/GroupCard'
import SuggestCard from '../ui/SuggestCard'
import NextGame from '../ui/NextGame'
import RidesSection from '../ui/RidesSection'
import FemaleAlert from '../ui/FemaleAlert'
import {
  ALERT,
  FILTERS,
  GROUP_CARDS,
  SUGGESTIONS,
  NEXT_GAME,
  RIDES,
  FEMALE_ALERT,
} from '../data/homeData'
import styles from './HomeScreen.module.css'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user }  = useUser()
  const { game: nextGame, loading: gameLoading } = useGame()
  const displayGame = nextGame ?? NEXT_GAME
  const [search, setSearch] = useState('')
  const [mapGroup, setMapGroup] = useState(null)

  return (
    <div className={styles.screen}>
      {/* Banner de notícias em tempo real */}
      <NewsBanner />

      {/* Barra de dia de jogo → Vamos Comigo */}
      <NotificationBar />

      {/* Barra de busca */}
      <div className={styles.searchWrap}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" className={styles.searchIcon}>
          <circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 3.5 3.5"/>
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Buscar grupos, bairros..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Buscar grupos"
        />
        {search && (
          <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Limpar">
            ✕
          </button>
        )}
      </div>

      {/* Filtros de descoberta */}
      <Filters onChange={() => {}} />

      <div className={styles.scrollArea} role="feed" aria-label="Grupos de torcedores">

        {/* Seção Grupos em alta */}
        <div className={styles.sectionDivider}>
          <span className={styles.dividerIcon}>🔥</span>
          <span className={styles.dividerTitle}>Grupos em alta</span>
          <div className={styles.dividerLine}/>
        </div>

        {GROUP_CARDS.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onDetails={() => setMapGroup(group)}
            onAction={() => navigate(ROUTES.GRUPOS)}
          />
        ))}

        <section className={styles.suggestSection} aria-labelledby="sugg-title">
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle} id="sugg-title">
                Grupos sugeridos para você
              </h3>
              <p className={styles.sectionSubtitle}>
                Baseado na sua região • {user?.team ?? 'Seu time'}
              </p>
            </div>
            <button className={styles.sectionLink} onClick={() => navigate(ROUTES.GRUPOS)}>
              Ver todos
            </button>
          </div>
          <div className={styles.suggestScroll} role="list">
            {SUGGESTIONS.map((s) => (
              <SuggestCard
                key={s.id}
                suggestion={s}
                onCreate={() => navigate(ROUTES.GRUPOS)}
              />
            ))}
          </div>
        </section>

        <NextGame
          game={displayGame}
          loading={gameLoading}
          onCta={() => navigate(ROUTES.VAMOS_COMIGO)}
        />

        <RidesSection
          rides={RIDES}
          title={`Caronas — ${displayGame.homeTeam?.name} × ${displayGame.awayTeam?.name}`}
          onViewAll={() => navigate(ROUTES.VAMOS_COMIGO)}
        />

        <FemaleAlert
          alert={FEMALE_ALERT}
          onCreate={() => navigate(ROUTES.GRUPOS)}
        />

      </div>

      {/* Modal de mapa — ponto de encontro */}
      {mapGroup && (
        <div className={styles.mapOverlay} onClick={() => setMapGroup(null)}>
          <div className={styles.mapSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.mapHeader}>
              <div>
                <h3 className={styles.mapTitle}>{mapGroup.name}</h3>
                <p className={styles.mapSub}>📍 {mapGroup.meetPoint}</p>
              </div>
              <button className={styles.mapClose} onClick={() => setMapGroup(null)}>✕</button>
            </div>
            <div className={styles.mapFrame}>
              <iframe
                title="Mapa do ponto de encontro"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, borderRadius: '0 0 22px 22px' }}
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${mapGroup.lat},${mapGroup.lng}&zoom=15&maptype=roadmap`}
                allowFullScreen
              />
            </div>
            <div className={styles.mapActions}>
              <button className={styles.mapBtn} onClick={() => { setMapGroup(null); navigate(ROUTES.GRUPOS) }}>
                Ver grupo
              </button>
              <a
                className={styles.mapBtnOutline}
                href={`https://www.google.com/maps/dir/?api=1&destination=${mapGroup.lat},${mapGroup.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir no Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

