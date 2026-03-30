'use client'

import { useEffect, useRef, useState } from 'react'

type Bucket = 'unseen' | 'learning' | 'learned' | 'mastered'
type MoveType = 'promote' | 'master' | 'demote' | null
type Phase = 'answering' | 'wrong-first' | 'correct' | 'revealed'

const ALL_TENSES = ['present','preterite','imperfect','future','conditional','present_subjunctive','imperfect_subjunctive','present_perfect','imperative','past_perfect','future_perfect','conditional_perfect','present_perfect_subjunctive']

const TENSE_LABELS: Record<string, string> = {
  present: 'Present',
  preterite: 'Preterite',
  imperfect: 'Imperfect',
  future: 'Future',
  conditional: 'Conditional',
  present_subjunctive: 'Pres. Subj.',
  imperfect_subjunctive: 'Imp. Subj.',
  present_perfect: 'Pres. Perfect',
  imperative: 'Imperative',
  past_perfect: 'Past Perfect',
  future_perfect: 'Future Perfect',
  conditional_perfect: 'Cond. Perfect',
  present_perfect_subjunctive: 'Pres. Perf. Subj.',
}

type VerbDrillItem = {
  id: string
  infinitive: string
  english: string
  tense: string
  pronoun: string
  form: string
  exampleEs: string | null
  exampleEn: string | null
  bucket: Bucket
  score: number
}

type VerbDrillState = {
  item: VerbDrillItem | null
  counts: { learning: number; learned: number; mastered: number; unseen: number }
  unseenCount: number
  stats: { correct: number; wrong: number; promoted: number; demoted: number }
  lastMove: string | null
  lastMoveType: MoveType
}

