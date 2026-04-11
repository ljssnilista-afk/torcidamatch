// ─── Home Screen Data ───────────────────────────────────────────────────────

export const USER = {
  name: 'Carlos',
  team: 'Botafogo',
  location: 'Copacabana • Zona Sul',
  myGroup: {
    id: 'copa-fogo',
    name: 'Copa-Fogo',
    nextCaravana: 'Dom 22/06 • 18:30',
  },
}

export const CHAMPION_INFO = {
  eyebrow: 'Glória Alvinegra • 2024',
  title: 'Campeão da Libertadores',
  subtitle: 'Estrela Solitária ilumina o mundo',
}

export const ALERT = {
  text: 'Dia de jogo! Caronas saindo da Arnaldo Quintela agora',
}

export const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'zona-sul', label: 'Zona Sul' },
  { id: 'zona-norte', label: 'Zona Norte' },
  { id: 'niteroi', label: 'Niterói' },
  { id: 'organizada', label: 'Organizada' },
  { id: 'familia', label: 'Família' },
  { id: 'feminino', label: 'Feminino' },
  { id: 'jovem', label: 'Jovem' },
]

export const GROUP_CARDS = [
  {
    id: 'copa-fogo',
    name: 'Copa-Fogo',
    team: 'Botafogo',
    region: 'Copacabana',
    distance: '3.2 km',
    zone: 'Zona Sul',
    members: 78,
    maxMembers: 100,
    rating: 4.9,
    ratingCount: 62,
    meetPoint: 'Av. Atlântica',
    lat: -22.9711,
    lng: -43.1822,
    privacy: 'private',
    price: 'R$ 19,90/mês',
    badge: 'oficial',
    badgeLabel: '★ Caravana Oficial',
    canvasVariant: 0,
    actionLabel: 'Assinar grupo',
    actionVariant: 'brand',
  },
  {
    id: 'furia-jovem',
    name: 'Fúria Jovem Tijuca',
    team: 'Botafogo',
    region: 'Abolição / Tijuca',
    distance: '1.8 km',
    zone: 'Zona Norte',
    members: 95,
    maxMembers: 100,
    rating: 4.8,
    ratingCount: 88,
    meetPoint: 'Praça Saens Peña',
    lat: -22.9253,
    lng: -43.2345,
    privacy: 'private',
    price: 'R$ 14,90/mês',
    badge: 'green',
    badgeLabel: 'Fúria Jovem',
    canvasVariant: 1,
    actionLabel: 'Quase lotado!',
    actionVariant: 'danger',
  },
  {
    id: 'botachopp',
    name: 'Botachopp Niterói',
    team: 'Botafogo',
    region: 'Niterói',
    distance: '12 km',
    zone: 'Niterói',
    members: 63,
    maxMembers: 100,
    rating: 4.9,
    ratingCount: 51,
    meetPoint: 'Balsa Charitas',
    lat: -22.9426,
    lng: -43.1291,
    privacy: 'private',
    price: 'R$ 24,90/mês',
    badge: 'silver',
    badgeLabel: '★ Família',
    canvasVariant: 2,
    actionLabel: 'Assinar grupo',
    actionVariant: 'brand',
  },
]

export const SUGGESTIONS = [
  {
    id: 'fogoncalo',
    initials: 'FG',
    name: 'Fogonçalo',
    location: 'Engenho de Dentro',
    audience: 'Jovens 16–24',
    tag: 'NOVO',
    variant: 'green',
  },
  {
    id: 'alvinegras-barra',
    initials: 'AB',
    name: 'Alvinegras da Barra',
    location: 'Barra da Tijuca',
    audience: 'Torcida Feminina',
    tag: '♀',
    variant: 'feminine',
  },
  {
    id: 'manequinho-fogo',
    initials: 'MF',
    name: 'Manequinho Fogo',
    location: 'General Severiano',
    audience: 'Família',
    tag: '⭑',
    variant: 'silver',
  },
  {
    id: 'campo-grande',
    initials: 'CG',
    name: 'Fogão de Campo Grande',
    location: 'Campo Grande',
    audience: 'Zona Oeste',
    tag: 'NOVO',
    variant: 'green',
  },
]

export const NEXT_GAME = {
  label: 'Próximo jogo — Nilton Santos',
  homeTeam: { code: 'BOT', name: 'Botafogo', bg: '#111', color: '#fff' },
  awayTeam: { code: 'FLA', name: 'Flamengo', bg: '#CC0000', color: '#fff' },
  date: 'Dom 22/06 • 16h',
  stadium: 'Estádio Nilton Santos',
  pills: [
    { icon: 'users', text: '22 caronas' },
    { icon: 'clock', text: '3h 40min' },
    { icon: 'pin', text: 'Arnaldo Quintela' },
  ],
}

export const RIDES = [
  {
    id: 'furia-ride',
    initials: 'FJ',
    name: 'Fúria Jovem',
    vehicle: 'ônibus',
    price: 'R$ 20',
    location: 'Engenho',
    badge: 'oficial',
    avatarStyle: { background: 'rgba(212,175,55,0.12)', color: '#D4AF37' },
  },
  {
    id: 'mancha-barra',
    initials: 'MB',
    name: 'Mancha Barra',
    vehicle: 'ônibus',
    price: 'R$ 22',
    location: 'Barra',
    badge: 'oficial',
    avatarStyle: { background: 'rgba(34,197,94,0.10)', color: '#22C55E' },
  },
  {
    id: 'van-joao',
    initials: 'JO',
    name: 'Van do João',
    vehicle: 'van',
    price: 'R$ 28',
    location: 'Niterói',
    badge: 'vagas',
    badgeText: '5 vagas',
    avatarStyle: { background: 'rgba(255,255,255,0.08)', color: '#fff' },
  },
  {
    id: 'carro-ana',
    initials: 'AN',
    name: 'Carro da Ana',
    vehicle: 'carro',
    price: 'R$ 18',
    location: 'Copa',
    badge: 'vagas',
    badgeText: '2 vagas',
    avatarStyle: { background: 'rgba(255,255,255,0.07)', color: '#ccc' },
  },
]

export const FEMALE_ALERT = {
  title: 'Alvinegras da Barra — em formação',
  description:
    'Detectamos 12 torcedoras na Barra da Tijuca. Que tal criar um grupo feminino?',
  cta: 'Criar grupo Alvinegras da Barra',
}
