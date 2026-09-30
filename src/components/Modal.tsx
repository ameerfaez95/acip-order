/* ============================================
   ACIP ORDER — MODAL COMPONENT
   Dialog pengesahan seragam.
   ============================================ */

import { useEffect, type ReactNode } from 'react'
import Button, { type ButtonVariant } from './Button'

type ModalProps = {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: ButtonVariant
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}

export default function Modal({
  open,
  title,
  message,
  confirmLabel = 'Sahkan',
  cancelLabel = 'Batal',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        {children}
        <div className="modal__actions">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
