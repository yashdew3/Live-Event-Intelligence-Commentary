import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [failedJobs, setFailedJobs] = useState<any[]>([])
  const { isAnalyst } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAnalyst()) { navigate('/events'); return }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, failedRes] = await Promise.all([api.get('/admin/stats'), api.get('/admin/failed-jobs')])
      setStats(statsRes.data)
      setFailedJobs(failedRes.data.failed_jobs || [])
    } catch {}
  }

  const retryJob = async (jobId: string, queueName: string) => {
    try {
      await api.post(`/admin/jobs/${jobId}/retry?queue_name=${queueName}`)
      toast.success('Job retried!')
      fetchData()
    } catch { toast.error('Retry failed') }
  }

  const cardStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem' }

  const statCards = stats ? [
    { label: 'TOTAL EVENTS', value: stats.total_events, color: 'var(--color-accent)' },
    { label: 'LIVE NOW', value: stats.live_events, color: 'var(--color-success)' },
    { label: 'TOTAL USERS', value: stats.total_users, color: 'var(--color-warning)' },
    { label: 'AI COMMENTARY', value: stats.total_commentary, color: '#ff6b35' },
    { label: 'ANALYSES', value: stats.total_analyses, color: 'var(--color-accent)' },
    { label: 'ALERTS FIRED', value: stats.total_alerts_fired, color: 'var(--color-danger)' },
    { label: 'REPORTS', value: stats.total_reports, color: 'var(--color-success)' },
  ] : []

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>System health, queue monitoring, and failed job management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={cardStyle}>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Bull Board — Queue Monitor</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>View all queues, job statuses, and retry failed jobs visually.</p>
          <a href="http://localhost:3001/admin/queues" target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '0.6rem 1.5rem', background: 'var(--color-accent)', color: '#000', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
            Open Bull Board ↗
          </a>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>WebSocket Connections</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>VISIT</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>/ws/stats for live counts</div>
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem' }}>Failed Jobs ({failedJobs.length})</h3>
          <button onClick={fetchData} style={{ fontSize: '0.75rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Refresh</button>
        </div>
        {failedJobs.length === 0 ? (
          <div style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>✓ No failed jobs</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Queue', 'Job Name', 'Error', 'Retries', 'Last Attempt', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {failedJobs.map((job) => (
                  <tr key={job.job_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{job.queue_name}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>{job.name}</td>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--color-danger)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.error_message}</td>
                    <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)' }}>{job.retry_count}</td>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{job.last_attempted ? new Date(job.last_attempted).toLocaleTimeString() : '—'}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>
                      <button onClick={() => retryJob(job.job_id, job.queue_name)} style={{ padding: '0.25rem 0.75rem', background: 'rgba(0,212,255,0.1)', border: '1px solid var(--color-accent)', borderRadius: '4px', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.75rem' }}>
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}