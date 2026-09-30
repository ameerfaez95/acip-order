/* ============================================
   ACIP ORDER — BADGE COMPONENT
   Label status berwarna (ganti getStatusBadge).
   ============================================ */

import type { BadgeTone } from './badgeTone'

type BadgeProps = {
  tone?: BadgeTone
  children: string
}

export default function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`}>
      {children.replaceAll('_', ' ').toUpperCase()}
    </span>
  )
}
