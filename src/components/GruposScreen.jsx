import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Filters from './Filters'
import GruposListaCard from './GruposLista'
import { drawThumb } from '../utils/canvasHelpers'
import { ROUTES } from '../utils/constants'
import { useGame } from '../context/GameContext'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { GRUPOS_FILTERS, GRUPOS_PROXIMOS, GRUPOS_OUTROS } from '../data/gruposData'
import styles from './GruposScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

// ─── Mapa real com Leaflet ────────────────────────────────────────────────────
function RealMap({ visible, lat, lng, grupos }) {
  const mapRef    = useRef(null)
  const leafletRef = useRef(null)

  useEffect(() => {
    if (!visible) return
    if (leafletRef.current) return // já inicializado

    // Carrega Leaflet dinamicamente
    import('leaflet').then(L => {
      // CSS do Leaflet
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link')
        link.id   = 'leaflet-css'
        link.rel  = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      const map = L.map(mapRef.current, {
        center: [lat || -22.9068, lng || -43.1729],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      })

      // Tile escuro (CartoDB Dark)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Marcador do usuário
      const userIcon = L.divIcon({
        html: `<div style="
          width:14px;height:14px;
          background:#22C55E;
          border-radius:50%;
          border:2px solid #fff;
          box-shadow:0 0 0 4px rgba(34,197,94,0.3)
        "></div>`,
        iconSize: [14,14],
        className: '',
      })
      L.marker([lat || -22.9068, lng || -43.1729], { icon: userIcon })
        .addTo(map)
        .bindPopup('Você está aqui')

      // Marcadores dos grupos
      grupos.forEach((g, i) => {
        const glat = (lat || -22.9068) + (Math.random() - 0.5) * 0.05
        const glng = (lng || -43.1729) + (Math.random() - 0.5) * 0.05
        const groupIcon = L.divIcon({
          html: `<div style="
            background:#22C55E;color:#000;
            font-size:8px;font-weight:800;
            padding:3px 6px;border-radius:5px;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.5)
          ">${g.name?.slice(0,8) || 'Grupo'}</div>`,
          className: '',
        })
        L.marker([glat, glng], { icon: groupIcon })
          .addTo(map)
          .bindPopup(g.name || 'Grupo')
      })

      leafletRef.current = map
    })

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
      }
    }
  }, [visible, lat, lng])

  if (!visible) return null
  return (
    <div className={styles.realMap}>
      <div ref={mapRef} className={styles.realMapCanvas}/>
    </div>
  )
}

