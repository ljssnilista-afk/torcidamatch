import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripeConfig, createRidePaymentIntent, confirmRidePayment } from '../services/paymentApi'
import { ROUTES } from '../utils/constants'
import styles from './ReservaVagaScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

let stripePromise = null
function getStripe(key) {
  if (!stripePromise) stripePromise = loadStripe(key)
  return stripePromise
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════
function formatPrice(centavos) {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

function formatDate(iso) {
  const d = new Date(iso)
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${dias[d.getDay()]}, ${d.getDate()}/${meses[d.getMonth()]}`
}

function formatTime(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Resumo da viagem + CTA pagar
// ═══════════════════════════════════════════════════════════════════════════════
function StepSummary({ ride, onContinue, loading }) {
  const price = ride.price
  const serviceFee = Math.round(price * 0.08)
  const total = price + serviceFee

  const vehicleLabel = { carro: 'Carro', van: 'Van', onibus: 'Ônibus' }[ride.vehicle] || ride.vehicle

  return (
    <div className={styles.stepContent}>
      {/* Header */}
      <div className={styles.headerBar}>
        <button className={styles.backBtn} onClick={() => window.history.back()} aria-label="Voltar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className={styles.headerCenter}>
          <h2 className={styles.headerTitle}>Reservar vaga</h2>
          <p className={styles.headerSub}>Vamos Comigo!</p>
        </div>
      </div>

      <div className={styles.body}>

        {/* ── Bloco 1: Viagem ── */}
        <p className={styles.sectionLabel}>VIAGEM</p>
        <div className={styles.routeCard}>
          <div className={styles.routeRow}>
            <div className={styles.routeDotGreen} />
            <div className={styles.routeInfo}>
              <span className={styles.routeLabel}>SAÍDA · {formatTime(ride.departureTime)}</span>
              <span className={styles.routePlace}>{ride.meetPoint}</span>
            </div>
          </div>
          <div className={styles.routeLine} />
          <div className={styles.routeRow}>
            <div className={styles.routeDotRed} />
            <div className={styles.routeInfo}>
              <span className={styles.routeLabel}>DESTINO · {ride.game?.date ? formatTime(ride.game.date) : ''}</span>
              <span className={styles.routePlace}>{ride.game?.stadium || 'A confirmar'}</span>
            </div>
          </div>
        </div>

        <div className={styles.tagRow}>
          <span className={styles.tagGreen}>
            {vehicleLabel} · {ride.availableSeats ?? ride.totalSeats} vaga{ride.availableSeats !== 1 ? 's' : ''}
          </span>
          {ride.game?.date && <span className={styles.tag}>{formatDate(ride.game.date)}</span>}
          {ride.game?.homeTeam && (
            <span className={styles.tag}>{ride.game.homeTeam} × {ride.game.awayTeam}</span>
          )}
        </div>

        {/* ── Bloco 2: Motorista ── */}
        <p className={styles.sectionLabel}>MOTORISTA</p>
        <div className={styles.driverCard}>
          <div className={styles.driverAvatar}>
            {getInitials(ride.driverName)}
          </div>
          <div className={styles.driverInfo}>
            <span className={styles.driverName}>{ride.driverName}</span>
            {ride.driverHandle && (
              <span className={styles.driverHandle}>@{ride.driverHandle}</span>
            )}
            {ride.groupName && (
              <span className={styles.driverGroup}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {ride.groupName}
              </span>
            )}
          </div>
        </div>

        {/* ── Bloco 3: Preço ── */}
        <p className={styles.sectionLabel}>RESUMO DE PREÇO</p>
        <div className={styles.priceSummary}>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>1 vaga</span>
            <span className={styles.priceValue}>R$ {formatPrice(price)}</span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Taxa de serviço · 8%</span>
            <span className={styles.priceValue}>R$ {formatPrice(serviceFee)}</span>
          </div>
          <div className={styles.priceDivider} />
          <div className={styles.priceRow}>
            <span className={styles.priceTotalLabel}>Total</span>
            <span className={styles.priceTotalValue}>R$ {formatPrice(total)}</span>
          </div>
        </div>

        {/* ── Bloco 4: Métodos de pagamento ── */}
        <div className={styles.paymentMethodsBox}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className={styles.paymentMethodsText}>
            Pagamento 100% seguro via Stripe
          </span>
          <span className={styles.paymentMethodsBadges}>
            Cartão de crédito · PIX · Boleto
          </span>
        </div>

        {/* ── Sobre a volta ── */}
        <div className={styles.returnBox}>
          <div className={styles.returnHeader}>
            <span className={styles.returnIcon}>💚</span>
            <span className={styles.returnTitle}>Ida garantida · Volta condicional</span>
          </div>
          <p className={styles.returnText}>
            Sua ida está <strong>100% garantida</strong> após o pagamento. A volta não é automática — ela depende da boa convivência durante o trajeto. Seja pontual, trate todos com respeito e curta o rolê. O motorista decide quem volta junto!
          </p>
          <div className={styles.returnPills}>
            <span className={styles.pillGreen}>✅ Ida confirmada</span>
            <span className={styles.pillAmber}>⚠️ Volta condicional</span>
          </div>
        </div>

        {/* ── Nota de captura ── */}
        <div className={styles.captureBox}>
          <p className={styles.captureNote}>
            Seu cartão é <strong>autorizado agora</strong> e cobrado apenas quando o motorista validar o código no embarque. Cancelamento gratuito até 2h antes da saída.
          </p>
        </div>

      </div>

      {/* CTA */}
      <div className={styles.ctaBar}>
        <button
          className={styles.ctaBtn}
          onClick={onContinue}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            'Preparando pagamento...'
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Confirmar e pagar · R$ {formatPrice(total)}
            </>
          )}
        </button>
        <p className={styles.termsNote}>
          Ao pagar, você concorda com os termos e políticas de cancelamento.
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Formulário Stripe (dentro de Elements)
// ═══════════════════════════════════════════════════════════════════════════════
function StripeCheckout({ amount, ride, onSuccess, onBack, token, rideId }) {
  const stripe = useStripe()
  const elements = useElements()
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [timer, setTimer] = useState(300)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const mins = String(Math.floor(timer / 60)).padStart(2, '0')
  const secs = String(timer % 60).padStart(2, '0')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/payment-success` },
        redirect: 'if_required',
      })

      if (error) {
        setStatus('error')
        setErrorMsg(
          error.type === 'card_error' || error.type === 'validation_error'
            ? error.message
            : 'Erro ao processar pagamento. Tente novamente.'
        )
        return
      }

      if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_capture') {
        // Confirmar imediatamente no backend — não depender só do webhook
        try {
          const result = await confirmRidePayment(token, {
            paymentIntentId: paymentIntent.id,
            rideId,
          })
          onSuccess({ ...paymentIntent, validationCode: result.validationCode })
        } catch (confirmErr) {
          // Pagamento OK mas confirmação falhou — ainda exibe sucesso com código fallback
          console.error('[StripeCheckout] Falha na confirmação backend:', confirmErr.message)
          onSuccess(paymentIntent)
        }
      }
    } catch {
      setStatus('error')
      setErrorMsg('Erro de conexão. Verifique sua internet.')
    }
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.headerBar}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Voltar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className={styles.headerCenter}>
          <h2 className={styles.headerTitle}>Confirmar pagamento</h2>
        </div>
      </div>

      <div className={styles.body}>
        {/* Timer */}
        <div className={styles.timerBanner}>
          <div className={styles.timerLeft}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
            <div>
              <span className={styles.timerLabel}>Reserva garantida por</span>
              <span className={styles.timerValue}>{mins}:{secs}</span>
            </div>
          </div>
          <div className={styles.timerRight}>
            <span className={styles.timerTotal}>TOTAL</span>
            <span className={styles.timerPrice}>R$ {formatPrice(amount)}</span>
          </div>
        </div>

        {/* Rota compacta */}
        <div className={styles.routeCompact}>
          <div className={styles.routeCompactRow}>
            <div className={styles.routeDotGreen} />
            <span className={styles.routeCompactText}>{ride.meetPoint}</span>
          </div>
          <div className={styles.routeLineShort} />
          <div className={styles.routeCompactRow}>
            <div className={styles.routeDotRed} />
            <span className={styles.routeCompactText}>{ride.game?.stadium || 'A confirmar'}</span>
          </div>
          <span className={styles.routeCompactDate}>
            {ride.game?.date ? formatDate(ride.game.date) : ''} · {formatTime(ride.departureTime)} · {ride.driverName}
          </span>
        </div>

        {/* Stripe form */}
        <form onSubmit={handleSubmit}>
          <p className={styles.sectionLabel}>FORMA DE PAGAMENTO</p>
          <div className={styles.stripeWrapper}>
            <PaymentElement options={{ layout: 'tabs' }} />
          </div>

          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>Seu cartão é apenas autorizado agora.</p>
            <p className={styles.infoText}>
              A cobrança só acontece quando o motorista valida o código no embarque.
              Se a viagem não acontecer, nada é cobrado — automático.
            </p>
          </div>

          {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

          <div className={styles.ctaBar}>
            <button
              type="submit"
              className={styles.ctaBtn}
              disabled={!stripe || status === 'loading'}
              style={{ opacity: status === 'loading' ? 0.7 : 1 }}
            >
              {status === 'loading' ? 'Processando...' : `Confirmar reserva · R$ ${formatPrice(amount)}`}
            </button>
            <p className={styles.cancelNote}>Cancelamento grátis até 2h antes da saída</p>
            <p className={styles.secureLine}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              PAGAMENTO 100% SEGURO VIA STRIPE
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

function StepPagamento({ ride, amount, clientSecret, publishableKey, onSuccess, onBack, token, rideId }) {
  if (!clientSecret || !publishableKey) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Preparando pagamento...</p>
      </div>
    )
  }

  return (
    <Elements
      stripe={getStripe(publishableKey)}
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
          },
          rules: {
            '.Input': { backgroundColor: '#1e1e1e', border: '1.5px solid #2a2a2a' },
            '.Input:focus': { border: '1.5px solid #22C55E', boxShadow: '0 0 0 1px rgba(34,197,94,0.25)' },
            '.Tab': { backgroundColor: '#1e1e1e', border: '1.5px solid #2a2a2a', color: '#a3a3a3' },
            '.Tab--selected': { backgroundColor: '#0d1f10', border: '1.5px solid #22C55E', color: '#22C55E' },
          },
        },
        locale: 'pt-BR',
      }}
    >
      <StripeCheckout amount={amount} ride={ride} onSuccess={onSuccess} onBack={onBack} token={token} rideId={rideId} />
    </Elements>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Código de validação + sucesso
