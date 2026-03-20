import { useState } from 'react'
import './App.css'

type Mode = 'flashcard' | 'typing' | 'listening'

function App() {
  const [mode, setMode] = useState<Mode>('flashcard')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Adaptive Spanish</h1>
        <p className="tagline">Smart drills that adapt to you</p>
      </header>

      <main className="app-main">
        <section className="bucket-header">
          <div className="section-label">Current Bucket</div>
          <div className="bucket-name">— placeholder —</div>
          <div className="bucket-meta">0 words · 0% mastered</div>
        </section>

        <section className="drill-panel">
          <div className="section-label">Drill</div>
          <div className="drill-card">
            <div className="drill-prompt">¿Cómo te llamas?</div>
            <div className="drill-hint">What is your name?</div>
          </div>
          <div className="drill-actions">
            <button className="btn btn-wrong">Wrong</button>
            <button className="btn btn-right">Right</button>
          </div>
        </section>

        <section className="progress-visuals">
          <div className="section-label">Progress</div>
          <div className="progress-bars">
            <div className="progress-row">
              <span>New</span>
              <div className="bar"><div className="bar-fill" style={{ width: '0%' }} /></div>
              <span>0</span>
            </div>
            <div className="progress-row">
              <span>Learning</span>
              <div className="bar"><div className="bar-fill" style={{ width: '0%' }} /></div>
              <span>0</span>
            </div>
            <div className="progress-row">
              <span>Mastered</span>
              <div className="bar"><div className="bar-fill" style={{ width: '0%' }} /></div>
              <span>0</span>
            </div>
          </div>
        </section>

        <section className="mode-toggles">
          <div className="section-label">Mode</div>
          <div className="toggle-group">
            {(['flashcard', 'typing', 'listening'] as Mode[]).map((m) => (
              <button
                key={m}
                className={`toggle-btn ${mode === m ? 'active' : ''}`}
                onClick={() => setMode(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
