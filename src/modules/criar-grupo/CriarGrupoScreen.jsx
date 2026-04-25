import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@shared/contexts/UserContext'
import { useToast } from '@shared/contexts/ToastContext'
import { ROUTES } from '@shared/utils/constants'
import { API_URL } from '@shared/services/api'
import styles from './CriarGrupoScreen.module.css'

import StepIndicator   from './components/StepIndicator'
import StepIntro       from './components/StepIntro'
import StepDados       from './components/StepDados'
import StepLocalizacao from './components/StepLocalizacao'
import StepConfirm     from './components/StepConfirm'
import { Icons }       from './components/icons'

const TOTAL_STEPS = 4

// ─── Orchestrator ──────────────────────────────────────────────────────────────────────────
export default function CriarGrupoScreen() {
  const navigate = useNavigate()
  const { user, ensureValidToken, logout } = useUser()
  const toast = useToast()

  const [step,        setStep]        = useState(0)
  const [dados,       setDados]       = useState(null)
  const [localizacao, setLocalizacao] = useState(null)
  const [loading,     setLoading]     = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const token = await ensureValidToken()
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.')
        logout()
        navigate(ROUTES.LOGIN)
        return
      }

      const isPrivate = localizacao.groupType === 'private'
      const body = {
        name:             dados.name,
        team:             dados.team,
        bairro:           dados.bairro,
        zona:             dados.zona,
        description:      dados.description,
        meetPoint:        localizacao.meetPoint,
        privacy:          localizacao.groupType,
        approvalRequired: localizacao.groupType === 'public',
        ...(isPrivate && localizacao.monthlyFee ? {
          membershipFee: Math.round(parseFloat(localizacao.monthlyFee.replace(',', '.')) * 100),
        } : {}),
        ...(localizacao.lat && localizacao.lng ? {
          location: { lat: localizacao.lat, lng: localizacao.lng },
        } : {}),
      }

      const res = await fetch(`${API_URL}/grupos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })

      if (res.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.')
        logout()
        navigate(ROUTES.LOGIN)
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar grupo')

      toast.success('Grupo criado com sucesso!')
      navigate(`/grupos/${data.group._id}`, { state: { grupo: data.group } })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.closeBtn} onClick={() => navigate(ROUTES.GRUPOS)} aria-label="Fechar">
          {Icons.close}
        </button>
        <span className={styles.headerTitle}>Criar grupo</span>
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      <div className={styles.scrollArea}>
        {step === 0 && (
          <StepIntro
            onNext={() => setStep(1)}
            onBack={() => navigate(ROUTES.GRUPOS)}
          />
        )}
        {step === 1 && (
          <StepDados
            initial={dados}
            onNext={(d) => { setDados(d); setStep(2) }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepLocalizacao
            initial={localizacao}
            dados={dados}
            onNext={(l) => { setLocalizacao(l); setStep(3) }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepConfirm
            dados={dados}
            localizacao={localizacao}
            onConfirm={handleConfirm}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}
