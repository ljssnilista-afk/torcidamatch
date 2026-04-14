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
                theme: 'stripe',
                variables: {
                  colorPrimary: '#22C55E',
                  borderRadius: '8px',
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

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modal: {
    position: 'relative',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  closeBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#aaa',
    zIndex: 1,
  },
  loading: {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '48px 24px',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #22C55E',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: '#aaa',
    fontSize: '14px',
    margin: 0,
  },
  errorContainer: {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '32px 24px',
    textAlign: 'center',
    color: '#fff',
  },
  errorIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(239,68,68,0.15)',
    color: '#EF4444',
    fontSize: '24px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  errorText: {
    color: '#EF4444',
    fontSize: '14px',
    margin: '0 0 16px',
  },
  retryBtn: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
}
