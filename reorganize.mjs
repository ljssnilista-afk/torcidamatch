#!/usr/bin/env node
/**
 * reorganize.mjs
 * TorcidaMatch — migração para feature-based structure
 *
 * Uso:  node reorganize.mjs
 * OBS:  Execute na raiz do projeto (onde fica vite.config.js).
 *       Faça um commit antes de rodar — o script apaga as pastas originais.
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, 'src')

// ─── Utilitários ──────────────────────────────────────────────────────────────
function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true })
}

function moveFile(from, to) {
  const src = join(SRC, from)
  const dst = join(SRC, to)
  if (!existsSync(src)) { console.warn(`  ⚠  Não encontrado: ${from}`) ; return }
  ensureDir(dst)
  copyFileSync(src, dst)
}

function readSrc(rel) {
  const p = rel.startsWith('..') ? join(SRC, rel) : join(SRC, rel)
  // suporte a caminhos relativos à pasta src
  const abs = join(SRC, rel)
  if (!existsSync(abs)) return null
  return readFileSync(abs, 'utf8')
}

function writeSrc(rel, content) {
  writeFileSync(join(SRC, rel), content, 'utf8')
}

// ─── 1. MAPA DE MOVIMENTAÇÃO ──────────────────────────────────────────────────
const MOVES = [
  // ── auth ──────────────────────────────────────────────────────────────────
  ['pages/LoginScreen.jsx',                  'modules/auth/LoginScreen.jsx'],
  ['pages/LoginScreen.module.css',           'modules/auth/LoginScreen.module.css'],

  // ── home ──────────────────────────────────────────────────────────────────
  ['pages/HomeScreen.jsx',                   'modules/home/HomeScreen.jsx'],
  ['pages/HomeScreen.module.css',            'modules/home/HomeScreen.module.css'],
  ['ui/NewsBanner.jsx',                      'modules/home/components/NewsBanner.jsx'],
  ['ui/NewsBanner.module.css',               'modules/home/components/NewsBanner.module.css'],
  ['ui/NotificationBar.jsx',                 'modules/home/components/NotificationBar.jsx'],
  ['ui/NotificationBar.module.css',          'modules/home/components/NotificationBar.module.css'],
  ['ui/NextGame.jsx',                        'modules/home/components/NextGame.jsx'],
  ['ui/NextGame.module.css',                 'modules/home/components/NextGame.module.css'],
  ['ui/RidesSection.jsx',                    'modules/home/components/RidesSection.jsx'],
  ['ui/RidesSection.module.css',             'modules/home/components/RidesSection.module.css'],
  ['ui/FemaleAlert.jsx',                     'modules/home/components/FemaleAlert.jsx'],
  ['ui/FemaleAlert.module.css',              'modules/home/components/FemaleAlert.module.css'],
  ['ui/SuggestCard.jsx',                     'modules/home/components/SuggestCard.jsx'],
  ['ui/SuggestCard.module.css',              'modules/home/components/SuggestCard.module.css'],
  ['ui/ChampionBanner.jsx',                  'modules/home/components/ChampionBanner.jsx'],
  ['ui/ChampionBanner.module.css',           'modules/home/components/ChampionBanner.module.css'],

  // ── grupos ────────────────────────────────────────────────────────────────
  ['pages/GruposScreen.jsx',                 'modules/grupos/GruposScreen.jsx'],
  ['pages/GruposScreen.module.css',          'modules/grupos/GruposScreen.module.css'],
  ['ui/GruposLista.jsx',                     'modules/grupos/components/GruposLista.jsx'],
  ['ui/GruposLista.module.css',              'modules/grupos/components/GruposLista.module.css'],

  // ── grupo-detalhe ─────────────────────────────────────────────────────────
  ['pages/GrupoScreen.jsx',                  'modules/grupo-detalhe/GrupoScreen.jsx'],
  ['pages/GrupoScreen.module.css',           'modules/grupo-detalhe/GrupoScreen.module.css'],

  // ── vamos-comigo ──────────────────────────────────────────────────────────
  ['pages/VamosComigoScreen.jsx',            'modules/vamos-comigo/VamosComigoScreen.jsx'],
  ['pages/VamosComigoScreen.module.css',     'modules/vamos-comigo/VamosComigoScreen.module.css'],

  // ── criar-grupo ───────────────────────────────────────────────────────────
  ['pages/CriarGrupoScreen.jsx',             'modules/criar-grupo/CriarGrupoScreen.jsx'],
  ['pages/CriarGrupoScreen.module.css',      'modules/criar-grupo/CriarGrupoScreen.module.css'],

  // ── criar-viagem ──────────────────────────────────────────────────────────
  ['pages/CriarViagemScreen.jsx',            'modules/criar-viagem/CriarViagemScreen.jsx'],
  ['pages/CriarViagemScreen.module.css',     'modules/criar-viagem/CriarViagemScreen.module.css'],

  // ── viagem-detalhe ────────────────────────────────────────────────────────
  ['pages/DetalhesViagemScreen.jsx',         'modules/viagem-detalhe/DetalhesViagemScreen.jsx'],
  ['pages/DetalhesViagemScreen.module.css',  'modules/viagem-detalhe/DetalhesViagemScreen.module.css'],

  // ── fui ───────────────────────────────────────────────────────────────────
  ['pages/FuiScreen.jsx',                    'modules/fui/FuiScreen.jsx'],
  ['pages/FuiScreen.module.css',             'modules/fui/FuiScreen.module.css'],

  // ── perfil ────────────────────────────────────────────────────────────────
  ['pages/PerfilScreen.jsx',                 'modules/perfil/PerfilScreen.jsx'],
  ['pages/PerfilScreen.module.css',          'modules/perfil/PerfilScreen.module.css'],

  // ── favoritos ─────────────────────────────────────────────────────────────
  ['pages/FavoritosScreen.jsx',              'modules/favoritos/FavoritosScreen.jsx'],
  ['pages/FavoritosScreen.module.css',       'modules/favoritos/FavoritosScreen.module.css'],

  // ── notificacoes ──────────────────────────────────────────────────────────
  ['pages/NotificationsScreen.jsx',          'modules/notificacoes/NotificationsScreen.jsx'],
  ['pages/NotificationsScreen.module.css',   'modules/notificacoes/NotificationsScreen.module.css'],

  // ── assinatura ────────────────────────────────────────────────────────────
  ['pages/AssinaturaScreen.jsx',             'modules/assinatura/AssinaturaScreen.jsx'],
  ['pages/AssinaturaScreen.module.css',      'modules/assinatura/AssinaturaScreen.module.css'],

  // ── reserva-vaga ──────────────────────────────────────────────────────────
  ['pages/ReservaVagaScreen.jsx',            'modules/reserva-vaga/ReservaVagaScreen.jsx'],
  ['pages/ReservaVagaScreen.module.css',     'modules/reserva-vaga/ReservaVagaScreen.module.css'],

  // ── shared/ui ─────────────────────────────────────────────────────────────
  ['ui/BottomNav.jsx',                       'shared/ui/BottomNav.jsx'],
  ['ui/BottomNav.module.css',                'shared/ui/BottomNav.module.css'],
  ['ui/Header.jsx',                          'shared/ui/Header.jsx'],
  ['ui/Header.module.css',                   'shared/ui/Header.module.css'],
  ['ui/StatusBar.jsx',                       'shared/ui/StatusBar.jsx'],
  ['ui/StatusBar.module.css',                'shared/ui/StatusBar.module.css'],
  ['ui/Filters.jsx',                         'shared/ui/Filters.jsx'],
  ['ui/Filters.module.css',                  'shared/ui/Filters.module.css'],
  ['ui/GroupCard.jsx',                       'shared/ui/GroupCard.jsx'],
  ['ui/GroupCard.module.css',                'shared/ui/GroupCard.module.css'],
  ['ui/CheckoutForm.jsx',                    'shared/ui/CheckoutForm.jsx'],
  ['ui/PaymentModal.jsx',                    'shared/ui/PaymentModal.jsx'],

  // ── shared/contexts ───────────────────────────────────────────────────────
  ['context/FavoritesContext.jsx',           'shared/contexts/FavoritesContext.jsx'],
  ['context/GameContext.jsx',                'shared/contexts/GameContext.jsx'],
  ['context/LocationContext.jsx',            'shared/contexts/LocationContext.jsx'],
  ['context/NotificationsContext.jsx',       'shared/contexts/NotificationsContext.jsx'],
  ['context/ThemeContext.jsx',               'shared/contexts/ThemeContext.jsx'],
  ['context/ToastContext.jsx',               'shared/contexts/ToastContext.jsx'],
  ['context/ToastContext.module.css',        'shared/contexts/ToastContext.module.css'],
  ['context/UserContext.jsx',                'shared/contexts/UserContext.jsx'],

  // ── shared/hooks ──────────────────────────────────────────────────────────
  ['hooks/useNextGame.js',                   'shared/hooks/useNextGame.js'],

  // ── shared/services ───────────────────────────────────────────────────────
  ['services/authApi.js',                    'shared/services/authApi.js'],
  ['services/paymentApi.js',                 'shared/services/paymentApi.js'],

  // ── shared/utils ──────────────────────────────────────────────────────────
  ['utils/bsdApi.js',                        'shared/utils/bsdApi.js'],
  ['utils/canvasHelpers.js',                 'shared/utils/canvasHelpers.js'],
  ['utils/constants.js',                     'shared/utils/constants.js'],

  // ── shared/data ───────────────────────────────────────────────────────────
  ['data/favoritosData.js',                  'shared/data/favoritosData.js'],
  ['data/gruposData.js',                     'shared/data/gruposData.js'],
  ['data/homeData.js',                       'shared/data/homeData.js'],
  ['data/perfilData.js',                     'shared/data/perfilData.js'],
  ['data/vamosComigoData.js',                'shared/data/vamosComigoData.js'],

  // ── shared/styles ─────────────────────────────────────────────────────────
  ['assets/styles/main.css',                 'shared/styles/main.css'],
]

// ─── 2. REGRAS DE IMPORT ──────────────────────────────────────────────────────
//
// Regex global: '[./]*PASTA/' captura qualquer prefixo relativo
//   Ex: './context/', '../context/', '../../context/'
//
const SHARED_UI_NAMES = 'BottomNav|Header|StatusBar|Filters|GroupCard|CheckoutForm|PaymentModal'

const GLOBAL_RULES = [
  // context/ → @shared/contexts/
  [/from ['"][./]*context\//g,            `from '@shared/contexts/`],
  // utils/ → @shared/utils/
  [/from ['"][./]*utils\//g,              `from '@shared/utils/`],
  // services/ → @shared/services/
  [/from ['"][./]*services\//g,           `from '@shared/services/`],
  // data/ → @shared/data/
  [/from ['"][./]*data\//g,               `from '@shared/data/`],
  // hooks/ → @shared/hooks/
  [/from ['"][./]*hooks\//g,              `from '@shared/hooks/`],
  // assets/styles/ → @shared/styles/ (cobre "from '...'" e "import '...'")
  [/from ['"][./]*assets\/styles\//g,     `from '@shared/styles/`],
  [/import ['"][./]*assets\/styles\//g,   `import '@shared/styles/`],
  // ui/ genérica (componentes realmente compartilhados)
  [new RegExp(`from ['"][./]*ui/(${SHARED_UI_NAMES})(['"])`, 'g'),
    (_, name, q) => `from '@shared/ui/${name}${q}`],
]

// Mapeamento pages → módulo (para AppRouter)
const PAGE_MODULE_MAP = {
  LoginScreen:          'auth/LoginScreen',
  HomeScreen:           'home/HomeScreen',
  GruposScreen:         'grupos/GruposScreen',
  CriarGrupoScreen:     'criar-grupo/CriarGrupoScreen',
  GrupoScreen:          'grupo-detalhe/GrupoScreen',
  AssinaturaScreen:     'assinatura/AssinaturaScreen',
  VamosComigoScreen:    'vamos-comigo/VamosComigoScreen',
  CriarViagemScreen:    'criar-viagem/CriarViagemScreen',
  DetalhesViagemScreen: 'viagem-detalhe/DetalhesViagemScreen',
  ReservaVagaScreen:    'reserva-vaga/ReservaVagaScreen',
  FuiScreen:            'fui/FuiScreen',
  PerfilScreen:         'perfil/PerfilScreen',
  NotificationsScreen:  'notificacoes/NotificationsScreen',
  FavoritosScreen:      'favoritos/FavoritosScreen',
}

// Regras específicas por arquivo (rodam DEPOIS das globais)
const FILE_RULES = {
  // ── AppRouter: lazy(() => import('../pages/X')) ────────────────────────────
  'router/AppRouter.jsx': [
    // static imports (raro, mas por via das dúvidas)
    [/from ['"]\.\.\/pages\/(\w+)['"]/g,
      (_, name) => `from '@modules/${PAGE_MODULE_MAP[name] || name}'`],
    // lazy dynamic imports
    [/import\(['"]\.\.\/pages\/(\w+)['"]\)/g,
      (_, name) => `import('@modules/${PAGE_MODULE_MAP[name] || name}')`],
  ],

  // ── HomeScreen: componentes exclusivos → ./components/ ────────────────────
  'modules/home/HomeScreen.jsx': [
    [/from ['"][./]*ui\/(NewsBanner|NotificationBar|NextGame|RidesSection|FemaleAlert|SuggestCard|ChampionBanner)['"]/g,
      (_, name) => `from './components/${name}'`],
  ],

  // ── GruposScreen: GruposLista → ./components/ ────────────────────────────
  'modules/grupos/GruposScreen.jsx': [
    [/from ['"][./]*ui\/GruposLista['"]/g, `from './components/GruposLista'`],
  ],
}

// ─── 3. APLICA REGRAS ─────────────────────────────────────────────────────────
function applyRules(content, rules) {
  let out = content
  for (const [find, replace] of rules) {
    out = out.replace(find, replace)
  }
  return out
}

// ─── PASSO 1: copiar arquivos para nova estrutura ─────────────────────────────
console.log('\n📦  Movendo arquivos...\n')
for (const [from, to] of MOVES) {
  moveFile(from, to)
  console.log(`  ✓  ${from}  →  ${to}`)
}

// ─── PASSO 2: atualizar imports em todos os .js/.jsx ──────────────────────────
console.log('\n🔗  Atualizando imports...\n')

// Lista de todos os arquivos JS/JSX a processar
const ALL_JS_FILES = [
  // raiz src (App.jsx e main.jsx ficam onde estão)
  'App.jsx',
  'main.jsx',
  // router (permanece em router/)
  'router/AppRouter.jsx',
  // todos os arquivos movidos que são JS/JSX
  ...MOVES
    .filter(([, to]) => to.endsWith('.jsx') || to.endsWith('.js'))
    .map(([, to]) => to),
]

for (const relPath of ALL_JS_FILES) {
  const content = readSrc(relPath)
  if (!content) { console.warn(`  ⚠  Pulando (não encontrado): ${relPath}`) ; continue }

  let updated = applyRules(content, GLOBAL_RULES)

  // regras específicas do arquivo
  const specific = FILE_RULES[relPath]
  if (specific) updated = applyRules(updated, specific)

  if (updated !== content) {
    writeSrc(relPath, updated)
    console.log(`  ✓  ${relPath}`)
  }
}

// ─── PASSO 3: remover pastas originais ────────────────────────────────────────
console.log('\n🗑   Removendo pastas originais...\n')
const DIRS_TO_REMOVE = ['pages', 'ui', 'context', 'hooks', 'services', 'data', 'assets']
for (const dir of DIRS_TO_REMOVE) {
  const p = join(SRC, dir)
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true })
    console.log(`  ✓  removido: src/${dir}/`)
  }
}

console.log('\n✅  Reorganização concluída!')
console.log('   Próximo passo: npm run dev  para verificar que o app compila.\n')
