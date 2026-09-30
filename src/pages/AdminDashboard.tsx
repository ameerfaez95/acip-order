import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, type Order } from '../lib/supabase'
import { signOut } from '../lib/auth'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { statusTone } from '../components/badgeTone'
import Modal from '../components/Modal'
import { SkeletonRow } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { IconLogout, IconBox, IconAlert } from '../components/icons'
import '../Admin.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        setError(error.message)
      } else {
        setOrders(data || [])
      }
      setLoading(false)
    }

    fetchOrders()
  }, [])

  async function refetchOrders() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      setError(error.message)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
    showToast('Anda telah log keluar', 'info')
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="orders-table-container">
          <table className="orders-table">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={8} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="admin-error">
          <IconAlert size={28} />
          <p>Gagal memuatkan pesanan: {error}</p>
          <Button variant="primary" onClick={refetchOrders}>
            Cuba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <Button
          variant="danger"
          size="sm"
          icon={<IconLogout size={16} />}
          onClick={() => setLogoutOpen(true)}
        >
          Logout
        </Button>
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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  <IconBox size={48} />
                  <p>Belum ada pesanan</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order Code"><strong>{order.order_code}</strong></td>
                  <td data-label="Customer">{order.customer_name}</td>
                  <td data-label="Phone">{order.phone}</td>
                  <td data-label="Total">RM {order.total.toFixed(2)}</td>
                  <td data-label="Payment">
                    <Badge tone={statusTone(order.payment_status, 'payment')}>
                      {order.payment_status}
                    </Badge>
                  </td>
                  <td data-label="Status">
                    <Badge tone={statusTone(order.order_status, 'order')}>
                      {order.order_status}
                    </Badge>
                  </td>
                  <td data-label="Date">{new Date(order.created_at).toLocaleString('ms-MY')}</td>
                  <td data-label="Actions">
                    <Link to={`/admin/order/${order.id}`} className="btn-view">View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={logoutOpen}
        title="Log keluar?"
        message="Anda perlu log masuk semula untuk mengurus pesanan."
        confirmLabel="Log keluar"
        confirmVariant="danger"
        onConfirm={handleSignOut}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  )
}