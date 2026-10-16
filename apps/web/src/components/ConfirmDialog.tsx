import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

/** Native modal dialog: inert background, Escape cancels. Cancel gets focus; the trigger gets it back. */
export function ConfirmDialog({ open, title, children, confirmLabel, onConfirm, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      returnTo.current = document.activeElement as HTMLElement | null
      setError(null)
      d.showModal()
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])

  const handleClose = () => {
    onClose()
    returnTo.current?.focus()
  }

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      ref.current?.close()
    } catch (e) {
      setError(`That did not work: ${e instanceof Error ? e.message : 'unknown error'}. Nothing was changed.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onClose={handleClose}>
      <h2 id="dialog-title" className="dialog__title">
        {title}
      </h2>
      <div className="dialog__body">{children}</div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog__actions">
        <button type="button" className="btn" autoFocus onClick={() => ref.current?.close()}>
          Cancel
        </button>
        <button type="button" className="btn btn--danger" onClick={confirm} disabled={busy} aria-busy={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
