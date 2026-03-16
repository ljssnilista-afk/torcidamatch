import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { fetchNextGame, bsdEventToNextGame } from '../utils/bsdApi'
import { NEXT_GAME } from '../data/homeData'
import { NEXT_GAME_BANNER } from '../data/vamosComigoData'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [game,    setGame]    = useState(null)   // formato NextGame
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    async function load() {
      try {
        const event = await fetchNextGame('Botafogo')
        if (event) {
          const converted = bsdEventToNextGame(event)
          converted.pills = NEXT_GAME.pills
          setGame(converted)
        } else {
          setGame(NEXT_GAME)
        }
      } catch (err) {
        console.warn('[GameContext] fallback:', err.message)
        setError(err.message)
        setGame(NEXT_GAME)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // Banner compacto para VamosComigoScreen e GruposScreen
  const banner = game ? {
    home:    game.homeTeam.name,
    away:    game.awayTeam.name,
    date:    game.date?.split('•')[0]?.trim() ?? NEXT_GAME_BANNER.date,
    time:    game.date?.split('•')[1]?.trim() ?? NEXT_GAME_BANNER.time,
    stadium: game.stadium ?? NEXT_GAME_BANNER.stadium,
    homeApiId: game.homeApiId,
    awayApiId: game.awayApiId,
  } : NEXT_GAME_BANNER

  return (
    <GameContext.Provider value={{ game, banner, loading, error }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
