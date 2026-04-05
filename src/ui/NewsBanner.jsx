import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import styles from './NewsBanner.module.css'

// Mapa de times para queries de busca RSS
const TEAM_QUERIES = {
  'Botafogo':     'Botafogo',
  'Flamengo':     'Flamengo',
  'Fluminense':   'Fluminense',
  'Vasco da Gama':'Vasco',
  'América-RJ':   'América Mineiro',
  'default':      'futebol carioca',
}

// RSS feeds via proxy público (sem CORS)
const RSS_FEEDS = [
  (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' futebol')}&hl=pt-BR&gl=BR&ceid=BR:pt-419`,
]

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

// Ícones por categoria da notícia
function NewsIcon({ type }) {
  if (type === 'transfer')
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
  if (type === 'match')
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
    </svg>
  )
}

function timeAgo(dateStr) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 3600)  return `${Math.floor(diff / 60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    return `${Math.floor(diff / 86400)}d atrás`
  } catch { return '' }
}

function detectType(title = '') {
  const t = title.toLowerCase()
  if (t.includes('contrat') || t.includes('transfer') || t.includes('reforço')) return 'transfer'
  if (t.includes('jogo') || t.includes('partida') || t.includes('derrota') || t.includes('vitória') || t.includes('gol')) return 'match'
  return 'news'
}

export default function NewsBanner() {
  const { user } = useUser()
  const [news,    setNews]    = useState([])
  const [idx,     setIdx]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  const team = user?.team || 'Botafogo'
  const query = TEAM_QUERIES[team] || team

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    async function fetchNews() {
      try {
        // Usa nosso backend como proxy para evitar CORS
        const res = await fetch(
          `${API_URL}/news?team=${encodeURIComponent(query)}`,
          { signal: AbortSignal.timeout(6000) }
        )
        if (!res.ok) throw new Error('Erro')
        const data = await res.json()
        if (!cancelled && data.items?.length > 0) {
          setNews(data.items.slice(0, 5))
        } else if (!cancelled) {
          setError(true)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchNews()
    return () => { cancelled = true }
  }, [query])

  // Rotaciona notícias a cada 5s
  useEffect(() => {
    if (news.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % news.length), 5000)
    return () => clearInterval(t)
  }, [news.length])

  const current = news[idx]

  if (loading) return (
    <div className={styles.skeleton}>
      <div className={styles.skIcon}/>
      <div className={styles.skText}>
        <div className={styles.skLine} style={{ width: '40%' }}/>
        <div className={styles.skLine} style={{ width: '85%' }}/>
      </div>
    </div>
  )

  if (error || !current) return (
    <div className={styles.fallback}>
      <div className={styles.fallbackIcon}>📰</div>
      <div>
        <p className={styles.fallbackTitle}>{team} • Notícias</p>
        <p className={styles.fallbackSub}>Sem notícias recentes</p>
      </div>
    </div>
  )

  return (
    <div className={styles.banner} key={idx}>
      <div className={styles.left}>
        <div className={styles.iconWrap}>
          <NewsIcon type={detectType(current.title)} />
        </div>
        <div className={styles.text}>
          <div className={styles.eyebrow}>
            <span className={styles.teamTag}>{team}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.time}>{timeAgo(current.pubDate)}</span>
          </div>
          <p className={styles.title}>{current.title}</p>
          <p className={styles.source}>{current.source}</p>
        </div>
      </div>
      <div className={styles.right}>
        {news.length > 1 && (
          <div className={styles.dots}>
            {news.map((_, i) => (
              <button
                key={i}
                className={`${styles.dotBtn} ${i === idx ? styles.dotBtnActive : ''}`}
                onClick={() => setIdx(i)}
                aria-label={`Notícia ${i + 1}`}
              />
            ))}
          </div>
        )}
        <div className={styles.arrow}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

