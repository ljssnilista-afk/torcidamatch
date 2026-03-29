import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Filters from './Filters'
import GruposListaCard from './GruposLista'
import { drawThumb } from '../utils/canvasHelpers'
import { ROUTES } from '../utils/constants'
import { useGame } from '../context/GameContext'
import { useUser } from '../context/UserContext'
import { GRUPOS_FILTERS } from '../data/gruposData'
import styles from './GruposScreen.module.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix ícones Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const grupoIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#22C55E;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5)">👥</div>`,
  className: '', iconSize: [32,32], iconAnchor: [16,16],
})
const userIcon = new L.DivIcon({
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#3B82F6;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
  className: '', iconSize: [20,20], iconAnchor: [10,10],
})

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

// ─── Mapa real ────────────────────────────────────────────────────────────────
function MapaReal({ grupos, userLocation, onClose }) {
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [-22.9068, -43.1729]

  return (
    <div className={styles.mapaOverlay} onClick={onClose}>
      <div className={styles.mapaSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.mapaHeader}>
          <span className={styles.mapaTitle}>Grupos no mapa</span>
          <button className={styles.mapaClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.mapaWrap}>
          <MapContainer center={center} zoom={13} style={{ width:'100%', height:'100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>📍 Você está aqui</Popup>
              </Marker>
            )}
            {grupos.filter(g => g._coords).map(g => (
              <Marker key={g._id} position={g._coords} icon={grupoIcon}>
                <Popup><strong>{g.name}</strong><br/>{g.bairro} • {g.members?.length || 1} membros</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <p className={styles.mapaHint}>{grupos.length} grupo{grupos.length !== 1 ? 's' : ''} encontrado{grupos.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}

// ─── My Group Banner ──────────────────────────────────────────────────────────
function MyGroupBanner({ group, onAccess }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => drawThumb(canvasRef.current, {
        c0: '#0a180a', c1: '#050d05',
        crowd: ['255,255,255','0,0,0','34,197,94'],
        glow: 'rgba(34,197,94,0.25)', accent: 'rgba(34,197,94,0.5)',
      }))
    )
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={styles.myGroupBanner}>
      <div className={styles.mgLabel}>Meu grupo</div>
      <div className={styles.mgContent}>
        <div className={styles.mgThumb}>
          <canvas ref={canvasRef} width={56} height={56} className={styles.mgCanvas}/>
        </div>
        <div className={styles.mgInfo}>
          <p className={styles.mgName}>{group.name}</p>
          <p className={styles.mgMeta}>{group.location} • {group.members}/{group.maxMembers} membros</p>
          <p className={styles.mgNext}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/>
            </svg>
            Próxima caravana: {group.nextCaravana}
          </p>
        </div>
        <div className={styles.mgActions}>
          <button className={styles.btnManage}>Gerenciar</button>
          <button className={styles.btnSecondary} onClick={onAccess}>Ver grupo</button>
        </div>
      </div>
    </div>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function GruposScreen() {
  const navigate     = useNavigate()
  const { user }     = useUser()

  const [mapVisible,    setMapVisible]    = useState(false)
  const [activeFilter,  setActiveFilter]  = useState('todos')
  const [grupos,        setGrupos]        = useState([])
  const [meuGrupo,      setMeuGrupo]      = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [userLocation,  setUserLocation]  = useState(null)
  const [locationLabel, setLocationLabel] = useState('Obtendo localização...')

  // ── Localização real ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setLocationLabel('Localização indisponível'); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation({ lat, lng })
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
            { headers: { 'User-Agent': 'TorcidaMatch/1.0' } }
          )
          const data = await res.json()
          const bairro = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || ''
          const cidade = data.address?.city || 'Rio de Janeiro'
          setLocationLabel(bairro ? `${bairro} • ${cidade}` : cidade)
        } catch { setLocationLabel('Rio de Janeiro') }
      },
      () => setLocationLabel('Permissão negada — toque para permitir'),
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  const requestLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      () => window.location.reload(),
      () => alert('Para permitir localização:\nConfigurações > Privacidade > Localização > TorcidaMatch')
    )
  }

  // ── Carregar grupos ────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/grupos`, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          const todos = data.groups || []
          // "Meus grupos" = qualquer grupo que o usuário seja membro
          const meusGrupos = todos.filter(g =>
            g.leader?._id === user?.id || g.leader === user?.id ||
            g.members?.some(m => (m._id || m) === user?.id)
          )
          // Usa o primeiro como banner principal se for líder, senão qualquer
          const meu = meusGrupos[0] || null
          setMeuGrupo(meu || null)
          // "Grupos próximos" = todos os outros que o usuário NÃO participa
          const meusIds = new Set(meusGrupos.map(g => g._id))
          setGrupos(todos.filter(g => !meusIds.has(g._id)))
        }
      } catch (err) { console.warn(err) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  const toCardFormat = g => ({
    id: g._id, name: g.name,
    location: `${g.bairro} • ${g.zona}`,
    distance: '', distanceKm: 0,
    members: g.members?.length || 1, maxMembers: g.maxMembers || 100,
    rating: null, ratingCount: 0, mensalidade: null,
    badges: [{ type: g.privacy === 'private' ? 'silver' : 'green',
               label: g.privacy === 'private' ? '🔒 Privado' : '🌐 Público' }],
    actionLabel: 'Ver grupo', actionVariant: 'brand',
    thumbVariant: 'green', zone: g.zona?.toLowerCase().replace(' ','-') || 'todos',
    type: 'misto', _raw: g,
  })

  const filterGroups = gs => activeFilter === 'todos' ? gs : gs.filter(g => g.zone === activeFilter || g.type === activeFilter)
  const filtered     = filterGroups(grupos.map(toCardFormat))
  const totalCount   = filtered.length + (meuGrupo ? 1 : 0)

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.screenHeader}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Voltar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            {/* ✅ Fix 1 — título fixo correto */}
            <h1 className={styles.screenTitle}>Grupos de Torcedores</h1>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 3.5 3.5"/></svg></button>
            <button className={styles.iconBtn}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg></button>
          </div>
        </div>

        {/* ✅ Fix 2 — localização real + clique para permissão */}
        <button className={styles.locationBar} onClick={requestLocation}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className={styles.locationText}>
            {userLocation ? `📍 ${locationLabel}` : locationLabel}
          </span>
          <span className={styles.locationUpdate}>{userLocation ? 'Atualizar →' : 'Permitir →'}</span>
        </button>

        <div className={styles.searchBar}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 3.5 3.5"/></svg>
          <input type="text" placeholder="Buscar por nome ou bairro..." className={styles.searchInput}/>
        </div>

        <Filters filters={GRUPOS_FILTERS} onChange={setActiveFilter}/>
      </div>

      {/* Scroll */}
      <div className={styles.scrollArea}>

        <div className={styles.mapToggleRow}>
          <span className={styles.resultsCount}>{totalCount} grupos encontrados</span>
          {/* ✅ Fix 3 — abre mapa real Leaflet */}
          <button className={styles.mapToggleBtn} onClick={() => setMapVisible(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/>
              <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            Ver no mapa
          </button>
        </div>

        {/* ✅ Fix 4 — "Meus grupos" */}
        {meuGrupo && (
          <>
            <div className={styles.sectionDivider}>
              <span className={styles.dividerTitle}>Meus grupos</span>
              <div className={styles.dividerLine}/>
              <span className={styles.dividerCount}>1 grupo</span>
            </div>
            <MyGroupBanner
              group={{ id: meuGrupo._id, name: meuGrupo.name, location: meuGrupo.bairro,
                members: meuGrupo.members?.length || 1, maxMembers: meuGrupo.maxMembers || 100,
                rating: null, nextCaravana: 'Em breve' }}
              onAccess={() => navigate(`/grupos/${meuGrupo._id}`, { state: { grupo: meuGrupo } })}
            />
          </>
        )}

        {loading && (
          <div className={styles.loadingMore}>
            <span>Carregando grupos...</span>
            <div className={styles.loadingDots}>
              <div className={styles.dot}/><div className={styles.dot}/><div className={styles.dot}/>
            </div>
          </div>
        )}

        {/* ✅ Fix 5 — "Grupos próximos a você" */}
        {!loading && filtered.length > 0 && (
          <>
            <div className={styles.sectionDivider}>
              <span className={styles.dividerTitle}>Grupos próximos a você</span>
              <div className={styles.dividerLine}/>
              <span className={styles.dividerCount}>{filtered.length} grupos</span>
            </div>
            {filtered.map(g => (
              <GruposListaCard
                key={g.id} group={g}
                onClick={() => navigate(`/grupos/${g.id}`, { state: { grupo: g._raw } })}
              />
            ))}
          </>
        )}

        {!loading && filtered.length === 0 && !meuGrupo && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🏟️</span>
            <p className={styles.emptyTitle}>Nenhum grupo ainda</p>
            <p className={styles.emptySub}>Seja o primeiro a criar um grupo na sua região!</p>
          </div>
        )}

        <div className={styles.createCta} onClick={() => navigate(ROUTES.CRIAR_GRUPO)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <p className={styles.ctaTitle}>Não encontrou seu grupo?</p>
          <p className={styles.ctaSub}>Crie um grupo no seu bairro e conecte torcedores da sua região</p>
          <button className={styles.ctaBtn} onClick={e => { e.stopPropagation(); navigate(ROUTES.CRIAR_GRUPO) }}>
            Criar novo grupo
          </button>
        </div>
      </div>

      {/* Mapa real */}
      {mapVisible && (
        <MapaReal
          grupos={[...grupos, ...(meuGrupo ? [meuGrupo] : [])]}
          userLocation={userLocation}
          onClose={() => setMapVisible(false)}
        />
      )}
    </div>
  )
}
