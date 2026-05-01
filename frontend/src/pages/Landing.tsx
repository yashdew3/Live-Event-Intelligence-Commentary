import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Activity, Zap, Radar, Layers, Shield, Sparkles, ArrowRight } from 'lucide-react'

export default function Landing() {
  const { token } = useAuthStore()

  const highlights = [
    { title: 'Realtime commentary', body: 'Groq Llama 3.1 generates play-by-play insights in under 2 seconds.' },
    { title: 'Deep analysis', body: 'Gemini Flash rolls up 50-event windows into trends and predictions.' },
    { title: 'Live pipeline tracker', body: 'Every pipeline stage is visible and synced to backend state.' },
    { title: 'Alert rules', body: 'Trigger on keywords, score gaps, or trend shifts with WebSocket push.' },
    { title: 'Post-event reports', body: 'Narrative recap with prediction accuracy review.' },
    { title: 'RBAC + JWT', body: 'Production-grade auth with analyst and viewer roles.' },
  ]

  const stages = [
    'Ingest',
    'Accumulate',
    'Groq commentary',
    'Gemini analysis',
    'Redis publish',
    'WebSocket push',
    'Alert evaluation',
    'Post-event report',
  ]

  const statPills = [
    { label: '8-stage pipeline', value: 'BullMQ + Redis' },
    { label: 'Sub-2s commentary', value: 'Groq Llama 3.1' },
    { label: '5-min analysis', value: 'Gemini Flash' },
  ]

  const heroCtaHref = token ? '/events' : '/login'
  const heroCtaLabel = token ? 'Open Dashboard' : 'Get Started'

  const pageStyle = {
    minHeight: '100vh',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
  }

  const containerStyle = {
    width: '100%',
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '0 1.5rem',
  }

  return (
    <div style={pageStyle}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '-120px', right: '-80px', width: '320px', height: '320px',
            background: 'radial-gradient(circle, rgba(0,212,255,0.25), rgba(0,212,255,0) 65%)',
            filter: 'blur(2px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-160px', left: '-120px', width: '360px', height: '360px',
            background: 'radial-gradient(circle, rgba(255,107,53,0.25), rgba(255,107,53,0) 65%)',
            filter: 'blur(2px)',
          }} />
        </div>

        <header style={{ padding: '2rem 0 1.5rem' }}>
          <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>LIVE EVENT INTELLIGENCE</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>Platform</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>Login</Link>
              <Link to="/signup" style={{
                background: 'var(--color-accent)', color: '#000', textDecoration: 'none',
                padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700,
              }}>Sign up</Link>
            </div>
          </div>
        </header>

        <section style={{ ...containerStyle, padding: '3rem 0 4rem' }}>
          <div className="landing-hero" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2.5rem', alignItems: 'center' }}>
            <div style={{ zIndex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.3rem 0.75rem', borderRadius: '999px',
                background: 'rgba(0,212,255,0.12)', color: 'var(--color-accent)',
                fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
              }}>
                <Radar size={12} /> Real-time sports intelligence
              </div>
              <h1 style={{ fontSize: '3rem', lineHeight: 1.05, margin: '1rem 0 1rem', fontWeight: 800 }}>
                Live event AI that reacts in seconds, not minutes.
              </h1>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                Stream live sports data into an 8-stage BullMQ pipeline, generate fast Groq commentary,
                deep Gemini analysis, and push results instantly to subscribers with WebSockets.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <Link to={heroCtaHref} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--color-accent)', color: '#000', textDecoration: 'none',
                  padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 700,
                  fontSize: '0.95rem', boxShadow: '0 10px 30px rgba(0,212,255,0.18)',
                }}>
                  {heroCtaLabel} <ArrowRight size={16} />
                </Link>
                <Link to="/signup" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  color: 'var(--color-text)', textDecoration: 'none',
                  fontSize: '0.9rem', fontWeight: 600,
                }}>
                  Create a free account
                </Link>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                {statPills.map(stat => (
                  <div key={stat.label} style={{
                    padding: '0.5rem 0.85rem', borderRadius: '999px',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    fontSize: '0.75rem', color: 'var(--color-text-muted)',
                  }}>
                    <span style={{ color: 'var(--color-text)' }}>{stat.label}</span> · {stat.value}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(145deg, rgba(13,20,33,0.95), rgba(17,24,39,0.85))',
              border: '1px solid var(--color-border)', borderRadius: '18px', padding: '1.5rem',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>LIVE EVENT</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Falcons vs Storm</div>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.2rem 0.6rem', borderRadius: '999px',
                  background: 'rgba(0,230,118,0.15)', color: 'var(--color-success)',
                  fontSize: '0.7rem', fontWeight: 600,
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }} /> Live
                </div>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{
                  background: 'var(--color-surface)', borderRadius: '10px', padding: '0.75rem 1rem',
                  borderLeft: '3px solid var(--color-accent)',
                }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>GROQ COMMENTARY</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Falcons break the press, storming into the final third.</div>
                </div>
                <div style={{
                  background: 'var(--color-surface)', borderRadius: '10px', padding: '0.75rem 1rem',
                  borderLeft: '3px solid #ff6b35',
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#ff6b35', fontFamily: 'var(--font-mono)' }}>GEMINI ANALYSIS</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', color: 'var(--color-text-muted)' }}>
                    Momentum trending home side. Prediction: Falcons edge by 1.
                  </div>
                </div>
                <div style={{
                  background: 'rgba(0,212,255,0.08)', borderRadius: '10px', padding: '0.75rem 1rem',
                  border: '1px dashed rgba(0,212,255,0.35)',
                }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>PIPELINE STAGE</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }} /> Stage 3: Groq commentary
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section style={{ ...containerStyle, padding: '1rem 0 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>WHY IT MATTERS</div>
            <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>Production-grade pipeline, visible in real time.</h2>
          </div>
          <div style={{ color: 'var(--color-text-muted)', maxWidth: '420px', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Every ingestion, analysis, and alert is surfaced. The UI stepper mirrors the backend pipeline stages,
            so teams can verify latency and health at a glance.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          {highlights.map(item => (
            <div key={item.title} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '12px', padding: '1.25rem',
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...containerStyle, paddingBottom: '4rem' }}>
        <div style={{
          background: 'var(--color-surface)', borderRadius: '16px', padding: '2rem',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>PIPELINE VISIBILITY</div>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>Eight-stage flow with live status updates.</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }} /> Done
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }} /> Active
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-border)' }} /> Pending
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1.5rem' }}>
            {stages.map((stage, index) => (
              <div key={stage} style={{
                padding: '0.75rem 0.85rem', borderRadius: '10px',
                background: index < 2 ? 'rgba(0,230,118,0.1)' : index === 2 ? 'rgba(0,212,255,0.15)' : 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Stage {index + 1}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.3rem' }}>{stage}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...containerStyle, paddingBottom: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(140deg, rgba(0,212,255,0.12), rgba(13,20,33,0.85))',
            borderRadius: '14px', border: '1px solid var(--color-border)', padding: '1.5rem',
          }}>
            <Activity size={18} style={{ color: 'var(--color-accent)' }} />
            <h4 style={{ marginTop: '1rem', fontSize: '1.05rem' }}>Realtime orchestration</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
              APScheduler + BullMQ keep ingestion, accumulation, and AI workers in lockstep.
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(140deg, rgba(255,107,53,0.12), rgba(13,20,33,0.85))',
            borderRadius: '14px', border: '1px solid var(--color-border)', padding: '1.5rem',
          }}>
            <Zap size={18} style={{ color: '#ff6b35' }} />
            <h4 style={{ marginTop: '1rem', fontSize: '1.05rem' }}>Dual-LLM strategy</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
              Groq for speed, Gemini for depth. Both models are tracked for accuracy.
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(140deg, rgba(0,230,118,0.12), rgba(13,20,33,0.85))',
            borderRadius: '14px', border: '1px solid var(--color-border)', padding: '1.5rem',
          }}>
            <Shield size={18} style={{ color: 'var(--color-success)' }} />
            <h4 style={{ marginTop: '1rem', fontSize: '1.05rem' }}>Production-grade security</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
              JWT auth, role-based access, and structured Pydantic validation across the stack.
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(140deg, rgba(107,122,153,0.12), rgba(13,20,33,0.85))',
            borderRadius: '14px', border: '1px solid var(--color-border)', padding: '1.5rem',
          }}>
            <Layers size={18} style={{ color: 'var(--color-text-muted)' }} />
            <h4 style={{ marginTop: '1rem', fontSize: '1.05rem' }}>Pipeline observability</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
              Bull Board plus live stage updates keep operators aware of worker health.
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(140deg, rgba(0,212,255,0.08), rgba(13,20,33,0.85))',
            borderRadius: '14px', border: '1px solid var(--color-border)', padding: '1.5rem',
          }}>
            <Sparkles size={18} style={{ color: 'var(--color-accent)' }} />
            <h4 style={{ marginTop: '1rem', fontSize: '1.05rem' }}>Explainable intelligence</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
              Trend context, predictions, and alert reasons are shared with every update.
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(140deg, rgba(255,171,0,0.12), rgba(13,20,33,0.85))',
            borderRadius: '14px', border: '1px solid var(--color-border)', padding: '1.5rem',
          }}>
            <Radar size={18} style={{ color: 'var(--color-warning)' }} />
            <h4 style={{ marginTop: '1rem', fontSize: '1.05rem' }}>Realtime alerts</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
              Configure keyword, score, or momentum triggers and get instant WebSocket push.
            </p>
          </div>
        </div>
      </section>

      <section style={{ ...containerStyle, paddingBottom: '4rem' }}>
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '18px', padding: '2rem', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>READY TO SHIP</div>
            <h3 style={{ fontSize: '1.6rem', marginTop: '0.5rem' }}>Launch the live intelligence workspace.</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Jump into the dashboard, subscribe to events, and watch the pipeline unfold live.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to={heroCtaHref} style={{
              padding: '0.75rem 1.5rem', background: 'var(--color-accent)', color: '#000',
              textDecoration: 'none', borderRadius: '10px', fontWeight: 700,
            }}>
              {heroCtaLabel}
            </Link>
            <Link to="/signup" style={{
              padding: '0.75rem 1.5rem', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', textDecoration: 'none', borderRadius: '10px',
              fontWeight: 600,
            }}>
              Create account
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '2rem 0 3rem' }}>
        <div style={{ ...containerStyle, display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Built for realtime intelligence workflows.
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
            <Link to="/login" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Login</Link>
            <Link to="/signup" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Sign up</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .landing-hero {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
