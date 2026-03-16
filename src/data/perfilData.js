// ─── Perfil Screen Data ───────────────────────────────────────────────────────

export const USER_PROFILE = {
  initials: 'BR',
  name: 'Bianca Rodrigues',
  handle: '@biancard23',
  age: 23,
  team: 'Botafogo',
  teamEmoji: '⚫⚪',
  bio: 'Torcedora apaixonada pelo Fogão! ⚫⚪ Presente em todos os jogos desde 2015.',
  isOwn: true,        // true = próprio perfil (mostra Editar / Engrenagem)
  memberSince: '2023',
  location: 'Copacabana, RJ',
}

export const USER_STATS = [
  { id: 'grupos',          label: 'Grupos',           value: 12, icon: 'users' },
  { id: 'caronas-dadas',   label: 'Caronas dadas',    value: 8,  icon: 'car-give' },
  { id: 'caronas-pegas',   label: 'Caronas pegas',    value: 15, icon: 'car-take' },
  { id: 'avaliacao',       label: 'Avaliação',         value: '4.9', icon: 'star', isRating: true },
]

export const USER_GROUPS = [
  {
    id: 'copa-fogo',
    name: 'Copa-Fogo',
    members: 78,
    maxMembers: 100,
    rating: 4.9,
    isLeader: true,
    thumbVariant: 'green-gold',
  },
  {
    id: 'furia-jovem',
    name: 'Fúria Jovem Tijuca',
    members: 95,
    maxMembers: 100,
    rating: 4.8,
    isLeader: false,
    thumbVariant: 'green-fire',
  },
  {
    id: 'botachopp',
    name: 'Botachopp Niterói',
    members: 63,
    maxMembers: 100,
    rating: 4.9,
    isLeader: false,
    thumbVariant: 'silver',
  },
]

export const RIDE_HISTORY = [
  {
    id: 'hist-1',
    match: 'Botafogo × Flamengo',
    date: '22/06',
    type: 'gave',        // 'gave' | 'took'
    typeLabel: 'Você ofereceu',
    rating: 5.0,
    vehicle: 'ônibus',
    from: 'Engenho de Dentro',
    passengers: 18,
  },
  {
    id: 'hist-2',
    match: 'Botafogo × Vasco',
    date: '15/06',
    type: 'took',
    typeLabel: 'Você pegou',
    rating: 4.8,
    vehicle: 'van',
    from: 'Copacabana',
    passengers: null,
  },
  {
    id: 'hist-3',
    match: 'Botafogo × Fluminense',
    date: '08/06',
    type: 'gave',
    typeLabel: 'Você ofereceu',
    rating: 4.9,
    vehicle: 'carro',
    from: 'Barra da Tijuca',
    passengers: 3,
  },
]

export const SETTINGS_SECTIONS = [
  {
    id: 'account',
    label: 'Conta',
    items: [
      { id: 'edit-profile', icon: 'user', label: 'Editar perfil' },
      { id: 'notifications', icon: 'bell', label: 'Notificações' },
      { id: 'privacy', icon: 'lock', label: 'Privacidade' },
    ],
  },
  {
    id: 'app',
    label: 'Aplicativo',
    items: [
      { id: 'location', icon: 'pin', label: 'Localização' },
      { id: 'language', icon: 'globe', label: 'Idioma', value: 'Português' },
      { id: 'about', icon: 'info', label: 'Sobre o app', value: 'v1.0.0' },
    ],
  },
  {
    id: 'danger',
    label: '',
    items: [
      { id: 'logout', icon: 'logout', label: 'Sair da conta', isDanger: true },
    ],
  },
]
