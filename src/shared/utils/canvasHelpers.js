// ─── Canvas Drawing Utilities ────────────────────────────────────────────────

const rnd = (a, b) => a + Math.random() * (b - a)


/**
 * Draw the champion banner background (gold particles + glow).
 */
export function drawChampionBanner(canvas) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#1c1500')
  g.addColorStop(0.5, '#0f0f00')
  g.addColorStop(1, '#050400')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  for (let i = 0; i < 45; i++) {
    ctx.fillStyle = `rgba(212,175,55,${rnd(0.08, 0.45).toFixed(2)})`
    ctx.beginPath()
    ctx.arc(rnd(0, W), rnd(0, H), rnd(0.4, 2), 0, Math.PI * 2)
    ctx.fill()
  }

  const gl = ctx.createRadialGradient(W * 0.14, H * 0.5, 0, W * 0.14, H * 0.5, 110)
  gl.addColorStop(0, 'rgba(212,175,55,0.3)')
  gl.addColorStop(1, 'transparent')
  ctx.fillStyle = gl
  ctx.fillRect(0, 0, W, H)
}

/**
 * Draw the Next Game background (green arch silhouette of Nilton Santos).
 */
export function drawGameBackground(canvas) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#050d05')
  g.addColorStop(1, '#020602')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(34,197,94,0.1)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(W * 0.5, H * 3.2, H * 3.4, Math.PI * 1.05, Math.PI * 1.95)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(34,197,94,0.04)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(W * 0.5, H * 3.4, H * 3.6, Math.PI * 1.06, Math.PI * 1.94)
  ctx.stroke()

  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rnd(0.08, 0.45).toFixed(2)})`
    ctx.beginPath()
    ctx.arc(rnd(0, W), rnd(0, H * 0.55), rnd(0.25, 1.1), 0, Math.PI * 2)
    ctx.fill()
  }

  const gl = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, W * 0.48)
  gl.addColorStop(0, 'rgba(34,197,94,0.1)')
  gl.addColorStop(1, 'transparent')
  ctx.fillStyle = gl
  ctx.fillRect(0, 0, W, H)
}

/**
 * Draw a small thumbnail for group list cards.
 */
export function drawThumb(canvas, cfg = {}) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, cfg.c0 ?? '#0a180a')
  g.addColorStop(1, cfg.c1 ?? '#050d05')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  const crowd = cfg.crowd ?? [['255,255,255'], ['0,0,0'], ['180,180,175']]
  for (let i = 0; i < 80; i++) {
    const c = crowd[Math.floor(rnd(0, crowd.length))]
    ctx.fillStyle = `rgba(${c},${rnd(0.3, 0.8).toFixed(2)})`
    ctx.beginPath()
    ctx.arc(rnd(0, W), rnd(0, H * 0.65), rnd(1, 2.5), 0, Math.PI * 2)
    ctx.fill()
  }

  const fg = ctx.createLinearGradient(0, H * 0.62, 0, H)
  fg.addColorStop(0, '#1a5a1a')
  fg.addColorStop(1, '#0f3a0f')
  ctx.fillStyle = fg
  ctx.fillRect(0, H * 0.62, W, H)

  if (cfg.accent) {
    ctx.fillStyle = cfg.accent
    ctx.fillRect(0, H * 0.3, W, 6)
  }

  const gl = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.6)
  gl.addColorStop(0, cfg.glow ?? 'rgba(34,197,94,0.2)')
  gl.addColorStop(1, 'transparent')
  ctx.fillStyle = gl
  ctx.fillRect(0, 0, W, H)
}


/**
 * Thumb config presets by variant name.
 */
export const THUMB_CONFIGS = {
  'green-fire': {
    c0: '#0d0d08', c1: '#050505',
    crowd: ['255,255,255', '0,0,0', '200,200,195', '34,197,94'],
    glow: 'rgba(34,197,94,0.2)', accent: 'rgba(34,197,94,0.6)',
  },
  'green-gold': {
    c0: '#080d08', c1: '#040804',
    crowd: ['255,255,255', '0,0,0', '180,180,175', '212,175,55'],
    glow: 'rgba(34,197,94,0.15)', accent: 'rgba(212,175,55,0.5)',
  },
  green: {
    c0: '#0a0808', c1: '#050404',
    crowd: ['255,255,255', '0,0,0', '160,160,155'],
    glow: 'rgba(34,197,94,0.12)', accent: 'rgba(34,197,94,0.4)',
  },
  feminine: {
    c0: '#120010', c1: '#080008',
    crowd: ['255,255,255', '0,0,0', '192,96,192'],
    glow: 'rgba(192,96,192,0.2)', accent: 'rgba(192,96,192,0.55)',
  },
  silver: {
    c0: '#080808', c1: '#040404',
    crowd: ['255,255,255', '0,0,0', '200,200,200'],
    glow: 'rgba(200,200,200,0.12)', accent: 'rgba(200,200,200,0.4)',
  },
  gold: {
    c0: '#0e0a00', c1: '#060400',
    crowd: ['255,255,255', '0,0,0', '212,175,55'],
    glow: 'rgba(212,175,55,0.2)', accent: 'rgba(212,175,55,0.6)',
  },
}

