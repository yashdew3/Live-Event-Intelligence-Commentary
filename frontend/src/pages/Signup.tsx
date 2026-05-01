import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function Signup() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'viewer' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/signup', form)
      setAuth(res.data.access_token, res.data.user)
      toast.success('Account created!')
      navigate('/events')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
    borderRadius: '8px', color: 'var(--color-text)', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>LIVE EVENT INTELLIGENCE</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Create Account</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>Full Name</label>
            <input style={inputStyle} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" required />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" required />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>Password</label>
            <input style={inputStyle} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••" required minLength={6} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>Role</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="viewer">Viewer — read-only, max 3 subscriptions</option>
              <option value="analyst">Analyst — full access, unlimited subscriptions</option>
            </select>
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '0.85rem', background: 'var(--color-accent)', color: '#000',
            border: 'none', borderRadius: '8px', fontWeight: 700,
            fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
          }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Have an account? <Link to="/login" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}