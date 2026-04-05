import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const FavoritesContext = createContext(null)
const STORAGE_KEY = 'tm-favorites'

function loadStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { groups: [], rides: [] }
}

function saveToStorage(groups, rides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, rides }))
  } catch {}
}

export function FavoritesProvider({ children }) {
  const [favGroups, setFavGroups] = useState(() => loadStored().groups)
  const [favRides, setFavRides] = useState(() => loadStored().rides)

  // Persist whenever favorites change
  useEffect(() => {
    saveToStorage(favGroups, favRides)
  }, [favGroups, favRides])

  // ── Groups ──────────────────────────────────────────────────────────────────
  const isGroupFav = useCallback((id) => favGroups.some(g => g.id === id || g._id === id), [favGroups])

  const addGroup = useCallback((group) => {
    const gId = group.id || group._id
    setFavGroups(prev => {
      if (prev.some(g => (g.id || g._id) === gId)) return prev
      return [...prev, { id: gId, _id: gId, name: group.name, team: group.team, bairro: group.bairro || group.region, photo: group.photo, code: group.code }]
    })
  }, [])

  const removeGroup = useCallback((id) => {
    setFavGroups(prev => prev.filter(g => g.id !== id && g._id !== id))
  }, [])

  const toggleGroup = useCallback((group) => {
    const gId = group.id || group._id
    if (favGroups.some(g => (g.id || g._id) === gId)) removeGroup(gId)
    else addGroup(group)
  }, [favGroups, addGroup, removeGroup])

  // ── Rides ───────────────────────────────────────────────────────────────────
  const isRideFav = useCallback((id) => favRides.some(r => r.id === id || r._id === id), [favRides])

  const addRide = useCallback((ride) => {
    const rId = ride.id || ride._id
    setFavRides(prev => {
      if (prev.some(r => (r.id || r._id) === rId)) return prev
      return [...prev, {
        id: rId, _id: rId,
        homeTeam: ride.game?.homeTeam || ride.homeTeam,
        awayTeam: ride.game?.awayTeam || ride.awayTeam,
        driverName: ride.driverName,
        price: ride.price,
        shareCode: ride.shareCode,
        vehicle: ride.vehicle,
      }]
    })
  }, [])

  const removeRide = useCallback((id) => {
    setFavRides(prev => prev.filter(r => r.id !== id && r._id !== id))
  }, [])

  const toggleRide = useCallback((ride) => {
    const rId = ride.id || ride._id
    if (favRides.some(r => (r.id || r._id) === rId)) removeRide(rId)
    else addRide(ride)
  }, [favRides, addRide, removeRide])

  const totalCount = favGroups.length + favRides.length

  return (
    <FavoritesContext.Provider value={{
      favGroups, favRides, totalCount,
      isGroupFav, addGroup, removeGroup, toggleGroup,
      isRideFav, addRide, removeRide, toggleRide,
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>')
  return ctx
}
