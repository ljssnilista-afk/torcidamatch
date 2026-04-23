import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { UserProvider } from '@shared/contexts/UserContext'
import { FavoritesProvider } from '@shared/contexts/FavoritesContext'
import { LocationProvider } from '@shared/contexts/LocationContext'
import { ToastProvider } from '@shared/contexts/ToastContext'
import { NotificationsProvider } from '@shared/contexts/NotificationsContext'
import { GameProvider } from '@shared/contexts/GameContext'
import '@shared/styles/main.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <LocationProvider>
            <FavoritesProvider>
              <ToastProvider>
                <NotificationsProvider>
                  <GameProvider>
                    <App />
                  </GameProvider>
                </NotificationsProvider>
              </ToastProvider>
            </FavoritesProvider>
          </LocationProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
