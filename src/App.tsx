import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase, type Product } from './lib/supabase'
import { getSession, onAuthStateChange } from './lib/auth'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrderDetail from './pages/AdminOrderDetail'
import Navbar from './components/Navbar'
import Button from './components/Button'
import Spinner from './components/Spinner'
import { SkeletonCard } from './components/Skeleton'
import { ToastProvider, useToast } from './components/Toast'
import {
  IconPlus,
  IconMinus,
  IconBox,
  IconArrowLeft,
  IconWhatsApp,
} from './components/icons'
import './App.css'
import './Admin.css'
import './styles/components.css'

type Page = 'menu' | 'checkout' | 'payment' | 'success'

function generateOrderCode(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ACIP-${date}-${random}`
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    getSession().then((session) => {
      setSession(session)
      setLoading(false)
    })

    onAuthStateChange((session) => {
      setSession(session)
    }).then((unsub) => {
      unsubscribe = unsub
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="admin-loading">
        <Spinner size={40} label="Memuatkan..." />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}

function CustomerApp() {
  const { showToast } = useToast()
  const [menu, setMenu] = useState<Product[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(false)
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
      setMenuLoading(true)
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
      
      setMenuLoading(false)
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
        const rest = { ...prev }
        delete rest[productId]
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
      setOrderLoading(true)
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
      setOrderLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ralat tidak diketahui'
      setError(message)
      setOrderLoading(false)
      showToast('Gagal membuat pesanan: ' + message, 'error')
    }
  }

  const handleAdd = (item: Product) => {
    addToCart(item.id)
    showToast(`${item.name} ditambah ke cart`)
  }

  return (
    <div className="container">
      <Navbar cartCount={totalItems} onCartClick={() => {
        if (totalItems > 0) setPage('checkout')
      }} />

      {page === 'menu' && (
        <>
          <section className="hero">
            <h1>Ayam Gunting Acip</h1>
            <p>Segar, rangup & penuh perisa — pesan sekarang!</p>
          </section>

          <div className="section-title">
            <h2>Menu Kami</h2>
          </div>

          {menuLoading && (
            <div className="menu-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {error && !menuLoading && (
            <div className="page-error">
              <p>Gagal memuatkan menu: {error}</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Cuba Lagi
              </Button>
            </div>
          )}

          {!menuLoading && !error && menu.length === 0 && (
            <div className="empty-menu">
              <IconBox size={56} />
              <h3>Tiada menu tersedia</h3>
              <p>Sila cuba sebentar lagi atau hubungi kami.</p>
            </div>
          )}

          {!menuLoading && !error && menu.length > 0 && (
            <>
              <div className="menu-grid fade-in">
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
                      <div className="menu-card__body">
                        <h3>{item.name}</h3>
                        <p className="price">RM {item.price.toFixed(2)}</p>

                        <div className="qty-controls">
                          {qty > 0 ? (
                            <>
                              <button
                                className="btn-qty"
                                onClick={() => removeFromCart(item.id)}
                                aria-label={`Kurang ${item.name}`}
                              >
                                <IconMinus size={18} />
                              </button>
                              <span className="qty-display">{qty}</span>
                              <button
                                className="btn-qty"
                                onClick={() => handleAdd(item)}
                                aria-label={`Tambah ${item.name}`}
                              >
                                <IconPlus size={18} />
                              </button>
                            </>
                          ) : (
                            <Button
                              variant="primary"
                              fullWidth
                              icon={<IconPlus size={18} />}
                              onClick={() => handleAdd(item)}
                            >
                              Tambah
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalItems > 0 && (
                <div className="cart-summary">
                  <div className="cart-total">
                    <span>{totalItems} item</span>
                    <strong>RM {totalPrice.toFixed(2)}</strong>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setPage('checkout')}
                  >
                    Teruskan
                  </Button>
                </div>
              )}
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
          loading={orderLoading}
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
    <div className="page-content fade-in">
      <div className="section-title">
        <h2>Maklumat Pesanan</h2>
      </div>

      <div className="cart-items">
        <h3>Ringkasan Pesanan</h3>
        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <span>{item.name} x {cart[item.id]}</span>
            <span>RM {(item.price * cart[item.id]).toFixed(2)}</span>
          </div>
        ))}
        <div className="cart-item total">
          <span>Jumlah</span>
          <span>RM {totalPrice.toFixed(2)}</span>
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
          <Button
            type="button"
            variant="secondary"
            fullWidth
            icon={<IconArrowLeft size={18} />}
            onClick={onBack}
          >
            Kembali
          </Button>
          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Buat Pesanan
          </Button>
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
  const { showToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${orderData.orderCode}-${Date.now()}.${fileExt}`
      
      // FIXED: Tidak perlu tambah 'receipts/' sebab bucket sudah bernama 'receipts'
      const filePath = fileName

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ralat tidak diketahui'
      showToast('Gagal memuat naik resit: ' + message, 'error')
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

        {uploading && (
          <div className="page-loading">
            <Spinner label="Sedang muat naik..." />
          </div>
        )}
        
        {uploaded && (
          <div className="upload-success">
            <p>✓ Resit berjaya dimuat naik!</p>
            <Button variant="primary" size="lg" onClick={onSuccess}>
              Selesai
            </Button>
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
    <div className="page-content success-page fade-in">
      <div className="success-icon">✓</div>
      <h2>Pesanan Diterima!</h2>
      <p>Terima kasih, {orderData.customerName}!</p>
      <p>Order code anda: <strong>{orderData.orderCode}</strong></p>
      
      <div className="success-actions">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--whatsapp btn--lg"
        >
          <span className="btn__icon"><IconWhatsApp size={20} /></span>
          <span className="btn__label">Hantar Notifikasi WhatsApp</span>
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
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CustomerApp />} />
          <Route path="/admin/login" element={<AdminLogin />} />
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
    </ToastProvider>
  )
}

export default App