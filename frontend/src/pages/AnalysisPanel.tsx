import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Analysis {
  updated_summary: string
  key_moments: string[]
  trend: 'momentum' | 'stable' | 'reversal'
  prediction: string
  confidence: number
  created_at: string
}

const trendConfig = {
  momentum: { icon: <TrendingUp size={16} />, color: 'var(--color-success)', label: 'Momentum' },
  stable: { icon: <Minus size={16} />, color: 'var(--color-warning)', label: 'Stable' },
  reversal: { icon: <TrendingDown size={16} />, color: 'var(--color-danger)', label: 'Reversal' },
}

export default function AnalysisPanel() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [event, setEvent] = useState<any>(null)

  useEffect(() => {
    if (!eventId) return
    api.get(`/events/${eventId}`).then(r => setEvent(r.data))
    fetchLatestAnalysis()
    const interval = setInterval(fetchLatestAnalysis, 30000)
    return () => clearInterval(interval)
  }, [eventId])

  const fetchLatestAnalysis = async () => {
    try {
      const res = await api.get(`/events/${eventId}/stages`)
      const geminiDone = res.data.find((s: any) => s.stage_number === 4 && s.status === 'done')
      if (geminiDone) {
        const analysisRes = await api.get(`/events/${eventId}/analysis`)
        setAnalysis(analysisRes.data)
      }
    } catch {}
  }

  const cardStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(`/events/${eventId}/live`)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>← Back to Live</button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>AI Analysis</h1>
        {event && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{event.home_team} vs {event.away_team}</p>}
      </div>

      {!analysis ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
          <p>Gemini analysis runs every 5 minutes. Check back soon.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>TREND</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: trendConfig[analysis.trend].color, fontWeight: 700, fontSize: '1.1rem' }}>
                {trendConfig[analysis.trend].icon}
                {trendConfig[analysis.trend].label}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>CONFIDENCE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                {Math.round(analysis.confidence * 100)}%
              </div>
              <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px', marginTop: '0.5rem' }}>
                <div style={{ height: '100%', width: `${analysis.confidence * 100}%`, background: 'var(--color-accent)', borderRadius: '2px', transition: 'width 0.5s' }} />
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>LAST UPDATED</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
                {new Date(analysis.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>MATCH SUMMARY</div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{analysis.updated_summary}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>KEY MOMENTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analysis.key_moments.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>GEMINI PREDICTION</div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{analysis.prediction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}