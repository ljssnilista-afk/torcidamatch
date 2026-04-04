import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider } from './context/UserContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { LocationProvider } from './context/LocationContext'
import { ToastProvider } from './context/ToastContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { GameProvider } from './context/GameContext'
import './assets/styles/main.css'
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
