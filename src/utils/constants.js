// ─── TorcidaMatch Design Constants ───────────────────────────────────────────
// Single source of truth for all magic values used across the app.
// Import from here instead of hardcoding strings.

// ── Colors ────────────────────────────────────────────────────────────────────
export const COLORS = {
  bg:           '#000000',
  surface1:     '#0e0e0e',
  surface2:     '#181818',
  surface3:     '#222222',

  brand:        '#22C55E',
  brandLight:   '#5BDF6A',
  brandDark:    '#0d5428',

  gold:         '#D4AF37',
  silver:       '#C8C8C8',
  danger:       '#EF4444',
  blue:         '#3B82F6',
  feminine:     '#C060C0',

  textPrimary:  '#FFFFFF',
  textSecondary:'rgba(255,255,255,0.62)',
  textTertiary: 'rgba(255,255,255,0.35)',

  border:       'rgba(255,255,255,0.07)',
  border2:      'rgba(255,255,255,0.12)',
}

// ── Typography ────────────────────────────────────────────────────────────────
export const FONTS = {
  sans:    "'Inter', sans-serif",
  display: "'Bebas Neue', sans-serif",
}

export const FONT_SIZES = {
  xs:   9,
  sm:   11,
  base: 13,
  md:   14,
  lg:   16,
  xl:   18,
  '2xl': 22,
  '3xl': 28,
  '4xl': 32,
}

// ── Spacing / Radii ───────────────────────────────────────────────────────────
export const RADII = {
  xs:   6,
  sm:   8,
  md:   14,
  lg:   20,
  chip: 18,
  full: 9999,
}

// ── Routes ────────────────────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN:         '/login',
  HOME:          '/',
  GRUPOS:        '/grupos',
  CRIAR_GRUPO:   '/grupos/criar',
  GRUPO_DETAIL:  '/grupos/:id',
  ASSINAR_GRUPO: '/grupos/:id/assinar',
  VAMOS_COMIGO:  '/vamos-comigo',
  CRIAR_VIAGEM:  '/vamos-comigo/criar',
  DETALHE_VIAGEM:'/vamos-comigo/:id',
  RESERVAR_VAGA: '/vamos-comigo/:id/reservar',
  FUI:           '/fui',
  FAVORITOS:     '/fui',   // alias para compatibilidade
  PERFIL:        '/perfil',
  NOTIFICATIONS: '/notificacoes',
}

// ── Nav items (used by BottomNav + Router) ────────────────────────────────────
export const NAV_ITEMS = [
  { id: 'home',        route: ROUTES.HOME,         label: 'Início',       icon: 'home' },
  { id: 'grupos',      route: ROUTES.GRUPOS,        label: 'Grupos',       icon: 'users' },
  { id: 'vamocomigo',  route: ROUTES.VAMOS_COMIGO,  label: 'Vamos Comigo!', icon: 'bus' },
  { id: 'fui',          route: ROUTES.FUI,           label: 'Fui!',         icon: 'check-circle' },
  { id: 'perfil',      route: ROUTES.PERFIL,        label: 'Perfil',       icon: 'user' },
]

// ── Screens that show the shared Header ──────────────────────────────────────
export const HEADER_SCREENS = [ROUTES.HOME, ROUTES.GRUPOS]

// ── Occupation thresholds ─────────────────────────────────────────────────────
export const OCC_COLORS = {
  critical: COLORS.danger,   // >= 90%
  high:     COLORS.gold,     // >= 75%
  normal:   COLORS.brand,    // < 75%
}

export const getOccColor = (pct) => {
  if (pct >= 90) return OCC_COLORS.critical
  if (pct >= 75) return OCC_COLORS.high
  return OCC_COLORS.normal
}

// ── Toast durations ───────────────────────────────────────────────────────────
export const TOAST_DURATION = 2800   // ms

// ── Animation durations ───────────────────────────────────────────────────────
export const ANIM = {
  fast:   150,
  normal: 220,
  slow:   350,
}
