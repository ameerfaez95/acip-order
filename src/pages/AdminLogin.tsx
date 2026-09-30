import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../lib/auth'
import Button from '../components/Button'
import { useToast } from '../components/Toast'
import '../Admin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      showToast('Log masuk berjaya')
      navigate('/admin')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login gagal'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <h1>Admin Login</h1>
        <p>Acip Order Management</p>
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@acip.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Login
          </Button>
        </form>
      </div>
    </div>
  )
}