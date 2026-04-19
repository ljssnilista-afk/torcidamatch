import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripeConfig, createRidePaymentIntent } from '../services/paymentApi'
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
  return `${dias[d.getDay()]} · ${d.getDate()}/${meses[d.getMonth()]}`
}

function formatTime(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Seleção de assento
// ═══════════════════════════════════════════════════════════════════════════════
function StepAssento({ ride, selectedSeat, onSelectSeat, onContinue, userId }) {
  const occupiedSeats = ride.passengers
    .filter(p => p.status !== 'cancelled')
    .map((_, i) => i + 1)

  const totalSeats = ride.totalSeats
  const cols = ride.vehicle === 'carro' ? 2 : 3
  const price = ride.price
  const serviceFee = Math.round(price * 0.08)
  const total = price + serviceFee

  return (
    <div className={styles.stepContent}>
      <div className={styles.headerBar}>
        <button className={styles.backBtn} onClick={() => window.history.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className={styles.headerCenter}>
          <h2 className={styles.headerTitle}>Reservar vaga</h2>
          <p className={styles.headerSub}>Vamos Comigo!</p>
        </div>
      </div>

      <div className={styles.body}>
        {/* Rota */}
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
              <span className={styles.routePlace}>{ride.game?.stadium}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className={styles.tagRow}>
          <span className={styles.tagGreen}>
            {ride.vehicle?.toUpperCase()} · {ride.totalSeats} VAGAS
          </span>
          <span className={styles.tag}>{ride.game?.date ? formatDate(ride.game.date) : ''}</span>
          <span className={styles.tag}>{ride.game?.homeTeam} × {ride.game?.awayTeam}</span>
        </div>

        {/* Grid de assentos */}
        <p className={styles.sectionLabel}>ESCOLHA SEU ASSENTO</p>

        {/* Motorista */}
        <div className={styles.driverRow}>
          <div className={styles.driverSeat}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
              <path d="M12 2a10 10 0 0110 10"/>
            </svg>
          </div>
          <span className={styles.driverLabel}>MOTORISTA</span>
        </div>

        {/* Seats grid */}
        <div className={styles.seatGrid} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: totalSeats }, (_, i) => {
            const num = i + 1
            const isOccupied = occupiedSeats.includes(num)
            const isSelected = selectedSeat === num
            const isDriver = false

            return (
              <button
                key={num}
                className={`${styles.seat} ${isOccupied ? styles.seatOccupied : ''} ${isSelected ? styles.seatSelected : ''}`}
                onClick={() => !isOccupied && onSelectSeat(num)}
                disabled={isOccupied}
              >
                {String(num).padStart(2, '0')}
              </button>
            )
          })}
        </div>

        {/* Legenda */}
        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#404040' }} />
            <span>Livre</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#22C55E' }} />
            <span>Sua vaga</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#252525' }} />
            <span>Ocupada</span>
          </div>
        </div>

        {/* Resumo preço */}
        {selectedSeat && (
          <div className={styles.priceSummary}>
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Vaga nº {String(selectedSeat).padStart(2, '0')}</span>
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
        )}

        <p className={styles.captureNote}>
          Reservado agora · capturado após validação pelo motorista
        </p>
      </div>

      {/* CTA */}
      <div className={styles.ctaBar}>
        <button
          className={styles.ctaBtn}
          disabled={!selectedSeat}
          onClick={onContinue}
          style={{ opacity: selectedSeat ? 1 : 0.4 }}
        >
          {selectedSeat
            ? `Reservar vaga ${String(selectedSeat).padStart(2, '0')}`
            : 'Selecione um assento'
          }
        </button>
        <p className={styles.secureLine}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          PAGAMENTO 100% SEGURO VIA STRIPE
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Confirmar & Pagar (Stripe Elements)
// ═══════════════════════════════════════════════════════════════════════════════
function StripeCheckout({ amount, ride, seatNum, onSuccess, onBack }) {
  const stripe = useStripe()
  const elements = useElements()
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [timer, setTimer] = useState(300) // 5 min

  // Countdown timer
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
        setErrorMsg(error.type === 'card_error' || error.type === 'validation_error'
          ? error.message : 'Erro ao processar pagamento. Tente novamente.')
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent)
      }
    } catch {
      setStatus('error')
      setErrorMsg('Erro de conexão. Verifique sua internet.')
    }
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.headerBar}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className={styles.headerCenter}>
          <h2 className={styles.headerTitle}>Confirmar reserva</h2>
        </div>
      </div>

      <div className={styles.body}>
        {/* Timer banner */}
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

        {/* Route compact */}
        <div className={styles.routeCompact}>
          <div className={styles.routeCompactRow}>
            <div className={styles.routeDotGreen} />
            <span className={styles.routeCompactText}>{ride.meetPoint}</span>
            <span className={styles.tagSmall}>VAGA {String(seatNum).padStart(2, '0')}</span>
          </div>
          <div className={styles.routeLineShort} />
          <div className={styles.routeCompactRow}>
            <div className={styles.routeDotRed} />
            <span className={styles.routeCompactText}>{ride.game?.stadium}</span>
          </div>
          <span className={styles.routeCompactDate}>
            {ride.game?.date ? formatDate(ride.game.date) : ''} · {formatTime(ride.departureTime)}
          </span>
        </div>

        {/* Stripe form */}
        <form onSubmit={handleSubmit}>
          <p className={styles.sectionLabel}>FORMA DE PAGAMENTO</p>
          <div className={styles.stripeWrapper}>
            <PaymentElement options={{ layout: 'tabs' }} />
          </div>

          {/* Info box */}
          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>Seu cartão é apenas autorizado agora.</p>
            <p className={styles.infoText}>
              A cobrança só acontece quando o motorista valida o código no embarque. Se a viagem não rolar, nada é cobrado — automático.
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              PAGAMENTO 100% SEGURO VIA STRIPE
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

