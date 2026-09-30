/* ============================================
   ACIP ORDER — STATUS TONE HELPER
   Peta status → tone warna badge.
   ============================================ */

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'

const paymentTone: Record<string, BadgeTone> = {
  unpaid: 'danger',
  pending_verification: 'warning',
  verified: 'success',
  rejected: 'danger',
}

const orderTone: Record<string, BadgeTone> = {
  new: 'info',
  preparing: 'warning',
  ready_for_pickup: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}

/** Dapatkan tone yang betul untuk status pembayaran / pesanan */
export function statusTone(
  status: string,
  type: 'payment' | 'order'
): BadgeTone {
  const map = type === 'payment' ? paymentTone : orderTone
  return map[status] || 'neutral'
}
