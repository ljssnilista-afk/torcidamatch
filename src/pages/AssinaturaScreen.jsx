import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripeConfig, createGroupPaymentIntent } from '../services/paymentApi'
import { ROUTES } from '../utils/constants'
import styles from './AssinaturaScreen.module.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

let stripePromise = null
function getStripe(key) {
  if (!stripePromise) stripePromise = loadStripe(key)
  return stripePromise
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Seleção de plano
// ═══════════════════════════════════════════════════════════════════════════════
function StepPlano({ grupo, selected, onSelect, onContinue }) {
  const fee = grupo.membershipFee || 0
  const monthlyPrice = fee / 100
  const annualPrice = (monthlyPrice * 10.8).toFixed(2) // 10% desconto
  const monthlyDisplay = monthlyPrice.toFixed(2).replace('.', ',')
  const annualMonthly = (annualPrice / 12).toFixed(2).replace('.', ',')
  const annualDisplay = Number(annualPrice).toFixed(2).replace('.', ',')

  return (
    <div className={styles.stepContent}>
      {/* Hero do grupo */}
      <div className={styles.heroSection}>
        <div className={styles.heroBg} />
        <button className={styles.backBtn} onClick={() => window.history.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>{grupo.team} · {grupo.zona || grupo.bairro}</span>
          <h1 className={styles.heroTitle}>{grupo.name}</h1>
          <p className={styles.heroSub}>{grupo.members?.length || 0} membros</p>
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.sectionLabel}>ESCOLHA SEU PLANO</p>

        {/* Card Anual */}
        <button
          className={`${styles.planCard} ${selected === 'annual' ? styles.planCardSelected : ''}`}
          onClick={() => onSelect('annual')}
        >
          <div className={styles.planRadio}>
            <div className={`${styles.radioOuter} ${selected === 'annual' ? styles.radioActive : ''}`}>
              {selected === 'annual' && <div className={styles.radioInner} />}
            </div>
          </div>
          <div className={styles.planInfo}>
            <div className={styles.planHeader}>
              <span className={styles.planName}>Anual</span>
              <span className={styles.badgePopular}>POPULAR</span>
            </div>
            <div className={styles.planPrice}>
              <span className={styles.priceMain}>R$ {annualMonthly}</span>
              <span className={styles.pricePer}>/mês · cobrado anualmente</span>
            </div>
            <div className={styles.planBenefits}>
              <span className={styles.benefit}><span className={styles.dot} /> Acesso total ao grupo e chat</span>
              <span className={styles.benefit}><span className={styles.dot} /> Prioridade em caravanas e vagas</span>
              <span className={styles.benefit}><span className={styles.dot} /> Economia de R$ {(monthlyPrice * 12 - Number(annualPrice)).toFixed(2).replace('.', ',')} por ano</span>
            </div>
          </div>
        </button>

        {/* Card Mensal */}
        <button
          className={`${styles.planCard} ${selected === 'monthly' ? styles.planCardSelected : ''}`}
          onClick={() => onSelect('monthly')}
        >
          <div className={styles.planRadio}>
            <div className={`${styles.radioOuter} ${selected === 'monthly' ? styles.radioActive : ''}`}>
              {selected === 'monthly' && <div className={styles.radioInner} />}
            </div>
          </div>
          <div className={styles.planInfo}>
            <div className={styles.planHeader}>
              <span className={styles.planName}>Mensal</span>
              <span className={styles.badgeEcon}>ECONÔMICO</span>
            </div>
            <div className={styles.planPrice}>
              <span className={styles.priceMain}>R$ {monthlyDisplay}</span>
              <span className={styles.pricePer}>/mês · cancela quando quiser</span>
            </div>
          </div>
        </button>

        {/* Resumo */}
        <p className={styles.sectionLabel}>RESUMO</p>
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>{selected === 'annual' ? 'Plano anual' : 'Plano mensal'}</span>
            <span className={styles.summaryValue}>R$ {selected === 'annual' ? annualDisplay : monthlyDisplay}</span>
          </div>
          {selected === 'annual' && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>1º mês grátis</span>
              <span className={styles.summaryValueGreen}>− R$ {annualMonthly}</span>
            </div>
          )}
          <div className={styles.summaryDivider} />
          <div className={styles.summaryRow}>
            <span className={styles.summaryTotal}>Total hoje</span>
            <span className={styles.summaryTotalValue}>R$ {selected === 'annual' ? '0,00' : monthlyDisplay}</span>
          </div>
        </div>

        {selected === 'annual' && (
          <p className={styles.disclaimer}>
            Renova por R$ {annualDisplay}/ano após o 1º mês. Cancele até 24h antes a qualquer momento no seu perfil. Sem multas.
          </p>
        )}
      </div>

      {/* CTA */}
      <div className={styles.ctaBar}>
        <button className={styles.ctaBtn} onClick={onContinue}>
          Continuar para pagamento
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
// STEP 2 — Pagamento (Stripe Elements)
// ═══════════════════════════════════════════════════════════════════════════════
function StripeCheckout({ amount, grupo, planLabel, onSuccess, onBack }) {
  const stripe = useStripe()
  const elements = useElements()
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

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
          <h2 className={styles.headerTitle}>Pagamento</h2>
          <p className={styles.headerSub}>{grupo.name} · {planLabel}</p>
        </div>
      </div>

      <div className={styles.body}>
        {/* Resumo compacto */}
        <div className={styles.compactSummary}>
          <div className={styles.compactIcon}>
            <span className={styles.compactInitials}>{grupo.name?.slice(0,2).toUpperCase()}</span>
          </div>
          <div className={styles.compactInfo}>
            <span className={styles.compactName}>{grupo.name}</span>
            <span className={styles.compactPlan}>{planLabel}</span>
          </div>
        </div>

        {/* Stripe Payment Element */}
        <form onSubmit={handleSubmit}>
          <p className={styles.sectionLabel}>DADOS DO PAGAMENTO</p>
          <div className={styles.stripeWrapper}>
            <PaymentElement options={{ layout: 'tabs' }} />
          </div>

          {errorMsg && (
            <div className={styles.errorBox}>{errorMsg}</div>
          )}

          {/* Total */}
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total hoje</span>
            <span className={styles.totalValue}>R$ {(amount / 100).toFixed(2).replace('.', ',')}</span>
          </div>

          <div className={styles.ctaBar}>
            <button
              type="submit"
              className={styles.ctaBtn}
              disabled={!stripe || status === 'loading'}
              style={{ opacity: status === 'loading' ? 0.7 : 1 }}
            >
              {status === 'loading' ? 'Processando...' : 'Confirmar assinatura'}
            </button>
            <p className={styles.secureLine}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              CRIPTOGRAFADO POR STRIPE · PCI DSS
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

function StepPagamento({ grupo, plan, amount, clientSecret, publishableKey, onSuccess, onBack }) {
  if (!clientSecret || !publishableKey) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Preparando pagamento...</p>
      </div>
    )
  }

  const planLabel = plan === 'annual' ? 'Plano anual · 1º mês grátis' : 'Plano mensal'

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
      <StripeCheckout amount={amount} grupo={grupo} planLabel={planLabel} onSuccess={onSuccess} onBack={onBack} />
    </Elements>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Sucesso
// ═══════════════════════════════════════════════════════════════════════════════
function StepSucesso({ grupo, plan, onGoToGroup }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.successCenter}>
        {/* Check */}
        <div className={styles.successGlow} />
        <div className={styles.successCheck}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <h1 className={styles.successTitle}>Bem-vindo à torcida!</h1>
        <p className={styles.successSub}>Seu acesso ao grupo foi liberado.</p>
        <p className={styles.successSub}>O chat e as caravanas já estão esperando.</p>
      </div>

      {/* Card resumo */}
      <div className={styles.successCard}>
        <p className={styles.sectionLabel}>SUA ASSINATURA</p>
        <h3 className={styles.successGroupName}>{grupo.name}</h3>
        <span className={styles.badgeAtiva}>ATIVA</span>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Plano</span>
          <span className={styles.summaryValue}>{plan === 'annual' ? 'Anual' : 'Mensal'}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Próxima cobrança</span>
          <span className={styles.summaryValue}>{new Date(Date.now() + (plan === 'annual' ? 365 : 30) * 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <div className={styles.ctaBar}>
        <button className={styles.ctaBtn} onClick={onGoToGroup}>
          Ir para o grupo
        </button>
        <button className={styles.outlineBtn} onClick={() => window.history.back()}>
          Ver minha assinatura
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — AssinaturaScreen
// ═══════════════════════════════════════════════════════════════════════════════
export default function AssinaturaScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const toast = useToast()
  const token = user?.token

  const [step, setStep] = useState(1) // 1=plano, 2=pagamento, 3=sucesso
  const [plan, setPlan] = useState('annual')
  const [grupo, setGrupo] = useState(null)
  const [loading, setLoading] = useState(true)

  // Stripe state
  const [clientSecret, setClientSecret] = useState(null)
  const [publishableKey, setPublishableKey] = useState(null)
  const [amount, setAmount] = useState(0)

  // Carregar dados do grupo
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/grupos/${id}`)
        const data = await res.json()
        if (res.ok) setGrupo(data.group)
        else toast.error(data.error || 'Erro ao carregar grupo')
      } catch { toast.error('Erro de conexão') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  // Quando avança para step 2, registrar como pendingPayment e criar PaymentIntent
  const goToPayment = useCallback(async () => {
    if (!token) {
      toast.error('Faça login para continuar')
      navigate(ROUTES.LOGIN)
      return
    }

    try {
      // 1. Registrar no backend como pendingPayment
      const entrarRes = await fetch(`${API_URL}/grupos/${id}/entrar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const entrarData = await entrarRes.json()

      if (!entrarRes.ok && entrarRes.status !== 400) {
        if (entrarRes.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.')
          navigate(ROUTES.LOGIN)
          return
        }
        throw new Error(entrarData.error)
      }

      // 2. Buscar config do Stripe
      const config = await getStripeConfig()
      setPublishableKey(config.publishableKey)

      // 3. Criar PaymentIntent
      const result = await createGroupPaymentIntent(token, id)
      setClientSecret(result.clientSecret)
      setAmount(result.amount)

      setStep(2)
    } catch (err) {
      toast.error(err.message || 'Erro ao iniciar pagamento')
    }
  }, [id, token, navigate, toast])

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

  if (!grupo) {
    return (
      <div className={styles.screen}>
        <div className={styles.loadingWrap}>
          <p className={styles.loadingText}>Grupo não encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      {step === 1 && (
        <StepPlano
          grupo={grupo}
          selected={plan}
          onSelect={setPlan}
          onContinue={goToPayment}
        />
      )}
      {step === 2 && (
        <StepPagamento
          grupo={grupo}
          plan={plan}
          amount={amount}
          clientSecret={clientSecret}
          publishableKey={publishableKey}
          onSuccess={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepSucesso
          grupo={grupo}
          plan={plan}
          onGoToGroup={() => navigate(`/grupos/${id}`)}
        />
      )}
    </div>
  )
}
