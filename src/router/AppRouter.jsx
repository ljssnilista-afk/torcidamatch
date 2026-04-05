import { lazy, Suspense, memo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../utils/constants'
import styles from './AppRouter.module.css'

// ─── Lazy-loaded screens ──────────────────────────────────────────────────────
const LoginScreen          = lazy(() => import('../pages/LoginScreen'))
const HomeScreen           = lazy(() => import('../pages/HomeScreen'))
const GruposScreen         = lazy(() => import('../pages/GruposScreen'))
const CriarGrupoScreen     = lazy(() => import('../pages/CriarGrupoScreen'))
const GrupoScreen          = lazy(() => import('../pages/GrupoScreen'))
const VamosComigoScreen    = lazy(() => import('../pages/VamosComigoScreen'))
const CriarViagemScreen    = lazy(() => import('../pages/CriarViagemScreen'))
const DetalhesViagemScreen = lazy(() => import('../pages/DetalhesViagemScreen'))
const FuiScreen            = lazy(() => import('../pages/FuiScreen'))
const PerfilScreen         = lazy(() => import('../pages/PerfilScreen'))
const NotificationsScreen  = lazy(() => import('../pages/NotificationsScreen'))

// ─── Screen skeleton shown while lazy chunk loads ────────────────────────────
function ScreenSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Carregando tela..." role="status">
      <div className={styles.skeletonHeader} />
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.skeletonCard} style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

// ─── Animated screen transition wrapper ─────────────────────────────────────
// Uses CSS class + key on location.pathname to trigger enter animation
// on every route change.
export const ScreenTransition = memo(function ScreenTransition({ children }) {
  const loc = useLocation()
  return (
    <div key={loc.pathname} className={styles.screenEnter}>
      {children}
    </div>
  )
})

// ─── Router ──────────────────────────────────────────────────────────────────
export default function AppRouter() {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <ScreenTransition>
        <Routes>
          <Route path={ROUTES.LOGIN}          element={<LoginScreen />} />
          <Route path={ROUTES.HOME}           element={<HomeScreen />} />
          <Route path={ROUTES.GRUPOS}         element={<GruposScreen />} />
          <Route path={ROUTES.CRIAR_GRUPO}    element={<CriarGrupoScreen />} />
          <Route path={ROUTES.GRUPO_DETAIL}   element={<GrupoScreen />} />
          <Route path={ROUTES.VAMOS_COMIGO}   element={<VamosComigoScreen />} />
          <Route path={ROUTES.CRIAR_VIAGEM}  element={<CriarViagemScreen />} />
          <Route path={ROUTES.DETALHE_VIAGEM} element={<DetalhesViagemScreen />} />
          <Route path={ROUTES.FUI}            element={<FuiScreen />} />
          <Route path={ROUTES.PERFIL}         element={<PerfilScreen />} />
          <Route path={ROUTES.NOTIFICATIONS}  element={<NotificationsScreen />} />
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </ScreenTransition>
    </Suspense>
  )
}
