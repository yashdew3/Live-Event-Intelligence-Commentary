import { useState, useEffect } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Bell, Trash2 } from 'lucide-react'

export default function AlertManager() {
  const [rules, setRules] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [form, setForm] = useState({ event_id: '', rule_type: 'keyword_detected', keyword: '', threshold: '', description: '' })
  const { isAnalyst } = useAuthStore()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rulesRes, historyRes, eventsRes] = await Promise.all([
        api.get('/alerts/rules'), api.get('/alerts/history'), api.get('/events')
      ])
      setRules(rulesRes.data)
      setHistory(historyRes.data)
      setEvents(eventsRes.data)
    } catch {}
  }

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/alerts/rules', {
        event_id: form.event_id,
        rule_type: form.rule_type,
        keyword: form.rule_type === 'keyword_detected' ? form.keyword : undefined,
        threshold: form.rule_type === 'score_threshold' ? parseFloat(form.threshold) : undefined,
        description: form.description,
      })
      toast.success('Alert rule created!')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create rule')
    }
  }

  const deleteRule = async (id: string) => {
    try {
      await api.delete(`/alerts/rules/${id}`)
      toast.success('Rule deleted')
      fetchData()
    } catch { toast.error('Failed to delete rule') }
  }

  const cardStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }
  const inputStyle = { width: '100%', padding: '0.6rem 0.75rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Alert Manager</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Set custom triggers for real-time notifications</p>
      </div>

      {!isAnalyst() ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Bell size={32} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p>Alert rules require Analyst role.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <div style={cardStyle}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Create Alert Rule</h3>
              <form onSubmit={createRule} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Event</label>
                  <select style={inputStyle} value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })} required>
                    <option value="">Select event...</option>
                    {events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.home_team} vs {ev.away_team}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Rule Type</label>
                  <select style={inputStyle} value={form.rule_type} onChange={e => setForm({ ...form, rule_type: e.target.value })}>
                    <option value="keyword_detected">Keyword Detected</option>
                    <option value="score_threshold">Score Threshold</option>
                    <option value="trend_change">Trend Change</option>
                  </select>
                </div>
                {form.rule_type === 'keyword_detected' && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Keyword</label>
                    <input style={inputStyle} placeholder="e.g. injury, goal, penalty" value={form.keyword} onChange={e => setForm({ ...form, keyword: e.target.value })} />
                  </div>
                )}
                {form.rule_type === 'score_threshold' && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Score Gap Threshold</label>
                    <input style={inputStyle} type="number" placeholder="e.g. 3" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Description (optional)</label>
                  <input style={inputStyle} placeholder="My alert description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <button type="submit" style={{ padding: '0.65rem', background: 'var(--color-accent)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, marginTop: '0.25rem' }}>
                  Create Rule
                </button>
              </form>
            </div>

            <div style={{ ...cardStyle, marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Active Rules ({rules.length}/5)</h3>
              {rules.length === 0 ? <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No rules yet</div> : rules.map(rule => (
                <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: 'var(--color-surface-2)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{rule.rule_type.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{rule.keyword || rule.threshold || 'Trend change'}</div>
                  </div>
                  <button onClick={() => deleteRule(rule.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Alert History</h3>
            {history.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No alerts fired yet. Rules are evaluated after each Gemini analysis.</div>
            ) : history.map(alert => (
              <div key={alert.id} style={{ padding: '0.75rem', background: 'rgba(255,171,0,0.08)', border: '1px solid rgba(255,171,0,0.2)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-warning)' }}>{alert.rule_type.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{alert.matched_value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>{new Date(alert.triggered_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}