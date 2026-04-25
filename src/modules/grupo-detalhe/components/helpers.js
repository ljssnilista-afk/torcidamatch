// ─── Funções utilitárias do módulo grupo-detalhe ─────────────────────────────

export function timeStr(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export function avatarColor(name = '') {
  const colors = ['#22C55E','#3B82F6','#D4AF37','#C060C0','#EF4444','#0EA5E9','#F97316']
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
}
