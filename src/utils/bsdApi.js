// ─── BSD Sports API Client ────────────────────────────────────────────────────
// Chamadas passam pelo backend Railway para evitar CORS

const BASE_URL = 'https://torcida-match-api-production.up.railway.app/api/bsd'
const TOKEN    = 'e06ac9d43652a8adb1f8997bc4f9c4575db1353f'
const IMG_BASE = 'https://sports.bzzoiro.com/img'

const headers = {}

// ─── Fetch helper com timeout ──────────────────────────────────────────────────
async function apiFetch(path, params = {}) {
  const base = BASE_URL + path
  const query = new URLSearchParams(params).toString()
  const url = query ? `${base}?${query}` : base

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, { headers, signal: controller.signal })
    if (!res.ok) throw new Error(`BSD API ${res.status}: ${url}`)

    // Protege contra proxy retornando HTML ao invés de JSON
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error(`BSD API retornou ${contentType || 'tipo desconhecido'} ao invés de JSON`)
    }

    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** Busca ligas — filtra por país se passado */
export async function fetchLeagues(country) {
  return apiFetch('/leagues/', country ? { country } : {})
}

/** Busca times — filtra por país ou liga */
export async function fetchTeams({ country, league } = {}) {
  const params = {}
  if (country) params.country = country
  if (league)  params.league  = league
  return apiFetch('/teams/', params)
}

/**
 * Busca eventos (jogos)
 * @param {Object} opts
 * @param {string} opts.team       - nome do time (parcial, case-insensitive)
 * @param {string} opts.dateFrom   - YYYY-MM-DD
 * @param {string} opts.dateTo     - YYYY-MM-DD
 * @param {number} opts.league     - id da liga
 * @param {string} opts.status     - notstarted | inprogress | finished | ...
 */
export async function fetchEvents({ team, dateFrom, dateTo, league, status } = {}) {
  const params = {}
  if (team)     params.team      = team
  if (dateFrom) params.date_from = dateFrom
  if (dateTo)   params.date_to   = dateTo
  if (league)   params.league    = league
  if (status)   params.status    = status
  return apiFetch('/events/', params)
}

// ─── Mapa de apiId dos times do RJ (para filtrar homônimos) ──────────────────
export const TEAM_API_IDS = {
  'Botafogo':      1958,
  'Flamengo':      5981,
  'Fluminense':    1961,
  'Vasco da Gama': 1974,
}

/** Busca o próximo jogo de um time */
export async function fetchNextGame(teamName) {
  const today = new Date()
  const in60d = new Date(today)
  in60d.setDate(today.getDate() + 60)

  const fmt = (d) => d.toISOString().split('T')[0]

  const data = await fetchEvents({
    team:     teamName,
    dateFrom: fmt(today),
    dateTo:   fmt(in60d),
    status:   'notstarted',
  })

  const expectedApiId = TEAM_API_IDS[teamName] || null

  // Filtrar para só mostrar jogos do time correto (ex: Botafogo-RJ, não Botafogo-SP)
  const filtered = (data.results ?? []).filter(ev => {
    if (expectedApiId) {
      const homeApiId = ev.home_team_obj?.api_id
      const awayApiId = ev.away_team_obj?.api_id
      return homeApiId === expectedApiId || awayApiId === expectedApiId
    }
    return true
  })

  // Ordena por data e pega o primeiro
  const sorted = filtered.sort(
    (a, b) => new Date(a.event_date) - new Date(b.event_date)
  )
  return sorted[0] ?? null
}

/** Jogos ao vivo */
export async function fetchLive() {
  return apiFetch('/live/')
}

/** Predições para próximos jogos */
export async function fetchPredictions() {
  return apiFetch('/predictions/')
}

/** Jogadores */
export async function fetchPlayers({ team, nationality, position } = {}) {
  const params = {}
  if (team)        params.team        = team
  if (nationality) params.nationality = nationality
  if (position)    params.position    = position
  return apiFetch('/players/', params)
}

// ─── Image URLs (uso direto em <img src="..."> ) ───────────────────────────────
export const teamLogoUrl   = (apiId) => `${IMG_BASE}/team/${apiId}/?token=${TOKEN}`
export const leagueLogoUrl = (apiId) => `${IMG_BASE}/league/${apiId}/?token=${TOKEN}`
export const playerPhotoUrl= (apiId) => `${IMG_BASE}/player/${apiId}/?token=${TOKEN}`

// ─── Conversor: evento BSD → formato NextGame do app ─────────────────────────
export function bsdEventToNextGame(event) {
  if (!event) return null

  const dt = new Date(event.event_date)
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const day  = days[dt.getDay()]
  const date = `${day} ${dt.getDate()}/${months[dt.getMonth()]} • ${String(dt.getHours()).padStart(2,'0')}h`

  const home = event.home_team_obj
  const away = event.away_team_obj

  return {
    // IDs para buscar logos
    homeApiId: home?.api_id ?? null,
    awayApiId: away?.api_id ?? null,

    label:   `Próximo jogo — ${event.league?.name ?? 'Brasileirão'}`,
    homeTeam: {
      code:  home?.short_name?.slice(0, 3).toUpperCase() ?? event.home_team.slice(0, 3).toUpperCase(),
      name:  event.home_team,
      bg:    '#111',
      color: '#fff',
    },
    awayTeam: {
      code:  away?.short_name?.slice(0, 3).toUpperCase() ?? event.away_team.slice(0, 3).toUpperCase(),
      name:  event.away_team,
      bg:    '#CC0000',
      color: '#fff',
    },
    date,
    stadium: event.venue ?? 'A confirmar',
    pills:   [],        // HomeScreen preenche com dados de caronas
    _raw:    event,     // evento bruto para uso avançado
  }
}
