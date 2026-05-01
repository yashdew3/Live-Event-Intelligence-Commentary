import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'

interface Event {
  event_id: string
  sport: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  status: string
  venue: string
  league: string
  is_subscribed: boolean
}

const sportFilters = ['All', 'Football', 'Basketball', 'Cricket']

const statusColor: Record<string, string> = {
  Live: 'var(--color-success)',
  Upcoming: 'var(--color-warning)',
  Final: 'var(--color-text-muted)',
}

export default function EventBrowser() {
  const [events, setEvents] = useState<Event[]>([])
  const [filter, setFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchEvents = async () => {
    try {
      const params: Record<string, string> = {}
      if (filter !== 'All') params.sport = filter
      if (statusFilter !== 'All') params.status = statusFilter
      const res = await api.get('/events', { params })
      setEvents(res.data)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [filter, statusFilter])

  const subscribe = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.post(`/events/${eventId}/subscribe`)
      toast.success('Subscribed!')
      fetchEvents()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Subscribe failed')
    }
  }

  const tabStyle = (active: boolean) => ({
    padding: '0.4rem 1rem', borderRadius: '999px', border: 'none',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
    background: active ? 'var(--color-accent)' : 'var(--color-surface)',
    color: active ? '#000' : 'var(--color-text-muted)',
    transition: 'all 0.2s',
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Live Events</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Subscribe to events and watch AI commentary in real time</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {sportFilters.map(s => (
          <button key={s} style={tabStyle(filter === s)} onClick={() => setFilter(s)}>{s}</button>
        ))}
        <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 0.5rem' }} />
        {['All', 'Live', 'Upcoming', 'Final'].map(s => (
          <button key={s} style={tabStyle(statusFilter === s)} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', padding: '3rem', textAlign: 'center' }}>Loading events...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {events.map(event => (
            <div
              key={event.event_id}
              onClick={() => navigate(`/events/${event.event_id}/live`)}
              style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: '12px', padding: '1.25rem', cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {event.sport.toUpperCase()} · {event.league}
                </span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.7rem', color: statusColor[event.status] || 'var(--color-text-muted)',
                }}>
                  {event.status === 'Live' && (
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--color-success)',
                      animation: 'pulse 1.5s infinite',
                    }} />
                  )}
                  {event.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{event.home_team}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '1.25rem',
                  fontWeight: 700, color: 'var(--color-accent)',
                  padding: '0.2rem 0.75rem', background: 'rgba(0,212,255,0.08)', borderRadius: '6px',
                }}>
                  {event.home_score} — {event.away_score}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'right' }}>{event.away_team}</div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{event.venue}</div>

              <button
                onClick={(e) => event.is_subscribed ? (e.stopPropagation(), navigate(`/events/${event.event_id}/live`)) : subscribe(event.event_id, e)}
                style={{
                  width: '100%', padding: '0.5rem',
                  background: event.is_subscribed ? 'rgba(0,230,118,0.1)' : 'rgba(0,212,255,0.1)',
                  border: `1px solid ${event.is_subscribed ? 'var(--color-success)' : 'var(--color-accent)'}`,
                  borderRadius: '6px', color: event.is_subscribed ? 'var(--color-success)' : 'var(--color-accent)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                }}
              >
                {event.is_subscribed ? '✓ Watch Live' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}