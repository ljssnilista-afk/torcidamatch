// ─── API endpoints ────────────────────────────────────────────────────────────
// Fonte única de verdade para as URLs base da API REST e WebSocket.
// Importe daqui — não declare const API_URL localmente nos screens.

/** URL base da API REST: /api */
export const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

/** URL base do WebSocket (mesmo host, protocolo ws/wss) */
export const WS_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws').replace(/\/$/, '')
  : 'ws://localhost:3001'
