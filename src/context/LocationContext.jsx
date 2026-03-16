import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LocationContext = createContext(null)

// Default: Copacabana, Rio de Janeiro
const DEFAULT_LOCATION = {
  lat:     -22.9711,
  lng:     -43.1823,
  label:   'Copacabana',
  zone:    'Zona Sul',
  city:    'Rio de Janeiro',
  denied:  false,
  loading: false,
}

/**
 * Rough distance in km between two lat/lng points (Haversine).
 * Accurate enough for city-level proximity sorting.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R  = 6371
  const dL = ((lat2 - lat1) * Math.PI) / 180
  const dG = ((lng2 - lng1) * Math.PI) / 180
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dG / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return

    setLocation((prev) => ({ ...prev, loading: true }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat:     pos.coords.latitude,
          lng:     pos.coords.longitude,
          label:   'Localização atual',
          zone:    '',
          city:    'Rio de Janeiro',
          denied:  false,
          loading: false,
        })
      },
      () => {
        // Permission denied or unavailable — keep default, flag denied
        setLocation((prev) => ({ ...prev, denied: true, loading: false }))
      },
      { timeout: 8000, maximumAge: 60_000 }
    )
  }, [])

  // Auto-request on mount (silent — won't throw if denied)
  useEffect(() => { requestLocation() }, [requestLocation])

  /** Returns km distance from current location to a given lat/lng */
  const distanceTo = useCallback(
    (lat, lng) => haversineKm(location.lat, location.lng, lat, lng),
    [location.lat, location.lng]
  )

  return (
    <LocationContext.Provider value={{ location, requestLocation, distanceTo }}>
      {children}
    </LocationContext.Provider>
  )
}

/** Hook to consume location context */
export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used inside <LocationProvider>')
  return ctx
}
