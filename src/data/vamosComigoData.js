// ─── Vamos Comigo! Screen Data ───────────────────────────────────────────────

export const VC_FILTERS = [
  { id: 'todos',    label: 'Todos' },
  { id: 'carro',   label: '🚗 Carro' },
  { id: 'van',     label: '🚐 Van' },
  { id: 'onibus',  label: '🚌 Ônibus' },
  { id: 'ate20',   label: 'Até R$20' },
  { id: '3vagas',  label: '+3 vagas' },
]

export const NEXT_GAME_BANNER = {
  home: 'Botafogo',
  away: 'Flamengo',
  date: 'Dom 22/06',
  time: '16:00',
  stadium: 'Nilton Santos',
}

export const RIDES = [
  {
    id: 'ana',
    initials: 'AN',
    name: 'Ana',
    rating: 4.9,
    vehicle: 'carro',
    departure: '18:15',
    neighborhood: 'Botafogo',
    vagas: 3,
    distanceKm: 0.9,
    price: 18,
    isOfficial: false,
    avatarBg: '#5B21B6',
    type: 'carro',
  },
  {
    id: 'joao',
    initials: 'JO',
    name: 'João',
    rating: 4.8,
    vehicle: 'carro',
    departure: '19:00',
    neighborhood: 'Tijuca',
    vagas: 2,
    distanceKm: 1.8,
    price: 20,
    isOfficial: false,
    avatarBg: '#1D4ED8',
    type: 'carro',
  },
  {
    id: 'furia',
    initials: 'FJ',
    name: 'Fúria Jovem',
    rating: 4.9,
    vehicle: 'van',
    departure: '18:30',
    neighborhood: 'Copacabana',
    vagas: 5,
    distanceKm: 2.1,
    price: 25,
    priceMember: 20,
    priceNonMember: 30,
    isOfficial: true,
    avatarBg: '#D4AF37',
    type: 'van',
  },
  {
    id: 'van-tijuca',
    initials: 'VT',
    name: 'Van da Tijuca',
    rating: 4.6,
    vehicle: 'van',
    departure: '18:45',
    neighborhood: 'Tijuca',
    vagas: 8,
    distanceKm: 2.5,
    price: 22,
    isOfficial: false,
    avatarBg: '#065F46',
    type: 'van',
  },
  {
    id: 'mancha',
    initials: 'MB',
    name: 'Mancha Barra',
    rating: 4.7,
    vehicle: 'onibus',
    departure: '17:45',
    neighborhood: 'Barra',
    vagas: 20,
    distanceKm: 5.3,
    price: 30,
    priceMember: 22,
    priceNonMember: 30,
    isOfficial: true,
    avatarBg: '#D4AF37',
    type: 'onibus',
  },
  {
    id: 'botachopp',
    initials: 'BC',
    name: 'Botachopp',
    rating: 4.9,
    vehicle: 'onibus',
    departure: '17:30',
    neighborhood: 'Niterói',
    vagas: 40,
    distanceKm: 12,
    price: 15,
    isOfficial: false,
    avatarBg: '#0F766E',
    type: 'onibus',
  },
]

// Filter logic
export function filterRides(rides, activeFilter) {
  switch (activeFilter) {
    case 'carro':   return rides.filter(r => r.type === 'carro')
    case 'van':     return rides.filter(r => r.type === 'van')
    case 'onibus':  return rides.filter(r => r.type === 'onibus')
    case 'ate20':   return rides.filter(r => r.price <= 20)
    case '3vagas':  return rides.filter(r => r.vagas >= 3)
    default:        return rides
  }
}

// Sort: distance ASC, then vagas DESC
export function sortRides(rides) {
  return [...rides].sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
    return b.vagas - a.vagas
  })
}