function StepPagamento({ ride, seatNum, amount, clientSecret, publishableKey, onSuccess, onBack }) {
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
      <StripeCheckout amount={amount} ride={ride} seatNum={seatNum} onSuccess={onSuccess} onBack={onBack} />
    </Elements>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Código de validação
// ═══════════════════════════════════════════════════════════════════════════════
function StepCodigo({ ride, seatNum, amount, validationCode }) {
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
        {/* Check */}
        <div className={styles.successGlow} />
        <div className={styles.successCheck}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <h1 className={styles.successTitle}>Vaga garantida!</h1>
        <p className={styles.successSub}>
          Mostre o código abaixo ao motorista{'\n'}no embarque. O pagamento é capturado só então.
        </p>
      </div>

      <div className={styles.body}>
        {/* Código grande */}
        <div className={styles.codeCard}>
          <p className={styles.sectionLabel}>CÓDIGO DE VALIDAÇÃO</p>
          <p className={styles.codeValue}>{validationCode}</p>
          <p className={styles.codeExpiry}>
            válido até {formatTime(ride.departureTime)} · {ride.game?.date ? formatDate(ride.game.date).split(' · ')[1] : ''}
          </p>
        </div>

        {/* Rota resumo */}
        <div className={styles.routeCompact}>
          <div className={styles.routeCompactRow}>
            <div className={styles.routeDotGreen} />
            <span className={styles.routeCompactText}>{ride.meetPoint}</span>
          </div>
          <div className={styles.routeLineShort} />
          <div className={styles.routeCompactRow}>
            <div className={styles.routeDotRed} />
            <span className={styles.routeCompactText}>{ride.game?.stadium}</span>
          </div>
          <div className={styles.routeCompactFooter}>
            <span className={styles.routeCompactDate}>
              {ride.game?.date ? formatDate(ride.game.date) : ''} · {formatTime(ride.departureTime)} · Vaga {String(seatNum).padStart(2, '0')}
            </span>
            <span className={styles.authorizedAmount}>R$ {formatPrice(amount)} autorizado</span>
          </div>
        </div>
      </div>

      <div className={styles.ctaBar}>
        <button className={styles.ctaBtn} onClick={() => navigate(`/vamos-comigo/${ride._id}`)}>
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

  const [step, setStep] = useState(1) // 1=assento, 2=pagamento, 3=código
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeat, setSelectedSeat] = useState(null)

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
        const res = await fetch(`${API_URL}/vamos-comigo/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (res.ok) setRide(data.ride || data)
        else toast.error(data.error || 'Erro ao carregar viagem')
      } catch { toast.error('Erro de conexão') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  // Advance to payment
  const goToPayment = useCallback(async () => {
    if (!token) {
      toast.error('Faça login para continuar')
      navigate(ROUTES.LOGIN)
      return
    }

    try {
      const config = await getStripeConfig()
      setPublishableKey(config.publishableKey)

      const result = await createRidePaymentIntent(token, id)
      setClientSecret(result.clientSecret)
      setAmount(result.amount)

      setStep(2)
    } catch (err) {
      toast.error(err.message || 'Erro ao iniciar pagamento')
    }
  }, [id, token, navigate, toast])

  const handlePaymentSuccess = (paymentIntent) => {
    // Generate a validation code
    const code = `TM-${String(Math.floor(1000 + Math.random() * 9000))}`
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
        <StepAssento
          ride={ride}
          selectedSeat={selectedSeat}
          onSelectSeat={setSelectedSeat}
          onContinue={goToPayment}
          userId={user?.id}
        />
      )}
      {step === 2 && (
        <StepPagamento
          ride={ride}
          seatNum={selectedSeat}
          amount={amount}
          clientSecret={clientSecret}
          publishableKey={publishableKey}
          onSuccess={handlePaymentSuccess}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepCodigo
          ride={ride}
          seatNum={selectedSeat}
          amount={amount}
          validationCode={validationCode}
        />
      )}
    </div>
  )
}
