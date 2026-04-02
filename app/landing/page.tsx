'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setStoredUsername } from '@/lib/identity'

export default function LandingPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    const normalized = username.trim().toLowerCase()
    if (!normalized) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalized }),
      })
      const data = await res.json()
      if (data.ok) {
        setStoredUsername(data.username)
        router.push('/')
      } else {
        setError('Something went wrong. Try again.')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#0f0f0f',
      color: '#f0f0f0',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', borderBottom: '1px solid #1e1e1e',
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>
          Adaptive <span style={{ color: '#16a34a' }}>Spanish</span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="#students" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>For Students</Link>
          <Link href="#teachers" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>For Teachers</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(22,163,74,0.15)',
          color: '#4ade80', fontSize: 12, fontWeight: 700, letterSpacing: '0.8px',
          textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20,
          border: '1px solid rgba(74,222,128,0.3)', marginBottom: 28,
        }}>
          Adaptive Practice
        </div>
        <h1 style={{
          fontSize: 'clamp(34px, 5.5vw, 54px)', fontWeight: 900, lineHeight: 1.1,
          letterSpacing: '-1px', marginBottom: 20,
        }}>
          Practice that goes where<br />
          <span style={{ color: '#4ade80' }}>you need it most.</span>
        </h1>
        <p style={{ fontSize: 17, color: '#888', lineHeight: 1.7, marginBottom: 44, maxWidth: 520, margin: '0 auto 44px' }}>
          Adaptive Spanish targets your specific gaps — so every minute of practice does maximum work.
        </p>

        {/* Login form */}
        <form onSubmit={handleStart} style={{
          display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
          maxWidth: 440, margin: '0 auto',
        }}>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Choose a username to begin"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: 220,
              padding: '13px 18px',
              borderRadius: 10,
              border: '1.5px solid #2e2e2e',
              background: '#161616',
              color: '#f0f0f0',
              fontSize: 15,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              background: '#16a34a', color: '#fff', padding: '13px 24px',
              borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
              cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !username.trim() ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Starting…' : 'Start Drilling →'}
          </button>
        </form>
        {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 10 }}>{error}</p>}
        <p style={{ color: '#555', fontSize: 12, marginTop: 14 }}>Free to start · No credit card</p>
      </section>

      {/* Tagline bar */}
      <div style={{
        borderTop: '1px solid #1e1e1e', borderBottom: '1px solid #1e1e1e',
        padding: '14px 40px', textAlign: 'center', background: '#141414',
      }}>
        <span style={{ fontSize: 12, color: '#555', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
          Make your practice count.
        </span>
      </div>

      {/* Three pillars */}
      <section id="students" style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px' }}>
          Three pillars. One adaptive engine.
        </h2>
        <p style={{ textAlign: 'center', color: '#777', fontSize: 14, marginBottom: 48 }}>
          Vocabulary, conjugation, and grammar — all routing to your weakest spots automatically.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {[
            {
              icon: '📖',
              title: 'Vocabulary',
              desc: 'Core word list adaptively sequenced. Words tracked through Learning → Learned → Mastered. Mastered words stay sharp with periodic reinforcement.',
            },
            {
              icon: '🔤',
              title: 'Conjugation',
              desc: 'Every major tense across the full verb set. Visual heatmap shows mastery by pronoun × tense. Built-in guide sheets explain each tense with examples.',
            },
            {
              icon: '💬',
              title: 'Grammar & Phrases',
              desc: '300+ phrases across 16 grammar categories. The constructions that don\'t translate from English — each with guide sheets, patterns, and common mistakes.',
            },
          ].map(p => (
            <div key={p.title} style={{
              background: '#141414', border: '1px solid #222', borderRadius: 12,
              padding: '26px 24px',
            }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>{p.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{p.title}</h3>
              <p style={{ fontSize: 13.5, color: '#777', lineHeight: 1.7 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features strip */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { icon: '🎙', label: 'Voice Drilling', desc: 'Speak your answers — Whisper AI evaluates your Spanish in real time, hands-free.' },
            { icon: '📊', label: 'Visual Progress', desc: 'Charts, heatmaps, and mastery maps that show exactly where you stand.' },
            { icon: '🎯', label: 'Always Targeted', desc: 'Drilling your weakest spots. Never wasting time on what you already know.' },
            { icon: '🔍', label: 'Full Transparency', desc: 'Hover any stat to see every word in that bucket. No black boxes.' },
          ].map(f => (
            <div key={f.label} style={{
              background: '#111', border: '1px solid #1e1e1e', borderRadius: 10,
              padding: '18px 16px',
            }}>
              <div style={{ fontSize: 22, marginBottom: 7 }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{f.label}</div>
              <div style={{ fontSize: 11.5, color: '#666', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Teacher section */}
      <section id="teachers" style={{
        background: '#141414', borderTop: '1px solid #1e1e1e', borderBottom: '1px solid #1e1e1e',
        padding: '80px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 52, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-block', background: 'rgba(37,99,235,0.15)',
              color: '#60a5fa', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
              textTransform: 'uppercase', padding: '5px 12px', borderRadius: 20,
              border: '1px solid rgba(96,165,250,0.3)', marginBottom: 20,
            }}>
              Instructor Portal
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 14, letterSpacing: '-0.5px' }}>
              Know your class<br />before the bell rings.
            </h2>
            <p style={{ fontSize: 14, color: '#777', lineHeight: 1.7, marginBottom: 22 }}>
              A live dashboard shows every student's accuracy rates, mastered words, drill volume, and trends — in real time. Teachers arrive knowing exactly who needs support and where.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                'Per-student accuracy by vocabulary, phrases, and verbs',
                'Drills completed and net words mastered with trend arrows',
                'Click any student for their full heatmap and mastery detail',
                'Filter drill categories to align with your lesson plan',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: '#999' }}>
                  <span style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div style={{
            background: '#0f0f0f', border: '1px solid #222', borderRadius: 12,
            padding: '24px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spanish 101 — Student Roster</div>
            {[
              { name: 'sarah_m', active: 18, mastered: 94, pct: 88 },
              { name: 'carlos_r', active: 12, mastered: 67, pct: 74 },
              { name: 'emma_t', active: 6, mastered: 31, pct: 62 },
            ].map(s => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', background: '#161616', borderRadius: 8, fontSize: 12, gap: 8,
              }}>
                <span style={{ fontWeight: 600, color: '#f0f0f0', flex: 1 }}>{s.name}</span>
                <span style={{ color: '#555' }}>{s.active}d</span>
                <span style={{ color: '#aaa' }}>{s.mastered} mastered</span>
                <span style={{
                  fontWeight: 700, padding: '2px 8px', borderRadius: 6, fontSize: 11,
                  background: s.pct >= 80 ? 'rgba(22,163,74,0.2)' : s.pct >= 60 ? 'rgba(234,88,12,0.2)' : 'rgba(220,38,38,0.2)',
                  color: s.pct >= 80 ? '#4ade80' : s.pct >= 60 ? '#fb923c' : '#f87171',
                }}>
                  {s.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 14, letterSpacing: '-0.5px' }}>
          Ready to start?
        </h2>
        <p style={{ color: '#777', fontSize: 14, marginBottom: 32 }}>
          Free to start. No credit card required.
        </p>
        <form onSubmit={handleStart} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 400, margin: '0 auto' }}>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Choose a username"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{
              flex: 1, minWidth: 180, padding: '12px 16px', borderRadius: 9,
              border: '1.5px solid #2e2e2e', background: '#161616',
              color: '#f0f0f0', fontSize: 14, outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              background: '#16a34a', color: '#fff', padding: '12px 22px',
              borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 700,
              cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !username.trim() ? 0.6 : 1,
            }}
          >
            {loading ? 'Starting…' : 'Start →'}
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1a1a1a', padding: '24px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>
          Adaptive <span style={{ color: '#16a34a' }}>Spanish</span>
        </div>
        <div style={{ fontSize: 11, color: '#444' }}>Make your practice count.</div>
      </footer>
    </div>
  )
}
