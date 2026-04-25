import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './ThemeContext'
import { UserProvider } from './UserContext'
import { FavoritesProvider } from './FavoritesContext'
import { LocationProvider } from './LocationContext'
import { ToastProvider } from './ToastContext'
import { NotificationsProvider } from './NotificationsContext'
import { GameProvider } from './GameContext'

/**
 * AppProviders — encapsula todos os Context Providers da aplicação.
 * Ordem: temas e autenticação primeiro; dados de jogo por último.
 */
export default function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <LocationProvider>
            <FavoritesProvider>
              <ToastProvider>
                <NotificationsProvider>
                  <GameProvider>
                    {children}
                  </GameProvider>
                </NotificationsProvider>
              </ToastProvider>
            </FavoritesProvider>
          </LocationProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
