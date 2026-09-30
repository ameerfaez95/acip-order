import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: number
  name: string
  slug: string
  price: number
  image_url: string | null
  is_active: boolean
}

export type PaymentStatus =
  | 'unpaid'
  | 'pending_verification'
  | 'verified'
  | 'rejected'

export type OrderStatus =
  | 'new'
  | 'preparing'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'

export type OrderItem = {
  id: number
  product_name: string
  price: number
  qty: number
  subtotal: number
}

export type Order = {
  id: number
  order_code: string
  customer_name: string
  phone: string
  remarks: string | null
  total: number
  payment_status: PaymentStatus
  order_status: OrderStatus
  receipt_url: string | null
  created_at: string
}

export type OrderWithItems = Order & {
  items: OrderItem[]
}