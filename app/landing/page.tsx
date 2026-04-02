import Link from 'next/link'

const APP_URL = '/';

export const metadata = {
  title: 'Adaptive Spanish — Make your practice count.',
  description: 'The Spanish drilling tool that goes where you need it most. Adaptive vocabulary, conjugation, and grammar practice — with real-time teacher insights.',
}

export default function LandingPage() {
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
        padding: '20px 40px', borderBottom: '1px solid #222',
        position: 'sticky', top: 0, background: 'rgba(15,15,15,0.95)',
        backdropFilter: 'blur(8px)', zIndex: 100,
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>
          Adaptive <span style={{ color: '#16a34a' }}>Spanish</span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="#students" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>For Students</Link>
          <Link href="#teachers" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>For Teachers</Link>
          <Link href={APP_URL} style={{
            background: '#16a34a', color: '#fff', padding: '8px 18px',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}>Launch App →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '90px 24px 70px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(22,163,74,0.15)',
          color: '#4ade80', fontSize: 12, fontWeight: 700, letterSpacing: '0.8px',
          textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20,
          border: '1px solid rgba(74,222,128,0.3)', marginBottom: 28,
        }}>
          Adaptive Practice
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 58px)', fontWeight: 900, lineHeight: 1.1,
          letterSpacing: '-1px', marginBottom: 24,
        }}>
          Practice that goes where<br />
          <span style={{ color: '#4ade80' }}>you need it most.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#999', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
          Adaptive Spanish reads your mastery map and targets your specific gaps — so every minute of practice does maximum work.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={APP_URL} style={{
            background: '#16a34a', color: '#fff', padding: '14px 32px',
            borderRadius: 10, textDecoration: 'none', fontSize: 16, fontWeight: 700,
            display: 'inline-block',
          }}>
            Start Drilling Free →
          </Link>
          <Link href="#teachers" style={{
            background: 'transparent', color: '#f0f0f0', padding: '14px 32px',
            borderRadius: 10, textDecoration: 'none', fontSize: 16, fontWeight: 600,
            border: '1.5px solid #333', display: 'inline-block',
          }}>
            For Teachers
          </Link>
        </div>
      </section>

      {/* Tagline bar */}
      <div style={{
        borderTop: '1px solid #222', borderBottom: '1px solid #222',
        padding: '16px 40px', textAlign: 'center',
        background: '#141414',
      }}>
        <span style={{ fontSize: 13, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
          Make your practice count.
        </span>
      </div>

      {/* Three pillars */}
      <section id="students" style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.5px' }}>
          Three pillars. One adaptive engine.
        </h2>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 15, marginBottom: 52 }}>
          Everything a Spanish learner needs, all routing to your weakest spots automatically.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            {
              icon: '📖',
              title: 'Vocabulary',
              desc: 'Core word list adaptively sequenced. Each word tracked through Learning → Learned → Mastered. Mastered words stay sharp — the algorithm checks in.',
            },
            {
              icon: '🔤',
              title: 'Conjugation',
              desc: 'Every major tense across the full verb set. A visual heatmap shows your mastery by pronoun and tense. Built-in guide sheets explain each tense with examples and usage rules.',
            },
            {
              icon: '💬',
              title: 'Grammar & Phrases',
              desc: '300+ phrases across 16 grammar categories — the constructions that don\'t translate from English. Each category has a built-in guide sheet with patterns, examples, and common mistakes.',
            },
          ].map(p => (
            <div key={p.title} style={{
              background: '#161616', border: '1px solid #252525', borderRadius: 14,
              padding: '28px 26px',
            }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{p.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '20px 24px 80px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {[
            { icon: '🎙', label: 'Voice Drilling', desc: 'Speak your answers. Whisper AI evaluates your Spanish in real time.' },
            { icon: '📊', label: 'Visual Progress', desc: 'Mastered-by-day charts, conjugation heatmaps, grammar progress maps.' },
            { icon: '🎯', label: 'Targeted', desc: 'Always drilling your weakest areas. Never wasting time on what you already know.' },
            { icon: '🔍', label: 'Transparent', desc: 'See exactly where you stand — hover any stat to see every word in that bucket.' },
          ].map(f => (
            <div key={f.label} style={{
              background: '#141414', border: '1px solid #222', borderRadius: 10,
              padding: '20px 18px',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: '#777', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Teacher section */}
      <section id="teachers" style={{
        background: '#141414', borderTop: '1px solid #222', borderBottom: '1px solid #222',
        padding: '80px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-block', background: 'rgba(37,99,235,0.15)',
              color: '#60a5fa', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
              textTransform: 'uppercase', padding: '5px 12px', borderRadius: 20,
              border: '1px solid rgba(96,165,250,0.3)', marginBottom: 20,
            }}>
              Instructor Portal
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
              Know your class<br />before the bell rings.
            </h2>
            <p style={{ fontSize: 15, color: '#888', lineHeight: 1.7, marginBottom: 24 }}>
              A live dashboard shows every student's drill activity, accuracy rates, mastered words, and trends — updated in real time. Teachers arrive knowing exactly who needs support and where.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Per-student accuracy rates by vocabulary, phrases, and verbs',
                'Drills completed and net words mastered with trend arrows',
                'Click any student to see their full heatmap and mastery detail',
                'Filter which categories students drill to align with your lesson plan',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#aaa' }}>
                  <span style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div style={{
            background: '#0f0f0f', border: '1px solid #252525', borderRadius: 14,
            padding: '28px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Roster Preview</div>
            {[
              { name: 'sarah_m', active: 18, mastered: 94, pct: 88, trend: '↑' },
              { name: 'carlos_r', active: 12, mastered: 67, pct: 74, trend: '→' },
              { name: 'emma_t', active: 6, mastered: 31, pct: 62, trend: '↓' },
            ].map(s => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', background: '#161616', borderRadius: 8, fontSize: 12,
              }}>
                <span style={{ fontWeight: 600, color: '#f0f0f0' }}>{s.name}</span>
                <span style={{ color: '#666' }}>{s.active}d active</span>
                <span style={{ color: '#f0f0f0', fontWeight: 600 }}>{s.mastered} mastered</span>
                <span style={{
                  fontWeight: 700, padding: '2px 8px', borderRadius: 6, fontSize: 11,
                  background: s.pct >= 80 ? 'rgba(22,163,74,0.2)' : s.pct >= 60 ? 'rgba(234,88,12,0.2)' : 'rgba(220,38,38,0.2)',
                  color: s.pct >= 80 ? '#4ade80' : s.pct >= 60 ? '#fb923c' : '#f87171',
                }}>
                  {s.pct}% {s.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '90px 24px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.5px' }}>
          Ready to make your<br />practice count?
        </h2>
        <p style={{ color: '#888', fontSize: 15, marginBottom: 36 }}>
          Free to start. No credit card required.
        </p>
        <Link href={APP_URL} style={{
          background: '#16a34a', color: '#fff', padding: '16px 40px',
          borderRadius: 12, textDecoration: 'none', fontSize: 17, fontWeight: 800,
          display: 'inline-block', letterSpacing: '-0.3px',
        }}>
          Start Drilling Now →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1e1e1e', padding: '28px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>
          Adaptive <span style={{ color: '#16a34a' }}>Spanish</span>
        </div>
        <div style={{ fontSize: 12, color: '#555' }}>
          Make your practice count.
        </div>
      </footer>
    </div>
  )
}
