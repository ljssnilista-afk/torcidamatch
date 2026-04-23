// ─── TorcidaMatch Auth API ────────────────────────────────────────────────────
// Em dev:  usa proxy Vite /torcida-api → localhost:3001 (sem CORS)
// Em prod: usa VITE_API_URL do .env
 
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'
 
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`)
  return data
}
 
/** Cadastro — retorna { token, user } */
export async function registerUser(userData) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}
 
/** Login — retorna { token, user } */
export async function loginUser(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}
 
/** Verifica disponibilidade de @handle — retorna { available, handle } */
export async function checkHandle(handle) {
  const clean = handle.replace(/^@/, '').toLowerCase().trim()
  return apiFetch(`/auth/check-handle/${clean}`)
}
 
/** Perfil do usuário logado — requer token */
export async function getMyProfile(token) {
  return apiFetch('/profile/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}
 
/** Atualiza perfil — requer token */
export async function updateProfile(token, updates) {
  return apiFetch('/profile/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(updates),
  })
}
 