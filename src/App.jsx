import { memo, useEffect } from 'react' // Mantenha apenas esta linha de importação do React
import { useLocation, useNavigate } from 'react-router-dom'
import { HEADER_SCREENS, ROUTES } from './utils/constants'
import { useUser } from './context/UserContext'
import StatusBar from './components/StatusBar'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
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

  // 🧪 TESTE DE CONEXÃO (Adicionei este bloco aqui)
  useEffect(() => {
    const testApi = async () => {
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const res = await fetch(`${url.replace(/\/$/, '')}/api/status`);
        const data = await res.json();
        console.log("✅ API Status:", data);
      } catch (err) {
        console.error("❌ Erro ao conectar na API:", err.message);
      }
    };
    testApi();
  }, []);

  const isLoginScreen = pathname === ROUTES.LOGIN
  const showHeader    = !isLoginScreen && HEADER_SCREENS.includes(pathname)
  const showNav       = !isLoginScreen && isLoggedIn

  return (
    <div className={styles.appWrap}>
      <div className={styles.phone}>
        <StatusBar />
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