// ─── BSD Sports API Client (proxy via backend) ───────────────────────────────
// Agora o frontend chama o backend (torcida-match-api) que, por sua vez,
// faz a requisição para https://sports.bzzoiro.com/api, resolvendo CORS.

// URL base do backend – use a variável de ambiente VITE_API_URL.
// Em desenvolvimento local, pode ser http://localhost:3001/api.
// Em produção, será a URL do seu backend (ex: https://torcida-match-api.vercel.app/api)
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const PROXY_PATH   = '/football';          // rota do proxy (ex: /api/football)

// Token da API externa – agora usado APENAS para imagens (ou pode ser removido se você criar também proxy para imagens)
const EXTERNAL_TOKEN = 'e06ac9d43652a8adb1f8997bc4f9c4575db1353f';

// Base das URLs de imagem (ainda chamam diretamente a API externa, pois são públicas)
const IMG_BASE = 'https://sports.bzzoiro.com/img';

// ─── Função auxiliar para chamar o backend ──────────────────────────────────
async function backendFetch(endpoint, params = {}) {
  const url = `${BACKEND_URL}${PROXY_PATH}${endpoint}`;
  const query = new URLSearchParams(params).toString();
  const fullUrl = query ? `${url}?${query}` : url;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(fullUrl, { signal: controller.signal });
    if (!res.ok) throw new Error(`Backend error ${res.status}: ${fullUrl}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Endpoints (agora chamam o backend, que chama a API externa) ───────────

/** Busca ligas — filtra por país se passado */
export async function fetchLeagues(country) {
  return backendFetch('/leagues', country ? { country } : {});
}

/** Busca times — filtra por país ou liga */
export async function fetchTeams({ country, league } = {}) {
  const params = {};
  if (country) params.country = country;
  if (league)  params.league  = league;
  return backendFetch('/teams', params);
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
  const params = {};
  if (team)     params.team      = team;
  if (dateFrom) params.dateFrom  = dateFrom;   // o backend converte para date_from
  if (dateTo)   params.dateTo    = dateTo;     // o backend converte para date_to
  if (league)   params.league    = league;
  if (status)   params.status    = status;
  return backendFetch('/events', params);
}

/** Busca o próximo jogo de um time */
export async function fetchNextGame(teamName) {
  const today = new Date();
  const in60d = new Date(today);
  in60d.setDate(today.getDate() + 60);

  const fmt = (d) => d.toISOString().split('T')[0];

  const data = await fetchEvents({
    team:     teamName,
    dateFrom: fmt(today),
    dateTo:   fmt(in60d),
    status:   'notstarted',
  });

  const sorted = (data.results ?? []).sort(
    (a, b) => new Date(a.event_date) - new Date(b.event_date)
  );
  return sorted[0] ?? null;
}

/** Jogos ao vivo */
export async function fetchLive() {
  return backendFetch('/live');
}

/** Predições para próximos jogos */
export async function fetchPredictions() {
  return backendFetch('/predictions');
}

/** Jogadores */
export async function fetchPlayers({ team, nationality, position } = {}) {
  const params = {};
  if (team)        params.team        = team;
  if (nationality) params.nationality = nationality;
  if (position)    params.position    = position;
  return backendFetch('/players', params);
}

// ─── Imagens (ainda chamam diretamente a API externa) ───────────────────────
// Se preferir, você pode também criar rotas de proxy para imagens no backend
// e usar `BACKEND_URL` aqui, mas para simplificar mantemos o acesso direto.
export const teamLogoUrl   = (apiId) => `${IMG_BASE}/team/${apiId}/?token=${EXTERNAL_TOKEN}`;
export const leagueLogoUrl = (apiId) => `${IMG_BASE}/league/${apiId}/?token=${EXTERNAL_TOKEN}`;
export const playerPhotoUrl= (apiId) => `${IMG_BASE}/player/${apiId}/?token=${EXTERNAL_TOKEN}`;

// ─── Conversor: evento BSD → formato NextGame do app ─────────────────────────
export function bsdEventToNextGame(event) {
  if (!event) return null;

  const dt = new Date(event.event_date);
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const day  = days[dt.getDay()];
  const date = `${day} ${dt.getDate()}/${months[dt.getMonth()]} • ${String(dt.getHours()).padStart(2,'0')}h`;

  const home = event.home_team_obj;
  const away = event.away_team_obj;

  return {
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
    pills:   [],
    _raw:    event,
  };
}