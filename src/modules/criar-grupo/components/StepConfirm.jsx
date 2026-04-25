import styles from '../CriarGrupoScreen.module.css'
import { Icons } from './icons'

export default function StepConfirm({ dados, localizacao, onConfirm, loading }) {
  const isPrivate = localizacao.groupType === 'private'
  const rows = [
    ['Nome',       dados.name],
    ['Time',       dados.team],
    ['Bairro',     `${dados.bairro}, ${dados.zona}`],
    ['Referência', localizacao.meetPoint],
    ['Tipo',       isPrivate ? 'Privado (pago)' : 'Público'],
  ]
  if (dados.description)              rows.splice(3, 0, ['Descrição', dados.description])
  if (isPrivate && localizacao.monthlyFee) rows.push(['Mensalidade', `R$ ${localizacao.monthlyFee}/mês`])
  if (localizacao.locLabel)           rows.push(['Local', localizacao.locLabel])

  return (
    <div className={styles.stepWrap}>
      <div className={styles.confirmIconWrap}>
        <div className={styles.confirmIcon}>{Icons.check}</div>
      </div>
      <h2 className={styles.stepTitle}>Tudo pronto!</h2>
      <p className={styles.stepSub}>Confirme os dados do seu grupo</p>

      <div className={styles.confirmCard}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{label}</span>
            <span className={styles.confirmValue}>{value}</span>
          </div>
        ))}
      </div>

      <button
        className={`${styles.btnPrimary} ${loading ? styles.btnLoading : ''}`}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading
          ? <span className={styles.dots}><span/><span/><span/></span>
          : 'Criar grupo →'}
      </button>
    </div>
  )
}