const emptyState: VerbDrillState = {
  item: null,
  counts: { learning: 0, learned: 0, mastered: 0, unseen: 0 },
  unseenCount: 0,
  stats: { correct: 0, wrong: 0, promoted: 0, demoted: 0 },
  lastMove: null,
  lastMoveType: null,
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function normalize(s: string) { return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') }

interface Props {
  username: string
  onAnswer: () => void
}

export default function VerbDrillApp({ username, onAnswer }: Props) {
  const [drill, setDrill] = useState<VerbDrillState>(emptyState)
  const [phase, setPhase] = useState<Phase>('answering')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingSync, setPendingSync] = useState(false)
  const [queuedNext, setQueuedNext] = useState<VerbDrillState | null>(null)
  const [selectedTenses, setSelectedTenses] = useState<string[]>(['present'])
  const inputRef = useRef<HTMLInputElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)

  const item = drill.item
  const currentBucket = item?.bucket
  const isReviewing = phase === 'correct' || phase === 'revealed'
  const anyStats = drill.stats.correct + drill.stats.wrong > 0
  const toastKey = drill.lastMove ? `${drill.lastMove}-${drill.stats.promoted}-${drill.stats.demoted}` : ''

  function toggleTense(tense: string) {
    setSelectedTenses(prev => {
      if (prev.includes(tense)) {
        const next = prev.filter(t => t !== tense)
        return next.length === 0 ? prev : next // always keep at least one
      }
      return [...prev, tense]
    })
  }

  useEffect(() => {
    setLoading(true)
    setDrill(emptyState)
    setPhase('answering')
    setInput('')
    setAnswer(null)
    const tensesParam = selectedTenses.join(',')
    fetch(`/api/verbs/drill/init?username=${encodeURIComponent(username)}&tenses=${tensesParam}`).then(r => r.json()).then((data: VerbDrillState) => {
      setDrill(data)
      setLoading(false)
    })
  }, [username, selectedTenses])

  useEffect(() => {
    if (isReviewing) nextBtnRef.current?.focus()
    else inputRef.current?.focus()
  }, [isReviewing, phase, item?.id])

  async function persistAndQueue(answerValue: string, attemptNumber: number, optimisticPhase: Phase, optimisticAnswer: string | null, optimisticState?: Partial<VerbDrillState>) {
    if (!item) return
    if (optimisticState) setDrill(prev => ({ ...prev, ...optimisticState }))
    setPhase(optimisticPhase)
    setAnswer(optimisticAnswer)
    setInput('')
    setPendingSync(true)
    try {
      const res = await fetch('/api/verbs/drill/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, conjugationId: item.id, answer: answerValue, attemptNumber }),
      })
      const data = await res.json()
      if (data.phase !== 'wrong-first') {
        setQueuedNext({ item: data.item, counts: data.counts, unseenCount: data.unseenCount, stats: data.stats, lastMove: data.lastMove, lastMoveType: data.lastMoveType })
      }
    } finally {
      setPendingSync(false)
    }
  }

  function advanceToQueued() {
    if (queuedNext) {
      setDrill(queuedNext)
      setQueuedNext(null)
    }
    onAnswer()
    setPhase('answering')
    setAnswer(null)
    setInput('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    if (isReviewing) { advanceToQueued(); return }

    const normalizedInput = normalize(input)
    const expected = normalize(item.form)
    const isBlank = normalizedInput === ''
    const isCorrect = normalizedInput === expected

    if (phase === 'answering') {
      if (isBlank) {
        const nextBucket = item.bucket === 'mastered' ? 'learned' : 'learning'
        const optimisticCounts = { ...drill.counts }
        if (item.bucket === 'learned') { optimisticCounts.learned -= 1; optimisticCounts.learning += 1 }
        else if (item.bucket === 'mastered') { optimisticCounts.mastered -= 1; optimisticCounts.learned += 1 }
        void persistAndQueue('', 1, 'revealed', item.form, {
          counts: optimisticCounts,
          stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
          lastMove: item.bucket === 'learning' ? null : nextBucket === 'learned' ? '↓ Demoted to Learned' : '↓ Demoted to Learning',
          lastMoveType: item.bucket === 'learning' ? null : 'demote',
        })
        return
      }
      if (!isCorrect) { setPhase('wrong-first'); setInput(''); return }
      const optimisticCounts = { ...drill.counts }
      let lastMove: string | null = null
      let lastMoveType: MoveType = null
      if (item.bucket === 'learning') {
        optimisticCounts.learning -= 1; optimisticCounts.learned += 1
        if (drill.unseenCount > 0) { optimisticCounts.learning += 1; optimisticCounts.unseen -= 1 }
        lastMove = '↑ Promoted to Learned'; lastMoveType = 'promote'
      } else if (item.bucket === 'learned') {
        optimisticCounts.learned -= 1; optimisticCounts.mastered += 1
        lastMove = '★ Mastered!'; lastMoveType = 'master'
      }
      void persistAndQueue(input, 1, 'correct', item.form, {
        counts: optimisticCounts,
        unseenCount: optimisticCounts.unseen,
        stats: { ...drill.stats, correct: drill.stats.correct + 1, promoted: drill.stats.promoted + (lastMoveType ? 1 : 0) },
        lastMove,
        lastMoveType,
      })
      return
    }

    if (phase === 'wrong-first') {
      if (!isBlank && isCorrect) {
        const optimisticCounts = { ...drill.counts }
        let lastMove: string | null = null
        let lastMoveType: MoveType = null
        if (item.bucket === 'learning') {
          optimisticCounts.learning -= 1; optimisticCounts.learned += 1
          if (drill.unseenCount > 0) { optimisticCounts.learning += 1; optimisticCounts.unseen -= 1 }
          lastMove = '↑ Promoted to Learned'; lastMoveType = 'promote'
        } else if (item.bucket === 'learned') {
          optimisticCounts.learned -= 1; optimisticCounts.mastered += 1
          lastMove = '★ Mastered!'; lastMoveType = 'master'
        }
        void persistAndQueue(input, 2, 'correct', item.form, {
          counts: optimisticCounts,
          unseenCount: optimisticCounts.unseen,
          stats: { ...drill.stats, correct: drill.stats.correct + 1, promoted: drill.stats.promoted + (lastMoveType ? 1 : 0) },
          lastMove,
          lastMoveType,
        })
        return
      }
      const nextBucket = item.bucket === 'mastered' ? 'learned' : 'learning'
      const optimisticCounts = { ...drill.counts }
      if (item.bucket === 'learned') { optimisticCounts.learned -= 1; optimisticCounts.learning += 1 }
      else if (item.bucket === 'mastered') { optimisticCounts.mastered -= 1; optimisticCounts.learned += 1 }
      void persistAndQueue(input, 2, 'revealed', item.form, {
        counts: optimisticCounts,
        stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
        lastMove: item.bucket === 'learning' ? null : nextBucket === 'learned' ? '↓ Demoted to Learned' : '↓ Demoted to Learning',
        lastMoveType: item.bucket === 'learning' ? null : 'demote',
      })
    }
  }

  if (loading) return <section className="drill-panel"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading verbs…</p></section>

  return (
    <>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Tense filter — vertical sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4, flexShrink: 0 }}>
          {ALL_TENSES.map(tense => (
            <label key={tense} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: selectedTenses.includes(tense) ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={selectedTenses.includes(tense)}
                onChange={() => toggleTense(tense)}
                style={{ accentColor: 'var(--green)', width: 12, height: 12, flexShrink: 0 }}
              />
              {TENSE_LABELS[tense]}
            </label>
          ))}
        </div>

        {/* Drill pane */}
        <div style={{ flex: 1, minWidth: 0 }}>
      {!item ? (
        <section className="drill-panel">
          <div className="all-done">
            <div className="all-done-icon">{drill.unseenCount > 0 ? '⏳' : '🎉'}</div>
            <div className="all-done-text">{drill.unseenCount > 0 ? 'Loading next form…' : 'All conjugations mastered!'}</div>
          </div>
        </section>
      ) : (
        <section className="drill-panel">
          {drill.lastMove && <div key={toastKey} className={`move-toast move-toast-${drill.lastMoveType}`}>{drill.lastMove}</div>}
          <div className="drill-card">
            <div className="drill-prompt" style={{ fontSize: 36, fontWeight: 700, marginBottom: 6 }}>
              {item.infinitive}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
              {item.english} · {TENSE_LABELS[item.tense] ?? item.tense}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
              {item.pronoun}
            </div>
            {item.exampleEs && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: 3 }}>{item.exampleEs}</div>
                {item.exampleEn && <div style={{ fontSize: 13, color: 'var(--text-muted)', opacity: 0.8 }}>{item.exampleEn}</div>}
              </div>
            )}
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
              placeholder={phase === 'wrong-first' ? 'Try again…' : 'Type conjugation…'}
              disabled={isReviewing}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button ref={nextBtnRef} type="submit" className={`btn btn-submit${isReviewing ? ' btn-next' : ''}`}>
              {isReviewing ? (pendingSync ? 'Saving…' : 'Next →') : pendingSync ? 'Saving…' : 'Check'}
            </button>
          </form>

          <p className="drill-hint">
            {phase === 'answering' && 'Enter to check · blank Enter to skip & reveal'}
            {phase === 'wrong-first' && 'Last chance · blank Enter to reveal answer'}
            {isReviewing && (pendingSync ? 'Saving result…' : 'Enter or click Next to continue')}
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
        </div>{/* end drill pane */}
      </div>{/* end sidebar+drill flex row */}
    </>
  )
}
