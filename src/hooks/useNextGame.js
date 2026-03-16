import { useState, useEffect, useRef } from 'react'
import { fetchNextGame, bsdEventToNextGame } from '../utils/bsdApi'
import { NEXT_GAME } from '../data/homeData'
import { teamLogoUrl } from '../utils/bsdApi'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
const cache = {} // cache em memória simples por teamName

/**
 * Hook que busca o próximo jogo de um time na BSD API.
 * Retorna dados no formato esperado pelo componente NextGame.
 *
 * @param {string} teamName  - ex: 'Botafogo'
 * @returns {{ game, loading, error, isLive }}
 */
export function useNextGame(teamName = 'Botafogo') {
  const [game,    setGame]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const aborted = useRef(false)

  useEffect(() => {
    aborted.current = false

    async function load() {
      // Verifica cache
      const cached = cache[teamName]
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setGame(cached.data)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const event = await fetchNextGame(teamName)

        if (aborted.current) return

        if (event) {
          const converted = bsdEventToNextGame(event)
          // Mantém pills do mockado (caronas) se não vier da API
          converted.pills = NEXT_GAME.pills
          cache[teamName] = { data: converted, ts: Date.now() }
          setGame(converted)
        } else {
          // Sem jogos encontrados — usa mock
          setGame(NEXT_GAME)
        }
      } catch (err) {
        if (aborted.current) return
        console.warn('[useNextGame] API error, using fallback:', err.message)
        setError(err.message)
        setGame(NEXT_GAME) // fallback silencioso
      } finally {
        if (!aborted.current) setLoading(false)
      }
    }

    load()
    return () => { aborted.current = true }
  }, [teamName])

  return { game, loading, error }
}