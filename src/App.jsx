import { memo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HEADER_SCREENS, ROUTES } from './utils/constants'
import { useUser } from './context/UserContext'
import Header from './ui/Header'
import BottomNav from './ui/BottomNav'
import AppRouter from './router/AppRouter'
import styles from './App.module.css'

// ─── Auth guard ───────────────────────────────────────────────────────────────
function AuthGuard({ children }) {
  const { isLoggedIn } = useUser()
  const { pathname }   = useLocation()
  const navigate       = useNavigate()

  useEffect(() => {
    if (!isLoggedIn && pathname !== ROUTES.LOGIN) {
      navigate(ROUTES.LOGIN, { replace: true })
    }
    if (isLoggedIn && pathname === ROUTES.LOGIN) {
      navigate(ROUTES.HOME, { replace: true })
    }
  }, [isLoggedIn, pathname, navigate])

  return children
}

// ─── App shell ────────────────────────────────────────────────────────────────
const App = memo(function App() {
  const { pathname }   = useLocation()
  const { isLoggedIn } = useUser()
  const navigate       = useNavigate()

  const isLoginScreen = pathname === ROUTES.LOGIN
  const showHeader    = !isLoginScreen && HEADER_SCREENS.includes(pathname)
  const showNav       = !isLoginScreen && isLoggedIn

  return (
    <div className={styles.appWrap}>
      <div className={styles.phone}>
        {showHeader && (
          <Header onNotification={() => navigate(ROUTES.NOTIFICATIONS)} />
        )}
        <div className={styles.screenContent}>
          <AuthGuard>
            <AppRouter />
          </AuthGuard>
        </div>
        {showNav && <BottomNav />}
      </div>
    </div>
  )
})

export default App
