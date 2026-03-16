import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { TOAST_DURATION } from '../utils/constants'
import styles from './ToastContext.module.css'

const ToastContext = createContext(null)

/** Toast variants: 'success' | 'error' | 'info' | 'favorite' */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counterRef = useRef(0)

  const show = useCallback((message, variant = 'success', duration = TOAST_DURATION) => {
    const id = ++counterRef.current
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Convenience shortcuts
  const success  = useCallback((msg) => show(msg, 'success'),  [show])
  const error    = useCallback((msg) => show(msg, 'error'),    [show])
  const info     = useCallback((msg) => show(msg, 'info'),     [show])
  const favorite = useCallback((msg) => show(msg, 'favorite'), [show])

  return (
    <ToastContext.Provider value={{ show, dismiss, success, error, info, favorite }}>
      {children}
      {/* Render toasts inside the phone shell via portal-like stack */}
      <div className={styles.toastStack} aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[`toast_${t.variant}`]}`}
            role="status"
            onClick={() => dismiss(t.id)}
          >
            <span className={styles.toastIcon}>{ICONS[t.variant]}</span>
            <span className={styles.toastMsg}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const ICONS = {
  success:  '✓',
  error:    '✕',
  info:     'ℹ',
  favorite: '♥',
}

/** Hook to consume toast context */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
