'use client'

import { useEffect, useRef, useState } from 'react'

type Bucket = 'unseen' | 'learning' | 'learned' | 'mastered'
type MoveType = 'promote' | 'master' | 'demote' | null
type Phase = 'answering' | 'wrong-first' | 'correct' | 'revealed'

type DrillItem = {
  id: string
  english: string
  spanish: string
  emoji: string | null
  bucket: Bucket
}

type DrillState = {
  item: DrillItem | null
  counts: { learning: number; learned: number; mastered: number; unseen: number }
  unseenCount: number
  stats: { correct: number; wrong: number; promoted: number; demoted: number }
  lastMove: string | null
  lastMoveType: MoveType
}

const emptyState: DrillState = {
  item: null,
  counts: { learning: 0, learned: 0, mastered: 0, unseen: 0 },
  unseenCount: 0,
  stats: { correct: 0, wrong: 0, promoted: 0, demoted: 0 },
  lastMove: null,
  lastMoveType: null,
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

export default function DrillApp() {
  const [drill, setDrill] = useState<DrillState>(emptyState)
  const [phase, setPhase] = useState<Phase>('answering')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)

  const item = drill.item
  const currentBucket = item?.bucket
  const isReviewing = phase === 'correct' || phase === 'revealed'
  const anyStats = drill.stats.correct + drill.stats.wrong > 0
  const toastKey = drill.lastMove ? `${drill.lastMove}-${drill.stats.promoted}-${drill.stats.demoted}` : ''

  useEffect(() => {
    fetch('/api/drill/init').then(r => r.json()).then((data: DrillState) => {
      setDrill(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (isReviewing) nextBtnRef.current?.focus()
    else inputRef.current?.focus()
  }, [isReviewing, phase, item?.id])

  async function submitAttempt(attemptNumber: number) {
    if (!item) return
    setSubmitting(true)
    const res = await fetch('/api/drill/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: item.id, answer: input, attemptNumber }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (data.phase === 'wrong-first') {
      setPhase('wrong-first')
      setInput('')
      return
    }
    setDrill({
      item: data.item,
      counts: data.counts,
      unseenCount: data.unseenCount,
      stats: data.stats,
      lastMove: data.lastMove,
      lastMoveType: data.lastMoveType,
    })
    setPhase(data.phase)
    setAnswer(data.answer)
    setInput('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isReviewing) {
      setPhase('answering')
      setAnswer(null)
      return
    }
    void submitAttempt(phase === 'wrong-first' ? 2 : 1)
  }

  if (loading) return <div className="app"><p>Loading Adaptive Spanish…</p></div>

  return (
    <div className="app">
      <header className="app-header">
        <h1>Adaptive Spanish</h1>
        <p className="tagline">Type the Spanish. Earn your way up.</p>
      </header>

      <main className="app-main">
        <div className="category-toggles">
          <button className="category-toggle category-toggle-active" type="button">Vocabulary</button>
          <button className="category-toggle category-toggle-soon" type="button" disabled>Phrases <span className="soon-badge">Soon</span></button>
          <button className="category-toggle category-toggle-soon" type="button" disabled>Verb Conjugation <span className="soon-badge">Soon</span></button>
        </div>

        <div className="bucket-cards">
          {([
            ['Learning', 'learning', drill.counts.learning],
            ['Learned', 'learned', drill.counts.learned],
            ['Mastered', 'mastered', drill.counts.mastered],
          ] as [string, string, number][]).map(([label, key, wordCount]) => (
            <div key={key} className={`bucket-card bucket-card-${key}`}>
              <div className="bucket-name">{label}</div>
              <div className="bucket-sub-counts">
                <div className="bucket-sub"><span className="bucket-sub-num">{wordCount}</span><span className="bucket-sub-label">words</span></div>
                <div className="bucket-sub-divider" />
                <div className="bucket-sub"><span className="bucket-sub-num bucket-sub-num-muted">0</span><span className="bucket-sub-label">phrases</span></div>
              </div>
            </div>
          ))}
        </div>

        {drill.unseenCount > 0 && <p className="unseen-note">{drill.unseenCount} words not yet introduced</p>}

        {!item ? (
          <section className="drill-panel">
            <div className="all-done">
              <div className="all-done-icon">🎉</div>
              <div className="all-done-text">All words mastered!</div>
            </div>
          </section>
        ) : (
          <section className="drill-panel">
            {drill.lastMove && <div key={toastKey} className={`move-toast move-toast-${drill.lastMoveType}`}>{drill.lastMove}</div>}
            <div className="drill-card">
              <div className="drill-emoji">{item.emoji}</div>
              <div className="drill-prompt">{item.english}</div>
              <div className={`drill-bucket-tag bucket-tag-${currentBucket}`}>{cap(currentBucket!)}</div>
            </div>

            {phase === 'wrong-first' && <div className="feedback feedback-wrong"><span className="feedback-icon">✗</span><span>Not quite — one more chance</span><span className="feedback-attempt">2 / 2</span></div>}
            {phase === 'correct' && <div className="feedback feedback-correct"><span className="feedback-icon">✓</span><span>Correct! <span className="answer-word">{answer}</span></span></div>}
            {phase === 'revealed' && <div className="feedback feedback-revealed"><span className="feedback-icon">→</span><span>Answer: <span className="answer-word">{answer}</span></span></div>}

            <form onSubmit={handleSubmit} className="drill-form">
              <input
                ref={inputRef}
                type="text"
                className={`drill-input${phase === 'wrong-first' ? ' input-wrong' : ''}`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={phase === 'wrong-first' ? 'Try again…' : 'Type Spanish…'}
                disabled={isReviewing || submitting}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button ref={nextBtnRef} type="submit" className={`btn btn-submit${isReviewing ? ' btn-next' : ''}`} disabled={submitting}>
                {isReviewing ? 'Next →' : submitting ? '...' : 'Check'}
              </button>
            </form>

            <p className="drill-hint">
              {phase === 'answering' && 'Enter to check · blank Enter to skip & reveal'}
              {phase === 'wrong-first' && 'Last chance · blank Enter to reveal answer'}
              {isReviewing && 'Enter or click Next to continue'}
            </p>
          </section>
        )}

        {anyStats && (
          <div className="session-stats">
            <span className="stat stat-correct">✓ {drill.stats.correct}</span>
            <span className="stat-sep">·</span>
            <span className="stat stat-wrong">✗ {drill.stats.wrong}</span>
            <span className="stat-sep">·</span>
            <span className="stat stat-promoted">↑ {drill.stats.promoted}</span>
            <span className="stat-sep">·</span>
            <span className="stat stat-demoted">↓ {drill.stats.demoted}</span>
          </div>
        )}
      </main>
    </div>
  )
}
