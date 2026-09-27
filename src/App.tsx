import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, type Product } from './lib/supabase'
import { getSession, onAuthStateChange } from './lib/auth'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrderDetail from './pages/AdminOrderDetail'
import './App.css'

type Page = 'menu' | 'checkout' | 'payment' | 'success'

function generateOrderCode(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ACIP-${date}-${random}`
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession().then((session) => {
      setSession(session)
      setLoading(false)
    })

    const unsubscribe = onAuthStateChange((session) => {
      setSession(session)
    })

    return unsubscribe
  }, [])

  if (loading) {
    return <div className="admin-loading">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}

function CustomerApp() {
  const [menu, setMenu] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<Record<number, number>>({})
  const [page, setPage] = useState<Page>('menu')
  const [orderData, setOrderData] = useState<{
    orderCode: string
    customerName: string
    phone: string
    remarks: string
    total: number
  } | null>(null)

  useEffect(() => {
    async function fetchMenu() {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setMenu(data || [])
      }
      
      setLoading(false)
    }

    fetchMenu()
  }, [])

  const addToCart = (productId: number) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }))
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0
      if (currentQty <= 1) {
        const { [productId]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [productId]: currentQty - 1 }
    })
  }

  const getQty = (productId: number) => cart[productId] || 0

  const totalPrice = menu.reduce((sum, item) => {
    const qty = cart[item.id] || 0
    return sum + (item.price * qty)
  }, 0)

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  async function createOrder(name: string, phone: string, remarks: string) {
    try {
      setLoading(true)
      const orderCode = generateOrderCode()
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_name: name,
          phone: phone,
          remarks: remarks || null,
          total: totalPrice,
          payment_status: 'unpaid',
          order_status: 'new'
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = menu
        .filter(item => cart[item.id] && cart[item.id] > 0)
        .map(item => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          qty: cart[item.id],
          subtotal: item.price * cart[item.id]
        }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      setOrderData({
        orderCode,
        customerName: name,
        phone,
        remarks,
        total: totalPrice
      })

      setPage('payment')
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      alert('Error creating order: ' + err.message)
    }
  }

  return (
    <div className="container">
      <h1>Acip Order</h1>

      {page === 'menu' && (
        <>
          {loading && <p>Sedang load menu...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          
          {!loading && !error && (
            <>
              <div className="menu-grid">
                {menu.map((item) => {
                  const qty = getQty(item.id)
                  
                  return (
                    <div key={item.id} className="menu-card">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="menu-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <h3>{item.name}</h3>
                      <p className="price">RM {item.price.toFixed(2)}</p>
                      
                      <div className="qty-controls">
                        {qty > 0 ? (
                          <>
                            <button className="btn-qty" onClick={() => removeFromCart(item.id)}>-</button>
                            <span className="qty-display">{qty}</span>
                            <button className="btn-qty" onClick={() => addToCart(item.id)}>+</button>
                          </>
                        ) : (
                          <button className="btn-add" onClick={() => addToCart(item.id)}>Tambah</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="cart-summary">
                <div className="cart-total">
                  <span>{totalItems} item</span>
                  <strong>RM {totalPrice.toFixed(2)}</strong>
                </div>
                <button 
                  className="btn-checkout" 
                  disabled={totalItems === 0}
                  onClick={() => setPage('checkout')}
                >
                  Teruskan ke Pembayaran
                </button>
              </div>
            </>
          )}
        </>
      )}

      {page === 'checkout' && (
        <CheckoutPage 
          cart={cart}
          menu={menu}
          totalPrice={totalPrice}
          onBack={() => setPage('menu')}
          onSubmit={createOrder}
          loading={loading}
        />
      )}

      {page === 'payment' && orderData && (
        <PaymentPage 
          orderData={orderData}
          onSuccess={() => setPage('success')}
        />
      )}

      {page === 'success' && orderData && (
        <SuccessPage orderData={orderData} />
      )}
    </div>
  )
}

function CheckoutPage({ 
  cart, 
  menu, 
  totalPrice, 
  onBack, 
  onSubmit,
  loading 
}: { 
  cart: Record<number, number>
  menu: Product[]
  totalPrice: number
  onBack: () => void
  onSubmit: (name: string, phone: string, remarks: string) => void
  loading: boolean
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [remarks, setRemarks] = useState('')

  const cartItems = menu.filter(item => cart[item.id] && cart[item.id] > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(name, phone, remarks)
  }

  return (
    <div className="page-content">
      <h2>Maklumat Pesanan</h2>

      <div className="cart-review">
        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <span>{item.name} x {cart[item.id]}</span>
            <span>RM {(item.price * cart[item.id]).toFixed(2)}</span>
          </div>
        ))}
        <div className="cart-item total">
          <strong>Jumlah</strong>
          <strong>RM {totalPrice.toFixed(2)}</strong>
        </div>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <label>
          Nama Anda *
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Ahmad"
            required
          />
        </label>

        <label>
          No. Telefon *
          <input 
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contoh: 0123456789"
            required
          />
        </label>

        <label>
          Remarks (Pilihan)
          <textarea 
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Contoh: Ambil pukul 6 petang"
            rows={3}
          />
        </label>

        <div className="form-actions">
          <button type="button" className="btn-back" onClick={onBack}>Kembali</button>
          <button type="submit" className="btn-checkout" disabled={loading}>
            {loading ? 'Sedang proses...' : 'Buat Pesanan'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PaymentPage({ 
  orderData, 
  onSuccess 
}: { 
  orderData: {
    orderCode: string
    customerName: string
    phone: string
    remarks: string
    total: number
  }
  onSuccess: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${orderData.orderCode}-${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          receipt_url: publicUrl,
          payment_status: 'pending_verification'
        })
        .eq('order_code', orderData.orderCode)

      if (updateError) throw updateError

      setUploaded(true)
    } catch (err: any) {
      alert('Error uploading receipt: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page-content">
      <h2>Pembayaran</h2>
      
      <div className="payment-info">
        <p><strong>Order Code:</strong> {orderData.orderCode}</p>
        <p><strong>Jumlah:</strong> RM {orderData.total.toFixed(2)}</p>
      </div>

      <div className="qr-container">
        <img src="/qr.jpg" alt="QR Code Payment" className="qr-image" />
        <p className="qr-hint">Scan QR code di atas untuk membuat pembayaran</p>
      </div>

      <div className="upload-section">
        <h3>Muat Naik Bukti Pembayaran</h3>
        <p className="upload-hint">Sila muat naik screenshot atau gambar resit pembayaran anda (JPG/PNG/PDF)</p>
        
        <input 
          type="file" 
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleUpload}
          disabled={uploading || uploaded}
          className="file-input"
        />

        {uploading && <p className="uploading">Sedang upload...</p>}
        
        {uploaded && (
          <div className="upload-success">
            <p>✓ Resit berjaya dimuat naik!</p>
            <button className="btn-checkout" onClick={onSuccess}>
              Selesai
            </button>
          </div>
        )}
      </div>

      <div className="payment-note">
        <p><strong>Nota:</strong> Selepas muat naik resit, pesanan anda akan disemak oleh admin. Anda akan dihubungi melalui WhatsApp untuk pengesahan.</p>
      </div>
    </div>
  )
}

function SuccessPage({ 
  orderData 
}: { 
  orderData: {
    orderCode: string
    customerName: string
    phone: string
    total: number
  }
}) {
  const whatsappNumber = '60184003889'
  const whatsappMessage = encodeURIComponent(
    `Hi, saya ${orderData.customerName} telah membuat pesanan.\n\nOrder Code: ${orderData.orderCode}\nJumlah: RM ${orderData.total.toFixed(2)}\n\nSaya telah muat naik bukti pembayaran. Sila semak. Terima kasih!`
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="page-content success-page">
      <div className="success-icon">✓</div>
      <h2>Pesanan Diterima!</h2>
      <p>Terima kasih, {orderData.customerName}!</p>
      <p>Order code anda: <strong>{orderData.orderCode}</strong></p>
      
      <div className="success-actions">
        <a 
          href={whatsappUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-whatsapp"
        >
          Hantar Notifikasi WhatsApp
        </a>
      </div>

      <p className="success-note">
        Klik butang di atas untuk hantar notifikasi terus ke WhatsApp kami. 
        Kami akan sahkan pembayaran dan hubungi anda bila pesanan sedia untuk pickup.
      </p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<CustomerApp />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin onLoginSuccess={() => window.location.href = '/admin'} />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/order/:id" 
          element={
            <ProtectedRoute>
              <AdminOrderDetail />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App