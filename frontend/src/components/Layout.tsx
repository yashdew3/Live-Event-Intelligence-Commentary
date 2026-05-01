import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  Activity, BarChart2, Bell, FileText,
  Layout as LayoutIcon, LogOut, Radio, Shield
} from 'lucide-react'

export default function Layout() {
  const { user, clearAuth, isAnalyst } = useAuthStore()
  const navigate = useNavigate()

  const logout = () => {
    clearAuth()
    navigate('/login')
  }

  const navItems = [
    { to: '/events', icon: <Radio size={18} />, label: 'Events' },
    { to: '/predictions', icon: <BarChart2 size={18} />, label: 'Predictions' },
    { to: '/alerts', icon: <Bell size={18} />, label: 'Alerts', analystOnly: true },
    ...(isAnalyst() ? [{ to: '/admin', icon: <Shield size={18} />, label: 'Admin' }] : []),
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <aside style={{
        width: '220px', background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
        position: 'fixed', height: '100vh', zIndex: 10,
      }}>
        <div style={{ padding: '0 1.5rem 2rem' }}>
          <div style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>LIVE INTEL</div>
          <div style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '1.1rem' }}>Platform</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.75rem', borderRadius: '8px',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                transition: 'all 0.2s',
              })}
            >
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{user?.full_name}</div>
          <div style={{
            display: 'inline-block', fontSize: '0.65rem', padding: '0.15rem 0.5rem',
            borderRadius: '999px', marginBottom: '0.75rem',
            background: user?.role === 'analyst' ? 'rgba(0,212,255,0.15)' : 'rgba(107,122,153,0.2)',
            color: user?.role === 'analyst' ? 'var(--color-accent)' : 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>{user?.role}</div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: 'var(--color-text-muted)', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 0,
          }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}