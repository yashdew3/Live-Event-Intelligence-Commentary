import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react'

interface Prediction {
  prediction: string | null
  confidence: number | null
  model: string
  generated_at: string | null
  trend?: string
}

interface EventPrediction {
  event_id: string
  groq: Prediction | null
  gemini: Prediction | null
}

interface ModelAccuracy {
  groq: { total: number; correct: number; accuracy: number }
  gemini: { total: number; correct: number; accuracy: number }
  better_model: string
  events_analyzed: number
}

const trendIcon = (trend?: string) => {
  if (trend === 'momentum') return <TrendingUp size={12} style={{ color: 'var(--color-success)' }} />
  if (trend === 'reversal') return <TrendingDown size={12} style={{ color: 'var(--color-danger)' }} />
  return <Minus size={12} style={{ color: 'var(--color-warning)' }} />
}

export default function PredictionBoard() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [predictions, setPredictions] = useState<Record<string, EventPrediction>>({})
  const [accuracy, setAccuracy] = useState<ModelAccuracy | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [meRes, accuracyRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/events/predictions/model-accuracy').catch(() => null),
      ])

      const subs: string[] = meRes.data.subscriptions || []
      if (accuracyRes) setAccuracy(accuracyRes.data)

      const eventPromises = subs.map(id =>
        api.get(`/events/${id}`).then(r => r.data).catch(() => null)
      )
      const events = (await Promise.all(eventPromises)).filter(Boolean)
      setSubscriptions(events)

      const predPromises = subs.map(id =>
        api.get(`/events/${id}/predictions`).then(r => r.data).catch(() => null)
      )
      const preds = await Promise.all(predPromises)
      const predMap: Record<string, EventPrediction> = {}
      preds.forEach(p => { if (p) predMap[p.event_id] = p })
      setPredictions(predMap)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '1.25rem',
  }

  const confidenceBar = (confidence: number | null, color: string) => (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Confidence</span>
        <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          {confidence !== null ? `${Math.round(confidence * 100)}%` : 'N/A'}
        </span>
      </div>
      <div style={{ height: '3px', background: 'var(--color-border)', borderRadius: '2px' }}>
        <div style={{
          height: '100%',
          width: `${(confidence || 0) * 100}%`,
          background: color,
          borderRadius: '2px',
          transition: 'width 0.5s',
        }} />
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Prediction Board</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Multi-model debate — Groq vs Gemini predictions side by side
        </p>
      </div>

      {accuracy && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ ...cardStyle, borderLeft: '3px solid #ff6b35' }}>
            <div style={{ fontSize: '0.65rem', color: '#ff6b35', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              GROQ / LLAMA 3.1 — ACCURACY
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ff6b35' }}>
              {Math.round(accuracy.groq.accuracy * 100)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              {accuracy.groq.correct}/{accuracy.groq.total} correct
            </div>
          </div>

          <div style={{ ...cardStyle, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={20} style={{ color: accuracy.better_model === 'tie' ? 'var(--color-warning)' : accuracy.better_model === 'groq' ? '#ff6b35' : 'var(--color-accent)', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>BETTER MODEL</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: accuracy.better_model === 'tie' ? 'var(--color-warning)' : accuracy.better_model === 'groq' ? '#ff6b35' : 'var(--color-accent)' }}>
              {accuracy.better_model === 'tie' ? 'Tied' : accuracy.better_model === 'groq' ? 'Groq' : 'Gemini'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{accuracy.events_analyzed} events analyzed</div>
          </div>

          <div style={{ ...cardStyle, borderLeft: '3px solid var(--color-accent)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              GEMINI 2.5 FLASH — ACCURACY
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
              {Math.round(accuracy.gemini.accuracy * 100)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              {accuracy.gemini.correct}/{accuracy.gemini.total} correct
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '3rem' }}>Loading predictions...</div>
      ) : subscriptions.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <p>Subscribe to events to see AI debate predictions here.</p>
          <button onClick={() => navigate('/events')} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'var(--color-accent)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            Browse Events
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {subscriptions.map(event => {
            const pred = predictions[event.event_id]
            return (
              <div key={event.event_id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {event.home_team} vs {event.away_team}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {event.sport} · {event.league} · Score: {event.home_score}–{event.away_score}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.65rem',
                      background: event.status === 'Live' ? 'rgba(0,230,118,0.15)' : event.status === 'Final' ? 'rgba(107,122,153,0.2)' : 'rgba(255,171,0,0.15)',
                      color: event.status === 'Live' ? 'var(--color-success)' : event.status === 'Final' ? 'var(--color-text-muted)' : 'var(--color-warning)',
                    }}>{event.status}</span>
                    <button onClick={() => navigate(`/events/${event.event_id}/live`)} style={{ fontSize: '0.75rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Watch →
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{
                    background: 'var(--color-surface-2)', borderRadius: '10px',
                    padding: '1rem', borderLeft: '3px solid #ff6b35',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', color: '#ff6b35', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        ⚡ GROQ / LLAMA 3.1
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {pred?.groq?.generated_at ? new Date(pred.groq.generated_at).toLocaleTimeString() : ''}
                      </div>
                    </div>
                    {pred?.groq ? (
                      <>
                        <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
                          {pred.groq.prediction}
                        </p>
                        {confidenceBar(pred.groq.confidence, '#ff6b35')}
                      </>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Waiting for Groq commentary pipeline to run...
                      </p>
                    )}
                  </div>

                  <div style={{
                    background: 'var(--color-surface-2)', borderRadius: '10px',
                    padding: '1rem', borderLeft: '3px solid var(--color-accent)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        🤖 GEMINI 2.5 FLASH
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {pred?.gemini?.trend && trendIcon(pred.gemini.trend)}
                        {pred?.gemini?.generated_at ? new Date(pred.gemini.generated_at).toLocaleTimeString() : ''}
                      </div>
                    </div>
                    {pred?.gemini ? (
                      <>
                        <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
                          {pred.gemini.prediction}
                        </p>
                        {pred.gemini.trend && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            {trendIcon(pred.gemini.trend)}
                            Trend: {pred.gemini.trend}
                          </div>
                        )}
                        {confidenceBar(pred.gemini.confidence, 'var(--color-accent)')}
                      </>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Waiting for Gemini analysis (runs every 5 min)...
                      </p>
                    )}
                  </div>
                </div>

                {pred?.groq && pred?.gemini && (
                  <div style={{ marginTop: '0.75rem', padding: '0.65rem', background: 'rgba(0,212,255,0.05)', borderRadius: '6px', border: '1px solid rgba(0,212,255,0.1)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      <strong style={{ color: 'var(--color-text)' }}>Debate summary: </strong>
                      {pred.groq.confidence !== null && pred.gemini.confidence !== null ? (
                        pred.groq.confidence > pred.gemini.confidence
                          ? `Groq is more confident (${Math.round(pred.groq.confidence * 100)}% vs ${Math.round(pred.gemini.confidence * 100)}%)`
                          : pred.gemini.confidence > pred.groq.confidence
                          ? `Gemini is more confident (${Math.round(pred.gemini.confidence * 100)}% vs ${Math.round(pred.groq.confidence * 100)}%)`
                          : `Both models equally confident at ${Math.round(pred.groq.confidence * 100)}%`
                      ) : 'Predictions generating...'}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}