import { useToast } from '@shared/contexts/ToastContext'
import styles from '../GrupoScreen.module.css'

export default function InviteModal({ grupo, onClose }) {
  const toast = useToast()
  const link = grupo?.code
    ? `https://torcidamatch.vercel.app/join/${grupo.code}`
    : `https://torcidamatch.vercel.app/grupos/entrar/${grupo?._id}`

  const copy = () => {
    navigator.clipboard?.writeText(link)
    toast.success('Link copiado!')
    onClose()
  }

  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.inviteSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.menuHandle}/>
        <p className={styles.inviteTitle}>Convidar para {grupo?.name}</p>
        <p className={styles.inviteSub}>Compartilhe o link abaixo</p>
        <div className={styles.inviteLink}>
          <span className={styles.inviteLinkText}>{link}</span>
        </div>
        <button className={styles.btnPrimary} onClick={copy}>Copiar link</button>
        <button className={styles.btnSecondary} onClick={onClose}>Fechar</button>
      </div>
    </div>
  )
}
