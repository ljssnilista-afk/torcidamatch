import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../utils/constants'
import { useUser } from '../context/UserContext'
import { useGame } from '../context/GameContext'
import ChampionBanner from './ChampionBanner'
import NotificationBar from './NotificationBar'
import Filters from './Filters'
import GroupCard from './GroupCard'
import SuggestCard from './SuggestCard'
import NextGame from './NextGame'
import RidesSection from './RidesSection'
import FemaleAlert from './FemaleAlert'
import {
  CHAMPION_INFO,
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

  // Enquanto carrega, usa o mock para não deixar vazio
  const displayGame = nextGame ?? NEXT_GAME

  return (
    <div className={styles.screen}>
      <ChampionBanner info={CHAMPION_INFO} />
      <NotificationBar text={ALERT.text} />
      <Filters filters={FILTERS} />

      <div className={styles.scrollArea} role="feed" aria-label="Grupos de torcedores">

        {GROUP_CARDS.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onDetails={() => navigate(ROUTES.GRUPOS)}
            onAction={() => navigate(ROUTES.GRUPOS)}
          />
        ))}

        <section className={styles.suggestSection} aria-labelledby="sugg-title">
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle} id="sugg-title">
                Grupos sugeridos para você
              </h3>
              <p className={styles.sectionSubtitle}>Baseado na sua região • Glória Alvinegra</p>
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
    </div>
  )
}
