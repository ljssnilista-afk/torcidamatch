import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { fetchNextGame, bsdEventToNextGame } from '../utils/bsdApi'
import { NEXT_GAME } from '../data/homeData'
import { NEXT_GAME_BANNER } from '../data/vamosComigoData'

const GameContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api'

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
          // Buscar posições na tabela (standings) em paralelo
          await enrichWithStandings(converted)
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

/** Busca standings e enriquece o game com homePosition / awayPosition */
async function enrichWithStandings(game) {
  try {
    const res = await fetch(`${API_URL}/football/standings?competition=BSA`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return

    const data = await res.json()
    const table = data.table || []

    // Tenta encontrar a posição pelo nome do time
    for (const row of table) {
      const rowName = (row.team?.name || row.team?.shortName || '').toLowerCase()
      if (game.homeTeam?.name && rowName.includes(game.homeTeam.name.toLowerCase().split(' ')[0])) {
        game.homePosition = row.position
      }
      if (game.awayTeam?.name && rowName.includes(game.awayTeam.name.toLowerCase().split(' ')[0])) {
        game.awayPosition = row.position
      }
    }
  } catch (err) {
    console.warn('[GameContext] standings fetch failed:', err.message)
    // Silencioso — posição será null e badge não aparece
  }
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
