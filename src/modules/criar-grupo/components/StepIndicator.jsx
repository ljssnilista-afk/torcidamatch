import styles from '../CriarGrupoScreen.module.css'

export default function StepIndicator({ current, total }) {
  return (
    <div className={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`${styles.stepDot} ${
            i < current ? styles.stepDotDone :
            i === current ? styles.stepDotActive : ''
          }`}
        />
      ))}
    </div>
  )
}
