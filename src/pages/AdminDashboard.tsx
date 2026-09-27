import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { signOut } from '../lib/auth'
import '../Admin.css'

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
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
    window.location.reload()
  }

  const getStatusBadge = (status: string, type: 'payment' | 'order') => {
    const paymentColors: Record<string, string> = {
      unpaid: '#dc3545',
      pending_verification: '#ffc107',
      verified: '#28a745',
      rejected: '#dc3545',
    }

    const orderColors: Record<string, string> = {
      new: '#007bff',
      preparing: '#ffc107',
      ready_for_pickup: '#28a745',
      completed: '#6c757d',
      cancelled: '#dc3545',
    }

    const colors = type === 'payment' ? paymentColors : orderColors
    const color = colors[status] || '#6c757d'

    return (
      <span className="status-badge" style={{ background: color }}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return <div className="admin-loading">Loading orders...</div>
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleSignOut} className="btn-logout">Logout</button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-number">{orders.length}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Verification</h3>
          <p className="stat-number">
            {orders.filter(o => o.payment_status === 'pending_verification').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-number">
            RM {orders.filter(o => o.payment_status === 'verified').reduce((sum, o) => sum + o.total, 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order Code</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.order_code}</strong></td>
                <td>{order.customer_name}</td>
                <td>{order.phone}</td>
                <td>RM {order.total.toFixed(2)}</td>
                <td>{getStatusBadge(order.payment_status, 'payment')}</td>
                <td>{getStatusBadge(order.order_status, 'order')}</td>
                <td>{new Date(order.created_at).toLocaleString('ms-MY')}</td>
                <td>
                  <a href={`/admin/order/${order.id}`} className="btn-view">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}