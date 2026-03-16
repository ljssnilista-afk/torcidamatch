import { createContext, useContext, useState, useCallback } from 'react'
import { FAVORITE_GROUPS, FAVORITE_RIDES } from '../data/favoritosData'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  // Store sets of IDs for O(1) lookup
  const [favGroupIds, setFavGroupIds]   = useState(() => new Set(FAVORITE_GROUPS.map((g) => g.id)))
  const [favRideIds,  setFavRideIds]    = useState(() => new Set(FAVORITE_RIDES.map((r) => r.id)))

  // Full objects (so screens can render without extra data fetching)
  const [favGroups, setFavGroups] = useState(FAVORITE_GROUPS)
  const [favRides,  setFavRides]  = useState(FAVORITE_RIDES)

  // ── Groups ──────────────────────────────────────────────────────────────────
  const isGroupFav = useCallback((id) => favGroupIds.has(id), [favGroupIds])

  const addGroup = useCallback((group) => {
    setFavGroupIds((prev) => new Set([...prev, group.id]))
    setFavGroups((prev) => prev.some((g) => g.id === group.id) ? prev : [...prev, group])
  }, [])

  const removeGroup = useCallback((id) => {
    setFavGroupIds((prev) => { const s = new Set(prev); s.delete(id); return s })
    setFavGroups((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const toggleGroup = useCallback((group) => {
    if (favGroupIds.has(group.id)) removeGroup(group.id)
    else addGroup(group)
  }, [favGroupIds, addGroup, removeGroup])

  // ── Rides ───────────────────────────────────────────────────────────────────
  const isRideFav = useCallback((id) => favRideIds.has(id), [favRideIds])

  const addRide = useCallback((ride) => {
    setFavRideIds((prev) => new Set([...prev, ride.id]))
    setFavRides((prev) => prev.some((r) => r.id === ride.id) ? prev : [...prev, ride])
  }, [])

  const removeRide = useCallback((id) => {
    setFavRideIds((prev) => { const s = new Set(prev); s.delete(id); return s })
    setFavRides((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const toggleRide = useCallback((ride) => {
    if (favRideIds.has(ride.id)) removeRide(ride.id)
    else addRide(ride)
  }, [favRideIds, addRide, removeRide])

  const totalCount = favGroups.length + favRides.length

  return (
    <FavoritesContext.Provider value={{
      // State
      favGroups,
      favRides,
      totalCount,
      // Group actions
      isGroupFav,
      addGroup,
      removeGroup,
      toggleGroup,
      // Ride actions
      isRideFav,
      addRide,
      removeRide,
      toggleRide,
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

/** Hook to consume favorites context */
export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>')
  return ctx
}