// ─── Banner do meu grupo ──────────────────────────────────────────────────────
function MyGroupBanner({ group, onAccess }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        drawThumb(canvasRef.current, {
          c0: '#0a180a', c1: '#050d05',
          crowd: ['255,255,255','0,0,0','34,197,94'],
          glow: 'rgba(34,197,94,0.25)', accent: 'rgba(34,197,94,0.5)',
        })
      )
    )
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={styles.myGroupBanner}>
      <div className={styles.mgLabel}><span>Meu grupo</span></div>
      <div className={styles.mgContent}>
        <div className={styles.mgThumb}>
          <canvas ref={canvasRef} width={56} height={56} className={styles.mgCanvas}/>
        </div>
        <div className={styles.mgInfo}>
          <p className={styles.mgName}>{group.name}</p>
          <p className={styles.mgMeta}>
            {group.location} • {group.members}/{group.maxMembers} membros
          </p>
          <p className={styles.mgNext}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l5 3-5 3"/>
            </svg>
            Caravana: {group.nextCaravana}
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
  const navigate = useNavigate()
  const { user } = useUser()
  const toast    = useToast()

  const [mapVisible,   setMapVisible]   = useState(false)
  const [activeFilter, setActiveFilter] = useState('todos')
  const [grupos,       setGrupos]       = useState([])
  const [meuGrupo,     setMeuGrupo]     = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [userLat,      setUserLat]      = useState(null)
  const [userLng,      setUserLng]      = useState(null)
  const [locationLabel,setLocationLabel]= useState('Detectando localização...')
  const [search,       setSearch]       = useState('')

  // ── Geolocalização real ──────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationLabel('Localização indisponível')
      return
    }
    setLocationLabel('Detectando...')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLat(lat)
        setUserLng(lng)
        // Reverse geocoding via OpenStreetMap (gratuito)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
            { headers: { 'User-Agent': 'TorcidaMatch/1.0' } }
          )
          const data = await res.json()
          const bairro = data.address?.suburb
            || data.address?.neighbourhood
            || data.address?.quarter
            || data.address?.city_district
            || 'Sua localização'
          const cidade = data.address?.city || 'Rio de Janeiro'
          setLocationLabel(`${bairro} • ${cidade}`)
        } catch {
          setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        }
      },
      (err) => {
        if (err.code === 1) {
          setLocationLabel('Permissão negada')
          toast.error('Permita o acesso à localização nas configurações')
        } else {
          setLocationLabel('Localização indisponível')
        }
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [toast])

  // Auto-request ao montar
  useEffect(() => { requestLocation() }, [requestLocation])

  // Ao clicar abre configurações ou pede permissão novamente
  const handleLocationClick = () => {
    requestLocation()
    // Em mobile abre configurações se já negado
    if (window.__locationDenied) {
      window.open('app-settings:', '_blank')
    }
  }

  // ── Carregar grupos ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadGrupos() {
      try {
        const res = await fetch(`${API_URL}/grupos`, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          const todos = data.groups || []
          const meu = todos.find(g =>
            g.leader?._id === user?.id || g.leader === user?.id ||
            g.members?.some(m => (m._id || m) === user?.id)
          )
          setMeuGrupo(meu || null)
          setGrupos(todos.filter(g => g._id !== meu?._id))
        }
      } catch (err) {
        console.warn('[GruposScreen]', err.message)
      } finally {
        setLoading(false)
      }
    }
    loadGrupos()
  }, [user])

  // ── Formato para card ────────────────────────────────────────────────────
  const toCardFormat = (g) => ({
    id: g._id,
    name: g.name,
    location: `${g.bairro} • ${g.zona}`,
    distance: '',
    distanceKm: 0,
    members: g.members?.length || 1,
    maxMembers: g.maxMembers || 100,
    rating: null,
    ratingCount: 0,
    mensalidade: null,
    badges: [{ type: g.privacy === 'private' ? 'silver' : 'green', label: g.privacy === 'private' ? '🔒 Privado' : '🌐 Público' }],
    actionLabel: 'Ver grupo',
    actionVariant: 'brand',
    thumbVariant: 'green',
    zone: g.zona?.toLowerCase().replace(' ', '-') || 'todos',
    type: 'misto',
    _raw: g,
  })

  // Grupos mockados próximos (dados reais do banco no futuro)
  const gruposProximos = GRUPOS_PROXIMOS.filter(g => {
    if (activeFilter === 'todos') return true
    return g.zone === activeFilter || g.type === activeFilter
  })

  const gruposReaisFormatados = grupos.map(toCardFormat)
  const totalCount = gruposReaisFormatados.length + gruposProximos.length + (meuGrupo ? 1 : 0)

  // Filtro de busca
  const filteredReais   = gruposReaisFormatados.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.location.toLowerCase().includes(search.toLowerCase()))
  const filteredProximos = gruposProximos.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.location.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={styles.screen}>
      {/* ── Header ── */}
      <div className={styles.screenHeader}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Voltar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h1 className={styles.screenTitle}>
              Grupos · {user?.team ?? 'Botafogo'}
            </h1>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} aria-label="Filtros">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Localização real — clicável */}
        <button className={styles.locationBar} onClick={handleLocationClick} aria-label="Atualizar localização">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className={styles.locationText}>{locationLabel}</span>
          <span className={styles.locationUpdate}>Atualizar →</span>
        </button>

        {/* Busca */}
        <div className={styles.searchBar}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 3.5 3.5"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome ou bairro..."
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Buscar grupos"
          />
          {search && (
            <button onClick={() => setSearch('')} className={styles.searchClear}>✕</button>
          )}
        </div>

        <Filters filters={GRUPOS_FILTERS} onChange={id => setActiveFilter(id)}/>
      </div>

      {/* ── Scroll area ── */}
      <div className={styles.scrollArea}>

        {/* Contador + toggle mapa */}
        <div className={styles.mapToggleRow}>
          <span className={styles.resultsCount}>{totalCount} grupos encontrados</span>
          <button
            className={`${styles.mapToggleBtn} ${mapVisible ? styles.mapToggleBtnActive : ''}`}
            onClick={() => setMapVisible(v => !v)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            <span>{mapVisible ? 'Ocultar mapa' : 'Ver no mapa'}</span>
          </button>
        </div>

        {/* Mapa real com Leaflet */}
        <RealMap
          visible={mapVisible}
          lat={userLat}
          lng={userLng}
          grupos={[...filteredReais, ...filteredProximos]}
        />

        {/* ── Meus grupos ── */}
        {meuGrupo && (
          <>
            <div className={styles.sectionDivider}>
              <span className={styles.dividerTitle}>Meus grupos</span>
              <div className={styles.dividerLine}/>
              <span className={styles.dividerCount}>1 grupo</span>
            </div>
            <MyGroupBanner
              group={{
                id: meuGrupo._id,
                name: meuGrupo.name,
                location: meuGrupo.bairro,
                members: meuGrupo.members?.length || 1,
                maxMembers: meuGrupo.maxMembers || 100,
                rating: null,
                nextCaravana: 'Em breve',
              }}
              onAccess={() => navigate(`/grupos/${meuGrupo._id}`, { state: { grupo: meuGrupo } })}
            />
          </>
        )}

        {/* Grupos reais do banco que o usuário é membro */}
        {loading && (
          <div className={styles.loadingMore}>
            <span>Carregando grupos...</span>
            <div className={styles.loadingDots}>
              <div className={styles.dot}/><div className={styles.dot}/><div className={styles.dot}/>
            </div>
          </div>
        )}

        {!loading && filteredReais.length > 0 && (
          filteredReais.map(g => (
            <GruposListaCard
              key={g.id}
              group={g}
              onClick={() => navigate(`/grupos/${g.id}`, { state: { grupo: g._raw } })}
            />
          ))
        )}

        {/* ── Grupos próximos a você ── */}
        {filteredProximos.length > 0 && (
          <>
            <div className={styles.sectionDivider} style={{ marginTop: 8 }}>
              <span className={styles.dividerTitle}>Grupos próximos a você</span>
              <div className={styles.dividerLine}/>
              <span className={styles.dividerCount}>{filteredProximos.length} grupos</span>
            </div>
            {filteredProximos.map(g => (
              <GruposListaCard
                key={g.id}
                group={g}
                onClick={() => navigate(ROUTES.GRUPOS)}
              />
            ))}
          </>
        )}

        {/* Estado vazio */}
        {!loading && filteredReais.length === 0 && filteredProximos.length === 0 && !meuGrupo && (
          <div className={styles.loadingMore}>
            <span>Nenhum grupo encontrado. Crie o primeiro! 🏟️</span>
          </div>
        )}

        {/* CTA criar grupo */}
        <div className={styles.createCta} onClick={() => navigate(ROUTES.CRIAR_GRUPO)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <p className={styles.ctaTitle}>Não encontrou seu grupo?</p>
          <p className={styles.ctaSub}>Crie um grupo no seu bairro e conecte torcedores da sua região</p>
          <button className={styles.ctaBtn} onClick={e => { e.stopPropagation(); navigate(ROUTES.CRIAR_GRUPO) }}>
            Criar novo grupo
          </button>
        </div>

      </div>
    </div>
  )
}
