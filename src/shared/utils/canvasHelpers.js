// ─── Canvas Drawing Utilities ────────────────────────────────────────────────

const rnd = (a, b) => a + Math.random() * (b - a)

/**
 * Draw a procedural stadium background onto a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {object} cfg - Configuration object
 */
export function drawStadium(canvas, cfg = {}) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55)
  sky.addColorStop(0, '#050505')
  sky.addColorStop(1, '#0c0c0c')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // Stars
  for (let i = 0; i < 65; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rnd(0.2, 0.85).toFixed(2)})`
    ctx.beginPath()
    ctx.arc(rnd(0, W), rnd(0, H * 0.42), rnd(0.15, 1.1), 0, Math.PI * 2)
    ctx.fill()
  }

  // Lone star (Estrela Solitária)
  if (cfg.starX != null) {
    const sx = cfg.starX * W
    const sy = (cfg.starY ?? 0.09) * H
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 48)
    g.addColorStop(0, 'rgba(212,175,55,0.55)')
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(212,175,55,0.95)'
    ctx.beginPath()
    ctx.arc(sx, sy, 3.8, 0, Math.PI * 2)
    ctx.fill()
  }

  // Floodlight halos
  ;[[W * 0.1, H * 0.15], [W * 0.9, H * 0.15]].forEach(([px, py]) => {
    const gl = ctx.createRadialGradient(px, py, 0, px, py, 140)
    gl.addColorStop(0, 'rgba(255,248,200,0.2)')
    gl.addColorStop(1, 'transparent')
    ctx.fillStyle = gl
    ctx.fillRect(0, 0, W, H)
  })

  // Stand bowl
  const st = H * 0.11
  const sb = H * 0.46
  const sg = ctx.createLinearGradient(0, st, 0, sb)
  sg.addColorStop(0, cfg.s0 ?? 'rgba(16,16,12,0.95)')
  sg.addColorStop(0.5, cfg.s1 ?? 'rgba(9,9,7,0.9)')
  sg.addColorStop(1, cfg.s2 ?? 'rgba(3,3,2,0.95)')
  ctx.fillStyle = sg
  ctx.beginPath()
  ctx.moveTo(W * 0.03, sb)
  ctx.lineTo(0, st + 35)
  ctx.quadraticCurveTo(W * 0.07, st - 14, W * 0.5, st - 20)
  ctx.quadraticCurveTo(W * 0.93, st - 14, W, st + 35)
  ctx.lineTo(W * 0.97, sb)
  ctx.closePath()
  ctx.fill()

  // Crowd pixels
  const crowd = cfg.crowd ?? [
    '255,255,255', '0,0,0', '180,180,175', '100,100,95', '212,175,55',
  ]
  for (let row = 0; row < 8; row++) {
    const pr = row / 8
    const ry = st + 4 + row * ((sb - st - 8) / 8)
    const rw = W * (0.05 + pr * 0.9)
    const sx = (W - rw) / 2
    const cols = Math.floor(rw / 11)
    for (let col = 0; col < cols; col++) {
      const cx = sx + col * (rw / cols)
      const cy = ry + rnd(-2, 2)
      const al = rnd(0.28, 0.82)
      const c = crowd[Math.floor(rnd(0, crowd.length))]
      ctx.fillStyle = `rgba(${c},${al.toFixed(2)})`
      ctx.beginPath()
      ctx.arc(cx, cy, 3.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Banners
  const banners = cfg.banners ?? [
    'rgba(255,255,255,0.62)', 'rgba(0,0,0,0.68)', 'rgba(212,175,55,0.55)',
  ]
  banners.forEach((b) => {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = b
      ctx.fillRect(rnd(W * 0.04, W * 0.7), st + rnd(4, sb - st - 22), rnd(18, 52), 5)
    }
  })

  // Field
  const ft = H * 0.44
  const fb = H * 0.67
  const fg = ctx.createLinearGradient(0, ft, 0, fb)
  fg.addColorStop(0, '#1a5a1a')
  fg.addColorStop(0.4, '#257225')
  fg.addColorStop(0.8, '#1a5a1a')
  fg.addColorStop(1, '#153c15')
  ctx.fillStyle = fg
  ctx.beginPath()
  ctx.moveTo(0, fb)
  ctx.lineTo(0, ft + 12)
  ctx.quadraticCurveTo(W / 2, ft - 6, W, ft + 12)
  ctx.lineTo(W, fb)
  ctx.fill()

  // Field stripes
  for (let s = 0; s < 5; s++) {
    ctx.fillStyle = 'rgba(0,0,0,0.07)'
    ctx.fillRect((s * W) / 5, ft, W / 10, fb - ft)
  }

  // Field lines
  ctx.strokeStyle = 'rgba(255,255,255,0.21)'
  ctx.lineWidth = 1
  const midY = ft + (fb - ft) / 2
  ctx.beginPath()
  ctx.arc(W / 2, midY, 30, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.24)'
  ctx.beginPath()
  ctx.arc(W / 2, midY, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(W * 0.04, midY)
  ctx.lineTo(W * 0.96, midY)
  ctx.stroke()
  ;[
    [W * 0.1, ft + 4, W * 0.42, 26],
    [W * 0.48, ft + 4, W * 0.42, 26],
  ].forEach((b) => ctx.strokeRect(b[0], b[1], b[2], b[3]))

  // Lower stands
  const lsg = ctx.createLinearGradient(0, fb, 0, fb + H * 0.14)
  lsg.addColorStop(0, 'rgba(9,9,7,0.95)')
  lsg.addColorStop(1, 'rgba(0,0,0,0.98)')
  ctx.fillStyle = lsg
  ctx.fillRect(0, fb, W, H * 0.14)
  for (let lr = 0; lr < 3; lr++) {
    for (let lc = 0; lc < 26; lc++) {
      const c3 = crowd[Math.floor(rnd(0, crowd.length))]
      const al3 = rnd(0.2, 0.5)
      ctx.fillStyle = `rgba(${c3},${al3.toFixed(2)})`
      ctx.beginPath()
      ctx.arc(8 + (lc * (W - 16)) / 25, fb + 5 + lr * 12, 3.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Floodlight poles
  ;[[W * 0.11, H * 0.15], [W * 0.89, H * 0.15]].forEach(([px, py]) => {
    ctx.fillStyle = 'rgba(200,195,170,0.38)'
    ctx.fillRect(px - 3, py, 6, 55)
    ctx.fillStyle = 'rgba(255,248,145,0.48)'
    ctx.fillRect(px - 13, py - 2, 26, 6)
  })
}

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
 * Draw the mini-map for the Grupos screen.
 */
export function drawMiniMap(canvas, pins = []) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  ctx.fillStyle = '#0c140c'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ;[
    [[0, 30], [W, 30]], [[0, 60], [W, 60]], [[0, 90], [W, 90]],
    [[60, 0], [60, H]], [[140, 0], [140, H]], [[220, 0], [220, H]], [[300, 0], [300, H]],
  ].forEach(([a, b]) => {
    ctx.beginPath()
    ctx.moveTo(a[0], a[1])
    ctx.lineTo(b[0], b[1])
    ctx.stroke()
  })

  // User dot
  const ux = 140, uy = 60
  const ug = ctx.createRadialGradient(ux, uy, 0, ux, uy, 20)
  ug.addColorStop(0, 'rgba(34,197,94,0.4)')
  ug.addColorStop(1, 'transparent')
  ctx.fillStyle = ug
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#22C55E'
  ctx.beginPath()
  ctx.arc(ux, uy, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(34,197,94,0.3)'
  ctx.beginPath()
  ctx.arc(ux, uy, 12, 0, Math.PI * 2)
  ctx.fill()

  // Pins
  const defaultPins = [
    { x: 80, y: 40, c: '#EF4444', l: 'FJ' }, { x: 140, y: 60, c: '#22C55E', l: 'CF' },
    { x: 210, y: 80, c: '#22C55E', l: 'FG' }, { x: 290, y: 50, c: '#C060C0', l: 'AB' },
    { x: 60, y: 90, c: '#C8C8C8', l: 'BN' }, { x: 240, y: 30, c: '#D4AF37', l: 'RA' },
  ]
  ;(pins.length ? pins : defaultPins).forEach((p) => {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.beginPath()
    ctx.arc(p.x, p.y + 2, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = p.c
    ctx.beginPath()
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.font = 'bold 6px Inter'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(p.l, p.x, p.y)
  })

  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(4, H - 18, 140, 14)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '9px Inter'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('● Você  ● Grupos disponíveis', 8, H - 11)
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

/**
 * Stadium config presets by variant index.
 */
export const STADIUM_CONFIGS = [
  { starX: 0.74, starY: 0.08 },
  {
    starX: 0.22, starY: 0.06,
    crowd: ['255,255,255', '0,0,0', '200,200,195', '90,90,85', '34,197,94'],
    banners: ['rgba(255,255,255,0.62)', 'rgba(0,0,0,0.68)', 'rgba(34,197,94,0.48)'],
  },
  {
    crowd: ['255,255,255', '0,0,0', '200,200,195', '130,130,125', '180,180,170'],
    banners: ['rgba(255,255,255,0.62)', 'rgba(0,0,0,0.68)', 'rgba(200,200,200,0.42)'],
  },
]
