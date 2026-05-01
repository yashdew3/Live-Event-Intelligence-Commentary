import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import PipelineStepper from '../components/PipelineStepper'
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react'

interface CommentaryItem { commentary: string; timestamp: string }
interface EventData {
  event_id: string; sport: string; home_team: string; away_team: string
  home_score: number; away_score: number; status: string; venue: string
  league: string; updates: string[]
}

export default function LiveEvent() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventData | null>(null)
  const [commentary, setCommentary] = useState<CommentaryItem[]>([])
  const [updates, setUpdates] = useState<string[]>([])
  const commentaryRef = useRef<HTMLDivElement>(null)
  const { messages, isConnected } = useWebSocket(eventId || null)

  useEffect(() => {
    if (!eventId) return
    api.get(`/events/${eventId}`).then(r => {
      setEvent(r.data)
      setUpdates(r.data.updates || [])
    }).catch(() => navigate('/events'))
  }, [eventId])

  useEffect(() => {
    messages.forEach(msg => {
      if (msg.type === 'commentary') {
        setCommentary(prev => [{ commentary: msg.commentary as string, timestamp: msg.timestamp as string }, ...prev].slice(0, 50))
      }
      if (msg.type === 'catchup' && msg.commentary) {
        setCommentary(msg.commentary as CommentaryItem[])
      }
    })
  }, [messages])

  const cardStyle = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem',
  }

  if (!event) return <div style={{ color: 'var(--color-text-muted)', padding: '3rem' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/events')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isConnected
            ? <><Wifi size={14} style={{ color: 'var(--color-success)' }} /><span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Live</span></>
            : <><WifiOff size={14} style={{ color: 'var(--color-danger)' }} /><span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Reconnecting...</span></>
          }
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <Link to={`/events/${eventId}/analysis`} style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textDecoration: 'none' }}>AI Analysis →</Link>
          <Link to={`/events/${eventId}/report`} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>Report →</Link>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
          {event.sport.toUpperCase()} · {event.league} · {event.venue}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{event.home_team}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>
            {event.home_score} — {event.away_score}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{event.away_team}</div>
        </div>
        <div style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', background: event.status === 'Live' ? 'rgba(0,230,118,0.15)' : 'rgba(107,122,153,0.15)', color: event.status === 'Live' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          {event.status}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: '1rem' }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Event Feed</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {updates.map((u, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-text)', padding: '0.5rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: '6px', borderLeft: '2px solid var(--color-border)' }}>
                {u}
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle} ref={commentaryRef}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--color-accent)', marginBottom: '1rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>⚡ AI Commentary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {commentary.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Waiting for commentary...</div>
            ) : commentary.map((c, i) => (
              <div key={i} style={{
                fontSize: '0.85rem', padding: '0.65rem 0.75rem',
                background: i === 0 ? 'rgba(0,212,255,0.08)' : 'var(--color-surface-2)',
                borderRadius: '8px', borderLeft: `2px solid ${i === 0 ? 'var(--color-accent)' : 'var(--color-border)'}`,
                transition: 'all 0.3s',
              }}>
                <div>{c.commentary}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  {c.timestamp ? new Date(c.timestamp).toLocaleTimeString() : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Pipeline</h3>
          <PipelineStepper eventId={eventId!} />
        </div>
      </div>
    </div>
  )
}