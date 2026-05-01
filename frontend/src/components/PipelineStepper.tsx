import { useState, useEffect } from 'react'
import api from '../api/client'

interface Stage {
  stage_number: number
  stage_name: string
  status: 'pending' | 'active' | 'done' | 'failed'
  started_at: string | null
  completed_at: string | null
}

const stageIcons: Record<string, string> = {
  pending: '○', active: '◉', done: '✓', failed: '✗'
}

const stageColors: Record<string, string> = {
  pending: 'var(--color-text-muted)',
  active: 'var(--color-accent)',
  done: 'var(--color-success)',
  failed: 'var(--color-danger)',
}

const getDuration = (started: string | null, completed: string | null) => {
  if (!started) return null
  const end = completed ? new Date(completed) : new Date()
  const secs = Math.round((end.getTime() - new Date(started).getTime()) / 1000)
  return `${secs}s`
}

export default function PipelineStepper({ eventId }: { eventId: string }) {
  const [stages, setStages] = useState<Stage[]>([])

  const fetchStages = async () => {
    try {
      const res = await api.get(`/events/${eventId}/stages`)
      setStages(res.data)
    } catch {}
  }

  useEffect(() => {
    fetchStages()
    const interval = setInterval(fetchStages, 10000)
    return () => clearInterval(interval)
  }, [eventId])

  if (stages.length === 0) {
    return (
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: '1rem' }}>
        Subscribing to event to activate pipeline...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {stages.map((stage, idx) => (
        <div key={stage.stage_number} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
              background: stage.status === 'active' ? 'rgba(0,212,255,0.15)' :
                stage.status === 'done' ? 'rgba(0,230,118,0.15)' :
                stage.status === 'failed' ? 'rgba(255,23,68,0.15)' : 'rgba(107,122,153,0.1)',
              color: stageColors[stage.status],
              border: `2px solid ${stage.status === 'active' ? 'var(--color-accent)' : 'transparent'}`,
              boxShadow: stage.status === 'active' ? '0 0 12px rgba(0,212,255,0.4)' : 'none',
              animation: stage.status === 'active' ? 'stagePulse 2s infinite' : 'none',
            }}>
              {stageIcons[stage.status]}
            </div>
            {idx < stages.length - 1 && (
              <div style={{
                width: '2px', flex: 1, minHeight: '24px',
                background: stage.status === 'done' ? 'var(--color-success)' : 'var(--color-border)',
                margin: '2px 0',
              }} />
            )}
          </div>

          <div style={{ paddingBottom: idx < stages.length - 1 ? '0.75rem' : 0, flex: 1 }}>
            <div style={{
              fontSize: '0.8rem', fontWeight: 600,
              color: stage.status === 'pending' ? 'var(--color-text-muted)' : 'var(--color-text)',
            }}>
              {stage.stage_number}. {stage.stage_name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>
              {stage.status === 'active' && '● running'}
              {stage.status === 'done' && stage.started_at && `✓ ${getDuration(stage.started_at, stage.completed_at)}`}
              {stage.status === 'pending' && 'waiting'}
              {stage.status === 'failed' && '✗ failed'}
            </div>
          </div>
        </div>
      ))}
      <style>{`@keyframes stagePulse { 0%,100%{box-shadow:0 0 8px rgba(0,212,255,0.4)} 50%{box-shadow:0 0 20px rgba(0,212,255,0.8)} }`}</style>
    </div>
  )
}