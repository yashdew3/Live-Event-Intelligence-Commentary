import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function PostEventReport() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return
    Promise.all([
      api.get(`/events/${eventId}`),
      api.get(`/reports/${eventId}`).catch(() => null),
    ]).then(([evRes, repRes]) => {
      setEvent(evRes.data)
      if (repRes) setReport(repRes.data)
    }).finally(() => setLoading(false))
  }, [eventId])

  const cardStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }

  if (loading) return <div style={{ color: 'var(--color-text-muted)', padding: '3rem' }}>Loading...</div>

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(`/events/${eventId}/live`)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>← Back to Live</button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>Post-Event Report</h1>
        {event && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{event.home_team} vs {event.away_team} · Final: {event.home_score}–{event.away_score}</p>}
      </div>

      {!report ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
          <p>Report is generated when the event status becomes Final.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Current status: <strong style={{ color: event?.status === 'Final' ? 'var(--color-success)' : 'var(--color-warning)' }}>{event?.status}</strong></p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>WINNER</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }}>{report.winning_team}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>PREDICTION ACCURACY</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{Math.round((report.prediction_accuracy_score || 0) * 100)}%</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>MATCH RATING</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{report.match_rating}/10</div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>MATCH NARRATIVE</div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{report.narrative_summary}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>TOP 5 KEY MOMENTS</div>
              {(report.top_5_key_moments || []).map((m: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{i + 1}.</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
            {report.model_performance && (
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>MODEL PERFORMANCE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[['Groq / Llama 3.1', report.model_performance.groq_accuracy, '#ff6b35'], ['Gemini 2.5 Flash', report.model_performance.gemini_accuracy, 'var(--color-accent)']].map(([name, acc, color]) => (
                    <div key={name as string}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                        <span>{name as string}</span><span style={{ color: color as string, fontFamily: 'var(--font-mono)' }}>{Math.round((acc as number) * 100)}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${(acc as number) * 100}%`, background: color as string, borderRadius: '2px' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                    Better model: <strong style={{ color: 'var(--color-accent)' }}>{report.model_performance.better_model}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}