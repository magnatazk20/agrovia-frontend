import { useEffect } from 'react'
import './FloatingToast.css'

type ToastType = 'success' | 'error'

type FloatingToastProps = {
  open: boolean
  type: ToastType
  message: string
  onClose: () => void
  duration?: number
}

export default function FloatingToast({
  open,
  type,
  message,
  onClose,
  duration = 3500,
}: FloatingToastProps) {
  useEffect(() => {
    if (!open) return
    const timeoutId = window.setTimeout(() => {
      onClose()
    }, duration)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [open, duration, onClose])

  if (!open || !message) return null

  return (
    <div className="floating-toast-wrap" role="status" aria-live="polite">
      <div className={`floating-toast floating-toast-${type}`}>
        <span className="floating-toast-dot" aria-hidden="true" />
        <p>{message}</p>
        <button type="button" className="floating-toast-close" onClick={onClose} aria-label="Fechar aviso">
          ×
        </button>
      </div>
    </div>
  )
}
