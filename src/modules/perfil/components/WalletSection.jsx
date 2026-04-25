import { useState } from 'react'
import { API_URL } from '@shared/services/api'
import styles from '../PerfilScreen.module.css'

export default function WalletSection({ wallet, setWallet, onWithdraw, user, toast }) {
  const [pixKey, setPixKey] = useState('')
  const [pixKeyType, setPixKeyType] = useState('cpf')

  const handleSavePix = async () => {
    if (!pixKey.trim()) return toast.error('Informe a chave PIX')
    try {
      const res = await fetch(`${API_URL}/wallet/pix-key`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ pixKey: pixKey.trim(), pixKeyType }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Chave PIX salva!'); setWallet(w => ({ ...w, hasPixKey: true, pixKeyType })) }
      else toast.error(data.error || 'Erro ao salvar PIX')
    } catch { toast.error('Erro de conexão') }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>💰 Carteira</span>
      </div>
      <div className={styles.walletCard}>
        <div className={styles.walletTopRow}>
          <div className={styles.walletBalance}>
            <span className={styles.walletBalanceLabel}>Saldo disponível</span>
            <span className={styles.walletBalanceValue}>{wallet?.balanceFormatted || 'R$ 0,00'}</span>
          </div>
          <button
            className={`${styles.withdrawPrimaryBtn} ${!wallet?.canWithdraw ? styles.withdrawPrimaryBtnDisabled : ''}`}
            onClick={() => wallet?.canWithdraw && onWithdraw()}
            disabled={!wallet?.canWithdraw}
            title={!wallet?.canWithdraw ? 'Mínimo R$ 50,00 para sacar' : 'Sacar saldo'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
            Sacar
          </button>
        </div>

        {!wallet?.canWithdraw && wallet !== null && (() => {
          const balance = wallet?.balance || 0
          const minimum = 5000
          const pct     = Math.min(100, Math.round((balance / minimum) * 100))
          const faltam  = minimum - balance
          return (
            <div className={styles.walletProgressBox}>
              <div className={styles.walletProgressHeader}>
                <span>Progresso para saque</span>
                <span className={styles.walletProgressPct}>{pct}%</span>
              </div>
              <div className={styles.walletProgressTrack}>
                <div className={styles.walletProgressFill} style={{ width: `${pct}%` }} />
              </div>
              <p className={styles.walletProgressHint}>
                Faltam <strong>R$ {(faltam / 100).toFixed(2).replace('.', ',')}</strong> para atingir o mínimo de R$ 50,00
              </p>
            </div>
          )
        })()}

        <div className={styles.walletInfoRow}>
          <span className={styles.walletInfoPill}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
            Mínimo R$ 50,00
          </span>
          <span className={styles.walletInfoPill}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            Aprovado em até 24h
          </span>
          <span className={styles.walletInfoPill}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Via Stripe · Seguro
          </span>
        </div>

        {!wallet?.hasPixKey ? (
          <div className={styles.pixSetup}>
            <p className={styles.pixSetupLabel}>Cadastre sua chave PIX para sacar</p>
            <div className={styles.pixRow}>
              <select value={pixKeyType} onChange={e => setPixKeyType(e.target.value)} className={styles.pixSelect}>
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="random">Aleatória</option>
              </select>
              <input type="text" value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="Sua chave PIX" className={styles.pixInput} />
              <button className={styles.pixSaveBtn} onClick={handleSavePix}>Salvar</button>
            </div>
          </div>
        ) : (
          <div className={styles.pixConfirmed}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Chave PIX cadastrada ({wallet.pixKeyType})</span>
            <button className={styles.pixChangeBtn} onClick={() => setWallet(w => ({ ...w, hasPixKey: false }))}>Alterar</button>
          </div>
        )}

        <div className={styles.walletSacRow}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>Problema com saque?</span>
          <a href="mailto:suporte@torcidamatch.com.br?subject=Problema%20com%20saque" className={styles.sacLink}>
            Falar com SAC
          </a>
        </div>
      </div>
    </div>
  )
}
