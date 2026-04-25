import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import styles from '../PerfilScreen.module.css'

async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = imageSrc
  })
  const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 300
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, 300, 300)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export default function CropModal({ imageSrc, onConfirm, onCancel, saving }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState(null)
  const onCropComplete = useCallback((_, px) => setCroppedArea(px), [])
  const handleConfirm = async () => { if (croppedArea) onConfirm(await getCroppedImg(imageSrc, croppedArea)) }

  return (
    <div className={styles.cropOverlay}>
      <div className={styles.cropSheet}>
        <div className={styles.cropHandle}/>
        <div className={styles.cropHeader}>
          <button className={styles.cropCancelBtn} onClick={onCancel}>Cancelar</button>
          <span className={styles.cropTitle}>Ajustar foto</span>
          <button className={styles.cropConfirmBtn} onClick={handleConfirm} disabled={saving}>{saving ? '...' : 'Confirmar'}</button>
        </div>
        <div className={styles.cropArea}>
          <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
            onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
        </div>
        <div className={styles.cropZoom}>
          <span className={styles.cropZoomLabel}>Zoom</span>
          <input type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={e => setZoom(Number(e.target.value))} className={styles.cropSlider} />
        </div>
      </div>
    </div>
  )
}
