/* ============================================
   ACIP ORDER — SKELETON LOADING
   Placeholder berdenyut semasa memuatkan data.
   ============================================ */

type SkeletonProps = {
  width?: string
  height?: string
  radius?: string
  className?: string
}

export function Skeleton({
  width = '100%',
  height = '16px',
  radius = 'var(--radius-sm)',
  className = '',
}: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

/** Skeleton untuk satu kad menu */
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height="180px" radius="var(--radius-md)" />
      <Skeleton width="70%" height="20px" />
      <Skeleton width="40%" height="16px" />
      <Skeleton height="42px" radius="var(--radius-md)" />
    </div>
  )
}

/** Skeleton untuk satu baris table admin */
export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="skeleton-row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <Skeleton height="16px" />
        </td>
      ))}
    </tr>
  )
}
