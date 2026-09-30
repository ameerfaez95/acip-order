import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../Admin.css'

// Tukar no. telefon kepada format WhatsApp (cth: "012-345 6789" -> "60123456789")
function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('60')) return digits
  if (digits.startsWith('0')) return `60${digits.slice(1)}`
  return `60${digits}`
}

// Semak sama ada resit adalah fail PDF
function isPdf(url: string): boolean {
  return url.toLowerCase().split('?')[0].endsWith('.pdf')
}

interface OrderItem {
  id: number
  product_name: string
  price: number
  qty: number
  subtotal: number
}

interface Order {
  id: number
  order_code: string
  customer_name: string
  phone: string
  remarks: string | null
  total: number
  payment_status: string
  order_status: string
  receipt_url: string | null
  created_at: string
  items: OrderItem[]
}

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

  async function fetchOrder() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
    } else {
      setOrder(data)
    }
    setLoading(false)
  }

  async function updatePaymentStatus(status: string) {
    if (!order) return
    setUpdating(true)
    
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', order.id)

    if (error) {
      console.error('Error updating payment status:', error)
      alert('Failed to update payment status')
    } else {
      setOrder({ ...order, payment_status: status })
    }
    
    setUpdating(false)
  }

  async function updateOrderStatus(status: string) {
    if (!order) return
    setUpdating(true)
    
    const { error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', order.id)

    if (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    } else {
      setOrder({ ...order, order_status: status })
    }
    
    setUpdating(false)
  }

  if (loading) {
    return <div className="admin-loading">Loading order...</div>
  }

  if (!order) {
    return <div className="admin-loading">Order not found</div>
  }

  const whatsappMessage = encodeURIComponent(
    `Hi ${order.customer_name}, pesanan anda ${order.order_code} telah disahkan. Sila datang pickup pada waktu yang ditetapkan. Terima kasih!`
  )
  const whatsappUrl = `https://wa.me/${formatPhoneForWhatsApp(order.phone)}?text=${whatsappMessage}`
  const receiptIsPdf = order.receipt_url ? isPdf(order.receipt_url) : false

  return (
    <div className="admin-order-detail">
      <button onClick={() => navigate('/admin')} className="btn-back">
        ← Back to Dashboard
      </button>

      <div className="order-header">
        <h1>Order {order.order_code}</h1>
        <p>Created: {new Date(order.created_at).toLocaleString('ms-MY')}</p>
      </div>

      <div className="order-grid">
        <div className="order-info-card">
          <h2>Customer Information</h2>
          <p><strong>Name:</strong> {order.customer_name}</p>
          <p><strong>Phone:</strong> {order.phone}</p>
          <p><strong>Remarks:</strong> {order.remarks || '-'}</p>
          
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            WhatsApp Customer
          </a>
        </div>

        <div className="order-info-card">
          <h2>Payment Status</h2>
          <p>Current: <strong>{order.payment_status}</strong></p>
          <p>Total: <strong>RM {order.total.toFixed(2)}</strong></p>
          
          <div className="action-buttons">
            <button 
              onClick={() => updatePaymentStatus('verified')}
              disabled={updating || order.payment_status === 'verified'}
              className="btn-success"
            >
              Verify Payment
            </button>
            <button 
              onClick={() => updatePaymentStatus('rejected')}
              disabled={updating || order.payment_status === 'rejected'}
              className="btn-danger"
            >
              Reject Payment
            </button>
          </div>

          {order.receipt_url && (
            <div className="receipt-preview">
              <h3>Payment Receipt</h3>
              {receiptIsPdf ? (
                <p className="receipt-file-note">Resit dalam format PDF.</p>
              ) : (
                <img
                  src={order.receipt_url}
                  alt="Receipt"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <a
                href={order.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-download"
              >
                {receiptIsPdf ? 'Buka Resit PDF' : 'Lihat Saiz Penuh'}
              </a>
            </div>
          )}
        </div>

        <div className="order-info-card">
          <h2>Order Status</h2>
          <p>Current: <strong>{order.order_status}</strong></p>
          
          <div className="action-buttons">
            <button 
              onClick={() => updateOrderStatus('preparing')}
              disabled={updating}
              className="btn-primary"
            >
              Start Preparing
            </button>
            <button 
              onClick={() => updateOrderStatus('ready_for_pickup')}
              disabled={updating}
              className="btn-success"
            >
              Ready for Pickup
            </button>
            <button 
              onClick={() => updateOrderStatus('completed')}
              disabled={updating}
              className="btn-secondary"
            >
              Completed
            </button>
            <button 
              onClick={() => updateOrderStatus('cancelled')}
              disabled={updating}
              className="btn-danger"
            >
              Cancel Order
            </button>
          </div>
        </div>
      </div>

      <div className="order-items-card">
        <h2>Order Items</h2>
        <table className="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>RM {item.price.toFixed(2)}</td>
                <td>{item.qty}</td>
                <td>RM {item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}><strong>Total</strong></td>
              <td><strong>RM {order.total.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}