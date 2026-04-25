import styles from '../CriarGrupoScreen.module.css'
import { Icons } from './icons'

export default function StepIntro({ onNext, onBack }) {
  const features = [
    { icon: Icons.bus,   color: '#4FC3F7', text: 'Organize viagens para os jogos' },
    { icon: Icons.pin,   color: '#FF5252', text: 'Conecte torcedores da sua região' },
    { icon: Icons.crown, color: '#FFD740', text: 'Você será o líder do grupo' },
    { icon: Icons.lock,  color: 'var(--color-text-secondary)', text: 'Limite de 100 membros por grupo' },
  ]

  return (
    <div className={styles.stepWrap}>
      <div className={styles.introIconWrap}>
        <div className={styles.introIcon}>{Icons.people}</div>
      </div>

      <h2 className={styles.introTitle}>Crie seu grupo</h2>
      <p className={styles.introSub}>
        Reúna torcedores do seu bairro, organize viagens e vá junto ao estádio com quem você conhece.
      </p>

      <div className={styles.benefitsList}>
        {features.map(f => (
          <div key={f.text} className={styles.benefitItem}>
            <div className={styles.benefitIcon} style={{ color: f.color }}>{f.icon}</div>
            <span className={styles.benefitText}>{f.text}</span>
          </div>
        ))}
      </div>

      <button className={styles.btnPrimary} onClick={onNext}>Criar meu grupo →</button>
      <button className={styles.btnBack} onClick={onBack}>← Voltar</button>
    </div>
  )
}
