import { API_URL } from '@shared/services/api'
import styles from '../PerfilScreen.module.css'

export default function ConnectSection({ connectStatus, connectLoading, setConnectLoading, user, toast }) {
  const handleConnectOnboard = async () => {
    setConnectLoading(true)
    try {
      const res  = await fetch(`${API_URL}/connect/onboard`, { method: 'POST', headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (res.ok) window.open(data.url, '_blank')
      else toast.error(data.error || 'Erro ao iniciar cadastro')
    } catch { toast.error('Erro de conexão') }
    finally { setConnectLoading(false) }
  }

  const handleConnectDashboard = async () => {
    setConnectLoading(true)
    try {
      const res  = await fetch(`${API_URL}/connect/dashboard`, { method: 'POST', headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (res.ok) window.open(data.url, '_blank')
      else toast.error(data.error || 'Erro ao abrir painel')
    } catch { toast.error('Erro de conexão') }
    finally { setConnectLoading(false) }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>🏦 Conta financeira</span>
      </div>
      <div className={styles.connectCard}>
        {connectStatus === 'active' ? (
          <>
            <div className={styles.connectActive}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Conta verificada · Recebimentos habilitados</span>
            </div>
            <p className={styles.connectText}>
              Você recebe 80% do valor de cada reserva diretamente na sua conta bancária. A TorcidaMatch retém 20% como taxa de plataforma.
            </p>
            <button className={styles.connectBtn} onClick={handleConnectDashboard} disabled={connectLoading}>
              {connectLoading ? 'Abrindo...' : 'Ver painel financeiro →'}
            </button>
          </>
        ) : connectStatus === 'pending' ? (
          <>
            <div className={styles.connectPending}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Cadastro em andamento</span>
            </div>
            <p className={styles.connectText}>Conclua o cadastro no Stripe para habilitar o recebimento de pagamentos.</p>
            <button className={styles.connectBtn} onClick={handleConnectOnboard} disabled={connectLoading}>
              {connectLoading ? 'Aguarde...' : 'Continuar cadastro →'}
            </button>
          </>
        ) : (
          <>
            <p className={styles.connectText}>
              Ofereça viagens e receba os pagamentos diretamente na sua conta bancária. O cadastro é rápido e seguro, feito em parceria com a Stripe.
            </p>
            <button className={styles.connectBtn} onClick={handleConnectOnboard} disabled={connectLoading}>
              {connectLoading ? 'Aguarde...' : '🚀 Habilitar recebimentos'}
            </button>
          </>
        )}
        <div className={styles.walletSacRow}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>Dúvidas sobre recebimentos?</span>
          <a href="mailto:suporte@torcidamatch.com.br?subject=Duvida%20conta%20financeira" className={styles.sacLink}>
            Falar com SAC
          </a>
        </div>
      </div>
    </div>
  )
}
