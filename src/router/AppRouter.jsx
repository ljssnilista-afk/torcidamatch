import { lazy, Suspense, memo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../utils/constants'
import styles from './AppRouter.module.css'

// ─── Lazy-loaded screens ──────────────────────────────────────────────────────
const LoginScreen          = lazy(() => import('../components/LoginScreen'))
const HomeScreen           = lazy(() => import('../components/HomeScreen'))
const GruposScreen         = lazy(() => import('../components/GruposScreen'))
const CriarGrupoScreen     = lazy(() => import('../components/CriarGrupoScreen'))
const GrupoScreen          = lazy(() => import('../components/GrupoScreen'))
const VamosComigoScreen    = lazy(() => import('../components/VamosComigoScreen'))
const CriarViagemScreen    = lazy(() => import('../components/CriarViagemScreen'))
const FavoritosScreen      = lazy(() => import('../components/FavoritosScreen'))
const PerfilScreen         = lazy(() => import('../components/PerfilScreen'))
const NotificationsScreen  = lazy(() => import('../components/NotificationsScreen'))

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
          <Route path={ROUTES.FAVORITOS}      element={<FavoritosScreen />} />
          <Route path={ROUTES.PERFIL}         element={<PerfilScreen />} />
          <Route path={ROUTES.NOTIFICATIONS}  element={<NotificationsScreen />} />
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </ScreenTransition>
    </Suspense>
  )
}
