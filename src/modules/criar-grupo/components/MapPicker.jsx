import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import styles from '../CriarGrupoScreen.module.css'
import { Icons, greenPin } from './icons'

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng) } })
  return null
}

export default function MapPicker({ visible, onClose, onConfirm, initialLat, initialLng }) {
  const DEFAULT_LAT = -22.9068
  const DEFAULT_LNG = -43.1729

  const [pin,      setPin]      = useState(initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null)
  const [locating, setLocating] = useState(false)
  const [address,  setAddress]  = useState('')
  const mapRef = useRef(null)

  useEffect(() => {
    if (!pin) { setAddress(''); return }
    let cancelled = false
    ;(async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pin.lat}&lon=${pin.lng}&format=json&accept-language=pt-BR`,
          { headers: { 'User-Agent': 'TorcidaMatch/1.0' } }
        )
        const data = await res.json()
        if (cancelled) return
        const road   = data.address?.road || ''
        const bairro = data.address?.suburb || data.address?.neighbourhood || ''
        setAddress(road ? `${road}, ${bairro}` : `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`)
      } catch {
        if (!cancelled) setAddress(`${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`)
      }
    })()
    return () => { cancelled = true }
  }, [pin?.lat, pin?.lng])

  const handleMyLocation = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPin(coords)
        mapRef.current?.flyTo([coords.lat, coords.lng], 16, { duration: 1 })
        setLocating(false)
      },
      () => { setLocating(false) },
      { timeout: 8000 }
    )
  }

  useEffect(() => {
    if (!visible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [visible])

  if (!visible) return null

  return createPortal(
    <div className={styles.mapOverlay}>
      <div className={styles.mapModal}>
        <div className={styles.mapHeader}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">{Icons.close}</button>
          <span className={styles.mapHeaderTitle}>Marcar localização</span>
          <div style={{ width: 34 }} />
        </div>

        <p className={styles.mapHint}>Toque no mapa para posicionar o ponto de encontro</p>

        <div className={styles.mapContainer}>
          <MapContainer
            center={pin ? [pin.lat, pin.lng] : [DEFAULT_LAT, DEFAULT_LNG]}
            zoom={14}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapClickHandler onLocationSelect={(latlng) => setPin(latlng)} />
            {pin && <Marker position={[pin.lat, pin.lng]} icon={greenPin} />}
          </MapContainer>

          <button className={styles.mapLocateBtn} onClick={handleMyLocation} disabled={locating} aria-label="Minha localização">
            {Icons.crosshair}
          </button>
        </div>

        <div className={styles.mapFooter}>
          {address && (
            <div className={styles.mapAddress}>
              <span className={styles.mapAddressIcon}>{Icons.mapPin}</span>
              <span className={styles.mapAddressText}>{address}</span>
            </div>
          )}
          <button
            className={`${styles.btnPrimary} ${styles.mapConfirmBtn}`}
            onClick={() => pin && onConfirm(pin, address)}
            disabled={!pin}
          >
            Confirmar localização
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
