import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import CheckoutForm from './CheckoutForm'
import { useUser } from '../context/UserContext'
import {
  getStripeConfig,
  createGroupPaymentIntent,
  createRidePaymentIntent,
} from '../services/paymentApi'

// ═══════════════════════════════════════════════════════════════════════════════
// PaymentModal — Modal de pagamento com Stripe Elements
//
// Props:
//   type        - 'group' | 'ride'
//   targetId    - ID do grupo ou viagem
//   description - texto descritivo
//   onSuccess   - callback após sucesso
//   onClose     - callback para fechar
//   visible     - controlar visibilidade
//
// Fluxo:
// 1. Busca chave publicavel do backend (/api/payments/config)
// 2. Cria PaymentIntent no backend (retorna client_secret)
// 3. Renderiza <Elements> com client_secret
// 4. Exibe <CheckoutForm> com PaymentElement do Stripe
// ═══════════════════════════════════════════════════════════════════════════════

let stripePromise = null

function getStripePromise(publishableKey) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

export default function PaymentModal({
  type,
  targetId,
  description,
  onSuccess,
  onClose,
  visible,
}) {
  const { user } = useUser()
  const [clientSecret, setClientSecret] = useState(null)
  const [amount, setAmount] = useState(0)
  const [publishableKey, setPublishableKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!visible || !targetId || !user?.token) return

    let cancelled = false

    async function init() {
      setLoading(true)
      setError(null)

      try {
        // 1. Buscar chave publicavel
        const config = await getStripeConfig()
        if (cancelled) return
        setPublishableKey(config.publishableKey)

        // 2. Criar PaymentIntent no backend
        let result
        if (type === 'group') {
          result = await createGroupPaymentIntent(user.token, targetId)
        } else if (type === 'ride') {
          result = await createRidePaymentIntent(user.token, targetId)
        } else {
          throw new Error('Tipo de pagamento invalido')
        }

        if (cancelled) return
        setClientSecret(result.clientSecret)
        setAmount(result.amount)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Erro ao iniciar pagamento')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [visible, targetId, type, user?.token])

  if (!visible) return null

  const handleSuccess = (paymentIntent) => {
    if (onSuccess) onSuccess(paymentIntent)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Botao fechar */}
        <button style={styles.closeBtn} onClick={onClose} aria-label="Fechar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Estado: carregando */}
        {loading && (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Preparando pagamento...</p>
          </div>
        )}

        {/* Estado: erro */}
        {error && !loading && (
          <div style={styles.errorContainer}>
            <p style={styles.errorIcon}>!</p>
            <p style={styles.errorText}>{error}</p>
            <button style={styles.retryBtn} onClick={onClose}>
              Fechar
            </button>
          </div>
        )}

        {/* Estado: pronto — renderizar Stripe Elements */}
        {!loading && !error && clientSecret && publishableKey && (
          <Elements
            stripe={getStripePromise(publishableKey)}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#22C55E',
                  colorBackground: '#161616',
                  colorText: '#f5f5f5',
                  colorTextSecondary: '#a3a3a3',
                  colorDanger: '#EF4444',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  borderRadius: '12px',
                  spacingUnit: '4px',
                  colorIconTabSelected: '#22C55E',
                },
                rules: {
                  '.Input': {
                    backgroundColor: '#1e1e1e',
                    border: '1.5px solid #2a2a2a',
                    color: '#f5f5f5',
                  },
                  '.Input:focus': {
                    border: '1.5px solid #22C55E',
                    boxShadow: '0 0 0 1px rgba(34,197,94,0.25)',
                  },
                  '.Label': {
                    color: '#a3a3a3',
                  },
                  '.Tab': {
                    backgroundColor: '#1e1e1e',
                    border: '1.5px solid #2a2a2a',
                    color: '#a3a3a3',
                  },
                  '.Tab--selected': {
                    backgroundColor: '#0d1f10',
                    border: '1.5px solid #22C55E',
                    color: '#22C55E',
                  },
                },
              },
              locale: 'pt-BR',
            }}
          >
            <CheckoutForm
              amount={amount}
              description={description}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  )
}

// ─── Estilos — Design System TorcidaMatch (dark) ────────────────────────────
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    position: 'relative',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    background: '#0d0d0d',
    borderRadius: '16px',
    border: '1px solid #2a2a2a',
    padding: '24px',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#1e1e1e',
    border: '1px solid #2a2a2a',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#a3a3a3',
    zIndex: 1,
  },
  loading: {
    background: '#161616',
    borderRadius: '12px',
    padding: '48px 24px',
    textAlign: 'center',
    border: '1px solid #2a2a2a',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #2a2a2a',
    borderTop: '3px solid #22C55E',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: '#a3a3a3',
    fontSize: '14px',
    margin: 0,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  errorContainer: {
    background: '#161616',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center',
    color: '#f5f5f5',
    border: '1px solid #2a2a2a',
  },
  errorIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(239,68,68,0.12)',
    color: '#EF4444',
    fontSize: '24px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: '14px',
    margin: '0 0 16px',
  },
  retryBtn: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: '1.5px solid #2a2a2a',
    background: '#1e1e1e',
    color: '#f5f5f5',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
}
