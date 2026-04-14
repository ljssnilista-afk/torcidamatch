// ─── Payment API Service ─────────────────────────────────────────────────────
// Todas as chamadas de pagamento ao backend.
// NUNCA armazene client_secret em state persistente ou localStorage.

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

// ─── Seleção automática de chave publicável por ambiente ────────────────────
// Em produção (import.meta.env.PROD === true) usa VITE_STRIPE_LIVE_PUBLISHABLE_KEY
// Em dev/test usa VITE_STRIPE_PUBLISHABLE_KEY
// Usado apenas como fallback — a fonte primária é o backend (/api/payments/config)
export function getLocalPublishableKey() {
  const isProd = import.meta.env.PROD
  const liveKey = import.meta.env.VITE_STRIPE_LIVE_PUBLISHABLE_KEY
  const testKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

  if (isProd && liveKey) return liveKey
  return testKey || liveKey || null
}

// ─── Buscar chave publicável do Stripe ───────────────────────────────────────
// Prioriza o backend (fonte da verdade, sincronizado com NODE_ENV do servidor).
// Se o backend falhar, usa o fallback local baseado no mode do Vite.
export async function getStripeConfig() {
  try {
    const res = await fetch(`${API_URL}/payments/config`)
    if (!res.ok) throw new Error('Erro ao buscar configuração do Stripe')
    return res.json() // { publishableKey, mode }
  } catch (err) {
    const fallback = getLocalPublishableKey()
    if (!fallback) throw err
    return {
      publishableKey: fallback,
      mode: import.meta.env.PROD ? 'live' : 'test',
      fallback: true,
    }
  }
}

// ─── Criar PaymentIntent para mensalidade de grupo ──────────────────────────
export async function createGroupPaymentIntent(token, groupId) {
  const res = await fetch(`${API_URL}/payments/create-group-payment-intent`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ groupId }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao criar pagamento')
  return data // { clientSecret, paymentIntentId, amount, currency }
}

// ─── Criar PaymentIntent para reserva de viagem ────────────────────────────
export async function createRidePaymentIntent(token, rideId) {
  const res = await fetch(`${API_URL}/payments/create-ride-payment-intent`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ rideId }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao criar pagamento')
  return data // { clientSecret, paymentIntentId, amount, currency, isMember }
}