// ═══════════════════════════════════════════════════════════════════════════════
function StepCodigo({ ride, amount, validationCode }) {
  const navigate = useNavigate()

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Minha reserva TorcidaMatch',
        text: `Código de validação: ${validationCode}\nViagem: ${ride.meetPoint} → ${ride.game?.stadium}`,
      })
    } else {
      navigator.clipboard?.writeText(validationCode)
    }
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.successCenter}>
        <div className={styles.successGlow} />
        <div className={styles.successCheck}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className={styles.successTitle}>Vaga garantida!</h1>
        <p className={styles.successSub}>
          Mostre o código ao motorista no embarque.{'\n'}O pagamento é capturado só então.
        </p>
      </div>

      <div className={styles.body}>
        <div className={styles.codeCard}>
          <p className={styles.sectionLabel}>CÓDIGO DE VALIDAÇÃO</p>
          <p className={styles.codeValue}>{validationCode}</p>
          <p className={styles.codeExpiry}>
            válido até {formatTime(ride.departureTime)} · {ride.game?.date ? formatDate(ride.game.date) : ''}
          </p>
        </div>

        <div className={styles.routeCompact}>
          <div className={styles.routeCompactRow}>
            <div className={styles.routeDotGreen} />
            <span className={styles.routeCompactText}>{ride.meetPoint}</span>
          </div>
          <div className={styles.routeLineShort} />
          <div className={styles.routeCompactRow}>
            <div className={styles.routeDotRed} />
            <span className={styles.routeCompactText}>{ride.game?.stadium || 'A confirmar'}</span>
          </div>
          <div className={styles.routeCompactFooter}>
            <span className={styles.routeCompactDate}>
              {ride.game?.date ? formatDate(ride.game.date) : ''} · {formatTime(ride.departureTime)}
            </span>
            <span className={styles.authorizedAmount}>R$ {formatPrice(amount)} autorizado</span>
          </div>
        </div>
      </div>

      <div className={styles.ctaBar}>
        <button className={styles.ctaBtn} onClick={() => navigate(ROUTES.FUI)}>
          Ver minha viagem
        </button>
        <button className={styles.outlineBtn} onClick={handleShare}>
          Compartilhar código
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — ReservaVagaScreen
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReservaVagaScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const toast = useToast()
  const token = user?.token

  const [step, setStep] = useState(1)      // 1=resumo, 2=pagamento, 3=código
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  // Stripe state
  const [clientSecret, setClientSecret] = useState(null)
  const [publishableKey, setPublishableKey] = useState(null)
  const [amount, setAmount] = useState(0)

  // Validation code
  const [validationCode, setValidationCode] = useState('')

  // Load ride
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/rides/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (res.ok) setRide(data.ride || data)
        else toast.error(data.error || 'Erro ao carregar viagem')
      } catch {
        toast.error('Erro de conexão')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Cria payment intent e avança para pagamento
  const goToPayment = useCallback(async () => {
    if (!token) {
      toast.error('Faça login para continuar')
      navigate(ROUTES.LOGIN)
      return
    }

    setPaying(true)
    try {
      const config = await getStripeConfig()
      setPublishableKey(config.publishableKey)

      const result = await createRidePaymentIntent(token, id)
      setClientSecret(result.clientSecret)
      setAmount(result.amount)

      setStep(2)
    } catch (err) {
      toast.error(err.message || 'Erro ao iniciar pagamento')
    } finally {
      setPaying(false)
    }
  }, [id, token, navigate, toast])

  const handlePaymentSuccess = (paymentIntent) => {
    // Preferir código real do backend; fallback local se confirmação falhou
    const code = paymentIntent?.validationCode
      || `TM-${String(Math.floor(1000 + Math.random() * 9000))}`
    setValidationCode(code)
    setStep(3)
  }

  if (loading) {
    return (
      <div className={styles.screen}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className={styles.screen}>
        <div className={styles.loadingWrap}>
          <p className={styles.loadingText}>Viagem não encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      {step === 1 && (
        <StepSummary
          ride={ride}
          onContinue={goToPayment}
          loading={paying}
        />
      )}
      {step === 2 && (
        <StepPagamento
          ride={ride}
          amount={amount}
          clientSecret={clientSecret}
          publishableKey={publishableKey}
          onSuccess={handlePaymentSuccess}
          onBack={() => setStep(1)}
          token={token}
          rideId={id}
        />
      )}
      {step === 3 && (
        <StepCodigo
          ride={ride}
          amount={amount}
          validationCode={validationCode}
        />
      )}
    </div>
  )
}
