import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

// ═══════════════════════════════════════════════════════════════════════════════
// CheckoutForm — Formulário de pagamento com Stripe Elements
//
// Props:
//   amount      - valor em centavos (para exibir)
//   description - texto descritivo do pagamento
//   onSuccess   - callback chamado após pagamento confirmado
//   onCancel    - callback para fechar o formulário
//
// SEGURANCA:
// - Usa <PaymentElement> do Stripe (iframe isolado — PCI Compliant)
// - NUNCA toca dados de cartão — tudo no iframe do Stripe
// - NUNCA loga ou armazena dados de cartão no state/localStorage
// ═══════════════════════════════════════════════════════════════════════════════
export default function CheckoutForm({ amount, description, onSuccess, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()

  const [status, setStatus] = useState('idle') // idle | loading | succeeded | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js ainda não carregou
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Redirecionar para página de sucesso (opcional)
          return_url: `${window.location.origin}/payment-success`,
        },
        // Não redirecionar — tratar inline
        redirect: 'if_required',
      })

      if (error) {
        // Erros do Stripe (cartão recusado, dados inválidos, etc.)
        setStatus('error')
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMsg(error.message || 'Erro no pagamento. Verifique os dados do cartão.')
        } else {
          setErrorMsg('Erro inesperado ao processar pagamento. Tente novamente.')
        }
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setStatus('succeeded')
        // O webhook no backend vai processar a confirmação de forma confiável.
        // O callback aqui é apenas para atualizar a UI imediatamente.
        if (onSuccess) {
          onSuccess(paymentIntent)
        }
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // 3D Secure ou autenticação adicional — o Stripe lida automaticamente
        setStatus('idle')
      } else {
        setStatus('error')
        setErrorMsg('Pagamento em processamento. Você será notificado quando for confirmado.')
      }
    } catch (err) {
      // Erro de rede ou outro erro inesperado
      setStatus('error')
      setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.')
    }
  }

  if (status === 'succeeded') {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>✓</div>
        <h3 style={styles.successTitle}>Pagamento confirmado!</h3>
        <p style={styles.successText}>{description}</p>
        <p style={styles.successAmount}>
          R$ {(amount / 100).toFixed(2).replace('.', ',')}
        </p>
        <button style={styles.successBtn} onClick={onCancel}>
          Continuar
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.header}>
        <h3 style={styles.title}>Pagamento</h3>
        <p style={styles.description}>{description}</p>
        <p style={styles.amount}>
          R$ {(amount / 100).toFixed(2).replace('.', ',')}
        </p>
      </div>

      {/* PaymentElement — iframe isolado do Stripe (PCI Compliant) */}
      <div style={styles.elementWrapper}>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Mensagem de erro */}
      {errorMsg && (
        <div style={styles.errorBox} role="alert">
          {errorMsg}
        </div>
      )}

      {/* Botoes */}
      <div style={styles.actions}>
        <button
          type="button"
          style={styles.cancelBtn}
          onClick={onCancel}
          disabled={status === 'loading'}
        >
          Cancelar
        </button>
        <button
          type="submit"
          style={{
            ...styles.payBtn,
            opacity: (!stripe || status === 'loading') ? 0.6 : 1,
          }}
          disabled={!stripe || status === 'loading'}
        >
          {status === 'loading' ? 'Processando...' : `Pagar R$ ${(amount / 100).toFixed(2).replace('.', ',')}`}
        </button>
      </div>

      <p style={styles.secureNote}>
        Pagamento seguro processado pelo Stripe. Seus dados de cartao nunca tocam nosso servidor.
      </p>
    </form>
  )
}

// ─── Estilos inline (para funcionar sem CSS modules) ─────────────────────────
const styles = {
  form: {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '480px',
    margin: '0 auto',
    color: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 4px',
    color: '#fff',
  },
  description: {
    fontSize: '14px',
    color: '#aaa',
    margin: '0 0 8px',
  },
  amount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#22C55E',
    margin: '0',
  },
  elementWrapper: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    color: '#EF4444',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: '#aaa',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  payBtn: {
    flex: 2,
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: '#22C55E',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  secureNote: {
    fontSize: '11px',
    color: '#666',
    textAlign: 'center',
    marginTop: '12px',
    lineHeight: '1.4',
  },
  successContainer: {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '32px 24px',
    maxWidth: '480px',
    margin: '0 auto',
    color: '#fff',
    textAlign: 'center',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#22C55E',
    fontSize: '32px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 8px',
  },
  successText: {
    fontSize: '14px',
    color: '#aaa',
    margin: '0 0 4px',
  },
  successAmount: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#22C55E',
    margin: '0 0 20px',
  },
  successBtn: {
    padding: '14px 32px',
    borderRadius: '12px',
    border: 'none',
    background: '#22C55E',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
}
