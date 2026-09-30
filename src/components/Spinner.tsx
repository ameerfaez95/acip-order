/* ============================================
   ACIP ORDER — SPINNER COMPONENT
   ============================================ */

type SpinnerProps = {
  size?: number
  label?: string
}

export default function Spinner({ size = 32, label }: SpinnerProps) {
  return (
    <div className="spinner-wrapper" role="status" aria-live="polite">
      <span
        className="spinner"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      {label && <p className="spinner-label">{label}</p>}
    </div>
  )
}
