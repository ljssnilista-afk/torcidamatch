import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Filters from './Filters'
import GruposListaCard from './GruposLista'
import { drawMiniMap, drawThumb, THUMB_CONFIGS } from '../utils/canvasHelpers'
import { ROUTES } from '../utils/constants'
import { useGame } from '../context/GameContext'
import {
  GRUPOS_FILTERS,
  MY_GROUP,
  GRUPOS_PROXIMOS,
  GRUPOS_OUTROS,
} from '../data/gruposData'
import styles from './GruposScreen.module.css'

// Mini map component
function MiniMap({ visible }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (visible) {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => drawMiniMap(canvasRef.current))
      )
      return () => cancelAnimationFrame(raf)
    }
  }, [visible])
  if (!visible) return null
  return (
    <div className={styles.miniMap}>
      <canvas ref={canvasRef} width={362} height={120} className={styles.miniMapCanvas} />
    </div>
  )
}

// My group banner
function MyGroupBanner({ group }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        drawThumb(canvasRef.current, {
          c0: '#0a180a', c1: '#050d05',
          crowd: ['255,255,255', '0,0,0', '34,197,94'],
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
          <canvas ref={canvasRef} width={56} height={56} className={styles.mgCanvas} />
        </div>
        <div className={styles.mgInfo}>
          <p className={styles.mgName}>{group.name}</p>
          <p className={styles.mgMeta}>
            {group.location} • {group.members}/{group.maxMembers} membros • ⭐ {group.rating}
          </p>
          <p className={styles.mgNext}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8l5 3-5 3" />
            </svg>
            Caravana: {group.nextCaravana}
          </p>
        </div>
        <div className={styles.mgActions}>
          <button className={styles.btnManage}>Gerenciar</button>
          <button className={styles.btnSecondary}>Ver grupo</button>
        </div>
      </div>
    </div>
  )
}

export default function GruposScreen() {
  const navigate = useNavigate()
  const { banner } = useGame()
  const [mapVisible, setMapVisible] = useState(false)
  const [activeFilter, setActiveFilter] = useState('todos')

  const filterGroups = (groups) => {
    if (activeFilter === 'todos') return groups
    return groups.filter(
      (g) => g.zone === activeFilter || g.type === activeFilter
    )
  }

  const proxFiltered = filterGroups(GRUPOS_PROXIMOS)
  const outrosFiltered = filterGroups(GRUPOS_OUTROS)
  const totalCount = proxFiltered.length + outrosFiltered.length

  return (
    <div className={styles.screen}>
      {/* Screen header */}
      <div className={styles.screenHeader}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <button className={styles.backBtn} aria-label="Voltar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <h1 className={styles.screenTitle}>Grupos de {banner?.home ?? 'Botafogo'}</h1>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} aria-label="Buscar grupos">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 3.5 3.5" />
              </svg>
            </button>
            <button className={styles.iconBtn} aria-label="Filtros avançados">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Location bar */}
        <div className={styles.locationBar}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span className={styles.locationText}>Você está em Copacabana • Zona Sul</span>
          <span className={styles.locationUpdate}>Atualizar →</span>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 3.5 3.5" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome ou bairro..."
            className={styles.searchInput}
            aria-label="Buscar grupos"
          />
        </div>

        <Filters
          filters={GRUPOS_FILTERS}
          onChange={(id) => setActiveFilter(id)}
        />
      </div>

      {/* Scroll area */}
      <div className={styles.scrollArea}>

        {/* Map toggle row */}
        <div className={styles.mapToggleRow}>
          <span className={styles.resultsCount}>{totalCount} grupos encontrados</span>
          <button
            className={styles.mapToggleBtn}
            onClick={() => setMapVisible((v) => !v)}
            aria-label={mapVisible ? 'Ocultar mapa' : 'Ver grupos no mapa'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>{mapVisible ? 'Ocultar mapa' : 'Ver no mapa'}</span>
          </button>
        </div>

        {/* Mini map */}
        <MiniMap visible={mapVisible} />

        {/* My group */}
        <MyGroupBanner group={MY_GROUP} />

        {/* Section: nearby */}
        {proxFiltered.length > 0 && (
          <>
            <div className={styles.sectionDivider}>
              <span className={styles.dividerTitle}>Perto de você</span>
              <div className={styles.dividerLine} />
              <span className={styles.dividerCount}>{proxFiltered.length} grupos</span>
            </div>
            {proxFiltered.map((g) => (
              <GruposListaCard
                key={g.id}
                group={g}
                onClick={() => navigate(ROUTES.GRUPOS)}
              />
            ))}
          </>
        )}

        {/* Section: others */}
        {outrosFiltered.length > 0 && (
          <>
            <div className={styles.sectionDivider} style={{ marginTop: 6 }}>
              <span className={styles.dividerTitle}>Outros grupos</span>
              <div className={styles.dividerLine} />
              <span className={styles.dividerCount}>{outrosFiltered.length} grupos</span>
            </div>
            {outrosFiltered.map((g) => (
              <GruposListaCard
                key={g.id}
                group={g}
                onClick={() => navigate(ROUTES.GRUPOS)}
              />
            ))}
          </>
        )}

        {/* Loading indicator */}
        <div className={styles.loadingMore} aria-label="Carregando mais grupos">
          <span>Carregando mais grupos...</span>
          <div className={styles.loadingDots}>
            <div className={styles.dot} />
            <div className={styles.dot} />
            <div className={styles.dot} />
          </div>
        </div>

        {/* Create group CTA */}
        <div className={styles.createCta} role="button" tabIndex={0} aria-label="Criar novo grupo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <p className={styles.ctaTitle}>Não encontrou seu grupo?</p>
          <p className={styles.ctaSub}>
            Crie um grupo alvinegro no seu bairro e conecte torcedores da sua região
          </p>
          <button className={styles.ctaBtn}>Criar novo grupo</button>
        </div>

      </div>
    </div>
  )
}
