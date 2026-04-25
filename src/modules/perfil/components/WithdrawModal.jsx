import { useState } from 'react'
import { API_URL } from '@shared/services/api'
import styles from '../PerfilScreen.module.css'

export default function WithdrawModal({ wallet, setWallet, onClose, user, toast }) {
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  const handleWithdraw = async () => {
    const cents = Math.round(parseFloat(withdrawAmount.replace(',', '.')) * 100)
    if (!cents || cents < 5000) return toast.error('Mínimo R$ 50,00')
    setWithdrawing(true)
    try {
      const res  = await fetch(`${API_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ amount: cents }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setWallet(w => ({ ...w, balance: data.newBalance, balanceFormatted: data.newBalanceFormatted }))
        onClose()
      } else toast.error(data.error || 'Erro ao sacar')
    } catch { toast.error('Erro de conexão') }
    finally { setWithdrawing(false) }
  }

  const cents       = Math.round(parseFloat((withdrawAmount || '0').replace(',', '.')) * 100)
  const isValid     = cents >= 5000 && cents <= (wallet?.balance || 0)
  const fmtValue    = cents > 0 ? `R$ ${(cents / 100).toFixed(2).replace('.', ',')}` : '—'
  const destination = wallet?.pixKeyType ? `Chave PIX (${wallet.pixKeyType})` : 'Conta Stripe Connect'

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle}/>
        <div className={styles.sheetHeader}>
          <button className={styles.sheetCancelBtn} onClick={onClose}>Cancelar</button>
          <span className={styles.sheetTitle}>💸 Sacar saldo</span>
          <div style={{ width: 60 }}/>
        </div>

        <div className={styles.sheetBody}>
          <div className={styles.withdrawSaldoBox}>
            <span className={styles.withdrawSaldoLabel}>Saldo disponível</span>
            <span className={styles.withdrawSaldoBig}>{wallet?.balanceFormatted || 'R$ 0,00'}</span>
          </div>

          <div className={styles.editField}>
            <label className={styles.editLabel}>Quanto quer sacar?</label>
            <div className={styles.withdrawAmountRow}>
              <span className={styles.withdrawAmountPrefix}>R$</span>
              <input
                type="number" min="50" step="0.01"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="50,00"
                className={styles.withdrawAmountInput}
              />
              <button className={styles.withdrawMaxBtn} onClick={() => setWithdrawAmount(((wallet?.balance || 0) / 100).toFixed(2))}>
                Tudo
              </button>
            </div>
          </div>

          {cents > 0 && (
            <div className={styles.withdrawSummary}>
              <div className={styles.withdrawSummaryRow}><span>Valor solicitado</span><span>{fmtValue}</span></div>
              <div className={styles.withdrawSummaryRow}><span>Destino</span><span>{destination}</span></div>
              <div className={styles.withdrawSummaryRow}><span>Prazo</span><span>Até 1 dia útil</span></div>
              <div className={`${styles.withdrawSummaryRow} ${styles.withdrawSummaryTotal}`}>
                <span>Você recebe</span><strong>{fmtValue}</strong>
              </div>
            </div>
          )}

          <div className={styles.withdrawInfoBox}>
            <div className={styles.withdrawInfoItem}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Mínimo <strong>R$ 50,00</strong> por saque</span>
            </div>
            <div className={styles.withdrawInfoItem}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              <span>Crédito em até <strong>1 dia útil</strong> no seu PIX</span>
            </div>
            <div className={styles.withdrawInfoItem}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Limite de <strong>3 saques por dia</strong></span>
            </div>
          </div>

          <button
            className={`${styles.withdrawConfirmBtn} ${!isValid || withdrawing ? styles.withdrawConfirmBtnDisabled : ''}`}
            onClick={handleWithdraw}
            disabled={!isValid || withdrawing}
          >
            {withdrawing ? 'Processando...'
              : isValid ? `Confirmar saque de ${fmtValue}`
              : cents > (wallet?.balance || 0) ? 'Valor maior que o saldo'
              : cents > 0 && cents < 5000 ? 'Mínimo R$ 50,00'
              : 'Digite o valor'}
          </button>

          <div className={styles.walletSacRow} style={{ borderTop: 'none', paddingTop: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>Dúvidas?</span>
            <a href="mailto:suporte@torcidamatch.com.br?subject=Problema%20com%20saque" className={styles.sacLink} onClick={onClose}>
              Falar com SAC
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
