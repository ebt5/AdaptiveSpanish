'use client'

import { useEffect, useRef, useState } from 'react'
import { clearStoredUsername, getStoredUsername, setStoredUsername } from '@/lib/identity'
import MasteredChart from './MasteredChart'
import ConjugationHeatmap from './ConjugationHeatmap'
import VerbDrillApp from './VerbDrillApp'
import PhraseDrillApp from './PhraseDrillApp'
import BucketPopover from './BucketPopover'
import GrammarHeatmap from './GrammarHeatmap'
import MasteredChartPhrases from './MasteredChartPhrases'
import AdminPanel from './AdminPanel'
import VoiceInput from './VoiceInput'

type Bucket = 'unseen' | 'learning' | 'learned' | 'mastered'
type MoveType = 'promote' | 'master' | 'demote' | null
type Phase = 'answering' | 'wrong-first' | 'correct' | 'revealed'
type Mode = 'vocab' | 'verbs' | 'phrases'

type DrillItem = {
  id: string
  english: string
  spanish: string
  spanishDisplay?: string
  spanishNormalized?: string
  emoji: string | null
  bucket: Bucket
  score?: number
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
function normalize(s: string) {
  return s.trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:\u201c\u201d\u2018\u2019'"]/g, '')
    .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '')
    .trim()
}

const ALL_PHRASE_TAGS_CONST = ['survival','ser-estar','tener-expressions','hacer-expressions','reflexive','gustar-type','verb-infinitive','progressive','object-pronouns','por-para','negative-constructions','hay-que-impersonal','unintentional','subjunctive','conditional','idioms-discourse']

export default function DrillApp() {
  const [username, setUsername] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [role, setRole] = useState<string>('learner')
  const [usernameInput, setUsernameInput] = useState('')
  const [drill, setDrill] = useState<DrillState>(emptyState)
  const [phase, setPhase] = useState<Phase>('answering')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingSync, setPendingSync] = useState(false)
  const [queuedNext, setQueuedNext] = useState<DrillState | null>(null)
  const [milestone, setMilestone] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('vocab')
  const [heatmapKey, setHeatmapKey] = useState(0)
  const [selectedPhraseTags, setSelectedPhraseTags] = useState<string[]>(ALL_PHRASE_TAGS_CONST)
  const [currentPhraseItem, setCurrentPhraseItem] = useState<{ id: string; english: string; spanish: string; grammarTag: string; grammarNote: string | null } | null>(null)
  function togglePhraseTag(tag: string) {
    setSelectedPhraseTags(prev => {
      if (prev.includes(tag)) { const n = prev.filter(t => t !== tag); return n.length === 0 ? prev : n }
      return [...prev, tag]
    })
  }
  function toggleAllPhraseTags() {
    setSelectedPhraseTags(prev => prev.length === ALL_PHRASE_TAGS_CONST.length ? [ALL_PHRASE_TAGS_CONST[0]] : ALL_PHRASE_TAGS_CONST)
  }
  const [phraseCounts, setPhraseCounts] = useState<{ learning: number; learned: number; mastered: number; unseen: number }>({ learning: 0, learned: 0, mastered: 0, unseen: 0 })
  const [voiceMode, setVoiceMode] = useState(false)
  const [hoveredBucket, setHoveredBucket] = useState<'learning' | 'learned' | 'mastered' | null>(null)
  const [popoverAnchorRect, setPopoverAnchorRect] = useState<DOMRect | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)

  const item = drill.item
  const currentBucket = item?.bucket
  const isReviewing = phase === 'correct' || phase === 'revealed'
  const anyStats = drill.stats.correct + drill.stats.wrong > 0
  const toastKey = drill.lastMove ? `${drill.lastMove}-${drill.stats.promoted}-${drill.stats.demoted}` : ''

  useEffect(() => {
    const stored = getStoredUsername()
    if (stored) setUsername(stored)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!username) return
    setLoading(true)
    // Load drill state + check admin status in parallel
    Promise.all([
      fetch(`/api/drill/init?username=${encodeURIComponent(username)}`).then(r => r.json()),
      fetch('/api/user/bootstrap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) }).then(r => r.json()),
    ]).then(([drillData, userData]) => {
      setDrill(drillData)
      setIsAdmin(userData.isAdmin ?? false)
      setRole(userData.role ?? 'learner')
      setLoading(false)
    })
  }, [username])

  useEffect(() => {
    if (mode === 'vocab') {
      if (isReviewing) nextBtnRef.current?.focus()
      else inputRef.current?.focus()
    }
  }, [isReviewing, phase, item?.id, mode])

  // Always fetch phrase counts so bucket cards show correct numbers in all modes
  useEffect(() => {
    if (!username) return
    fetch(`/api/phrases/drill/init?username=${encodeURIComponent(username)}`).then(r => r.json()).then((data: { counts: typeof phraseCounts }) => {
      if (data.counts) setPhraseCounts(data.counts)
    }).catch(() => {})
  }, [username])

  async function bootstrapUser(e: React.FormEvent) {
    e.preventDefault()
    const normalized = usernameInput.trim().toLowerCase()
    if (!normalized) return
    const res = await fetch('/api/user/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: normalized }),
    })
    const data = await res.json()
    if (data.ok) {
      setStoredUsername(data.username)
      setUsername(data.username)
      setIsAdmin(data.isAdmin ?? false)
      setRole(data.role ?? 'learner')
      setUsernameInput('')
    }
  }

  async function persistAndQueue(answerValue: string, attemptNumber: number, optimisticPhase: Phase, optimisticAnswer: string | null, optimisticState?: Partial<DrillState>) {
    if (!item || !username) return
    if (optimisticState) setDrill(prev => ({ ...prev, ...optimisticState }))
    setPhase(optimisticPhase)
    setAnswer(optimisticAnswer)
    setInput('')
    setPendingSync(true)
    try {
      const res = await fetch('/api/drill/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, entryId: item.id, answer: answerValue, attemptNumber }),
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
      setDrill({ ...queuedNext, lastMove: null, lastMoveType: null })
      setQueuedNext(null)
    }
    setMilestone(null)
    setPhase('answering')
    setAnswer(null)
    setInput('')
  }

  function handleVoiceTranscript(text: string) {
    // Show transcript in input box so learner sees what Whisper heard
    setInput(text)
    setVoiceMode(false)  // show the input box with the transcript
    // Auto-submit after 1.5s — learner can edit or just watch it submit
    setTimeout(() => {
      submitWithValue(text)
      setTimeout(() => setVoiceMode(true), 600)
    }, 1500)
  }

  function submitWithValue(value: string) {
    if (!item || isReviewing) return
    const normalizedInput = normalize(value)
    const expected = item.spanishNormalized ?? normalize(item.spanish)
    const isBlank = normalizedInput === ''
    const isCorrect = normalizedInput === expected

    if (phase === 'answering') {
      if (isBlank) {
        const optimisticCounts = { ...drill.counts }
        if (item.bucket === 'learned') { optimisticCounts.learned -= 1; optimisticCounts.learning += 1 }
        else if (item.bucket === 'mastered') { optimisticCounts.mastered -= 1; optimisticCounts.learning += 1 }
        void persistAndQueue('', 1, 'revealed', item.spanishDisplay ?? item.spanish, {
          counts: optimisticCounts,
          stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
          lastMove: item.bucket === 'learning' ? null : '↓ Demoted to Learning',
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
      void persistAndQueue(value, 1, 'correct', item.spanishDisplay ?? item.spanish, {
        counts: optimisticCounts,
        unseenCount: optimisticCounts.unseen,
        stats: { ...drill.stats, correct: drill.stats.correct + 1, promoted: drill.stats.promoted + (lastMoveType ? 1 : 0) },
        lastMove,
        lastMoveType,
      })
    } else if (phase === 'wrong-first') {
      const optimisticCounts = { ...drill.counts }
      if (!isBlank && isCorrect) {
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
        void persistAndQueue(value, 2, 'correct', item.spanishDisplay ?? item.spanish, {
          counts: optimisticCounts, unseenCount: optimisticCounts.unseen,
          stats: { ...drill.stats, correct: drill.stats.correct + 1, promoted: drill.stats.promoted + (lastMoveType ? 1 : 0) },
          lastMove, lastMoveType,
        })
      } else {
        if (item.bucket === 'learned') { optimisticCounts.learned -= 1; optimisticCounts.learning += 1 }
        else if (item.bucket === 'mastered') { optimisticCounts.mastered -= 1; optimisticCounts.learning += 1 }
        void persistAndQueue(value, 2, 'revealed', item.spanishDisplay ?? item.spanish, {
          counts: optimisticCounts,
          stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
          lastMove: item.bucket === 'learning' ? null : '↓ Demoted to Learning',
          lastMoveType: item.bucket === 'learning' ? null : 'demote',
        })
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    if (isReviewing) {
      // Don't advance until the queued next item is ready
      if (pendingSync) return
      advanceToQueued()
      return
    }
    const normalizedInput = normalize(input)
    const expected = item.spanishNormalized ?? normalize(item.spanish)
    const isBlank = normalizedInput === ''
    const isCorrect = normalizedInput === expected

    if (phase === 'answering') {
      if (isBlank) {
        const optimisticCounts = { ...drill.counts }
        if (item.bucket === 'learned') { optimisticCounts.learned -= 1; optimisticCounts.learning += 1 }
        else if (item.bucket === 'mastered') { optimisticCounts.mastered -= 1; optimisticCounts.learning += 1 }
        void persistAndQueue('', 1, 'revealed', item.spanishDisplay ?? item.spanish, {
          counts: optimisticCounts,
          stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
          lastMove: item.bucket === 'learning' ? null : '↓ Demoted to Learning',
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
      void persistAndQueue(input, 1, 'correct', item.spanishDisplay ?? item.spanish, {
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
        void persistAndQueue(input, 2, 'correct', item.spanishDisplay ?? item.spanish, {
          counts: optimisticCounts,
          unseenCount: optimisticCounts.unseen,
          stats: { ...drill.stats, correct: drill.stats.correct + 1, promoted: drill.stats.promoted + (lastMoveType ? 1 : 0) },
          lastMove,
          lastMoveType,
        })
        return
      }
      const optimisticCounts = { ...drill.counts }
      if (item.bucket === 'learned') { optimisticCounts.learned -= 1; optimisticCounts.learning += 1 }
      else if (item.bucket === 'mastered') { optimisticCounts.mastered -= 1; optimisticCounts.learning += 1 }
      void persistAndQueue(input, 2, 'revealed', item.spanishDisplay ?? item.spanish, {
        counts: optimisticCounts,
        stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
        lastMove: item.bucket === 'learning' ? null : '↓ Demoted to Learning',
        lastMoveType: item.bucket === 'learning' ? null : 'demote',
      })
    }
  }

  if (loading) return <div className="app"><p>Loading Adaptive Spanish…</p></div>

  if (!username) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Adaptive Spanish</h1>
          <p className="tagline">Choose a username to begin.</p>
        </header>
        <main className="app-main">
          <section className="drill-panel">
            <form onSubmit={bootstrapUser} className="drill-form">
              <input
                type="text"
                className="drill-input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="username"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button type="submit" className="btn btn-submit">Continue</button>
            </form>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Adaptive Spanish</h1>
        <p className="tagline">Make your practice count.</p>
        <div className="session-stats" style={{ marginTop: 8 }}>
          <span className="stat">user: {username}</span>
          <span className="stat-sep">·</span>
          <button
            className={`category-toggle${voiceMode ? ' category-toggle-active' : ' category-toggle-soon'}`}
            type="button"
            onClick={() => setVoiceMode(v => !v)}
            title={voiceMode ? 'Switch to typing' : 'Switch to voice'}
          >
            {voiceMode ? '🎙 Voice' : '⌨️ Type'}
          </button>
          <span className="stat-sep">·</span>
          <button className="category-toggle category-toggle-soon" type="button" onClick={() => { clearStoredUsername(); setUsername(null); setDrill(emptyState); }}>switch user</button>
          {role === 'teacher' && (
            <>
              <span className="stat-sep">·</span>
              <a href="/instructor" className="category-toggle category-toggle-soon" style={{ textDecoration: 'none' }}>Instructor Portal</a>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="category-toggles">
          <button
            className={`category-toggle${mode === 'vocab' ? ' category-toggle-active' : ' category-toggle-soon'}`}
            type="button"
            onClick={() => setMode('vocab')}
          >
            Vocab
          </button>
          <button
            className={`category-toggle${mode === 'verbs' ? ' category-toggle-active' : ' category-toggle-soon'}`}
            type="button"
            onClick={() => setMode('verbs')}
          >
            Verbs
          </button>
          <button
            className={`category-toggle${mode === 'phrases' ? ' category-toggle-active' : ' category-toggle-soon'}`}
            type="button"
            onClick={() => setMode('phrases')}
          >
            Phrases
          </button>
        </div>

        {mode !== 'verbs' && <div className="bucket-cards">
          {([
            ['Learning', 'learning'],
            ['Learned', 'learned'],
            ['Mastered', 'mastered'],
          ] as [string, string][]).map(([label, key]) => {
            const bucketKey = key as 'learning' | 'learned' | 'mastered'
            const wordsPrimary = mode !== 'phrases'
            return (
              <div
                key={key}
                className={`bucket-card bucket-card-${key}`}
                onMouseLeave={() => {
                  hoverTimeoutRef.current = setTimeout(() => {
                    setHoveredBucket(null)
                    setPopoverAnchorRect(null)
                  }, 200)
                }}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                }}
              >
                <div className="bucket-name">{label}</div>
                <div className="bucket-sub-counts">
                  <div className="bucket-sub">
                    <span
                      className={`bucket-sub-num${wordsPrimary ? '' : ' bucket-sub-num-muted'}`}
                      style={{ cursor: drill.counts[bucketKey] > 0 ? 'pointer' : 'default' }}
                      onMouseEnter={e => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                        if (drill.counts[bucketKey] > 0) {
                          setHoveredBucket(bucketKey)
                          setPopoverAnchorRect((e.target as HTMLElement).getBoundingClientRect())
                        }
                      }}
                    >{drill.counts[bucketKey]}</span>
                    <span className="bucket-sub-label">words</span>
                  </div>
                  <div className="bucket-sub-divider" />
                  <div className="bucket-sub">
                    <span
                      className={`bucket-sub-num${wordsPrimary ? ' bucket-sub-num-muted' : ''}`}
                      style={{ cursor: phraseCounts[bucketKey] > 0 ? 'pointer' : 'default' }}
                      onMouseEnter={e => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                        if (phraseCounts[bucketKey] > 0) {
                          setHoveredBucket(bucketKey)
                          setPopoverAnchorRect((e.target as HTMLElement).getBoundingClientRect())
                        }
                      }}
                    >{phraseCounts[bucketKey]}</span>
                    <span className="bucket-sub-label">phrases</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>}

        {mode === 'vocab' && drill.unseenCount > 0 && <p className="unseen-note">{drill.unseenCount} words not yet introduced</p>}
        {mode === 'phrases' && phraseCounts.unseen > 0 && <p className="unseen-note">{phraseCounts.unseen} phrases not yet introduced</p>}

        {mode === 'vocab' ? (
          <>
            {!item ? (
              <section className="drill-panel"><div className="all-done"><div className="all-done-icon">🎉</div><div className="all-done-text">All words mastered!</div></div></section>
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

                {voiceMode && !isReviewing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <VoiceInput
                      key={item.id}
                      language="es"
                      onTranscript={handleVoiceTranscript}
                      disabled={isReviewing || pendingSync}
                      autoStart={true}
                      hint={item.spanishDisplay ?? item.spanish}
                    />
                    <p className="drill-hint">Speak your answer in Spanish</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="drill-form">
                    <input
                      ref={inputRef}
                      type="text"
                      className={`drill-input${phase === 'wrong-first' ? ' input-wrong' : ''}`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={phase === 'wrong-first' ? 'Try again…' : 'Type Spanish…'}
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
                )}

                {isReviewing && (
                  <form onSubmit={handleSubmit} className="drill-form" style={{ marginTop: 8 }}>
                    <button ref={nextBtnRef} type="submit" className="btn btn-submit btn-next" style={{ width: '100%' }}>
                      {pendingSync ? 'Saving…' : 'Next →'}
                    </button>
                  </form>
                )}

                <p className="drill-hint">
                  {!voiceMode && phase === 'answering' && 'Enter to check · blank Enter to skip & reveal'}
                  {!voiceMode && phase === 'wrong-first' && 'Last chance · blank Enter to reveal answer'}
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
          </>
        ) : mode === 'verbs' ? (
          <VerbDrillApp username={username} onAnswer={() => setHeatmapKey(k => k + 1)} />
        ) : (
          <PhraseDrillApp username={username} onCounts={setPhraseCounts} onAnswer={() => setHeatmapKey(k => k + 1)} selectedTags={selectedPhraseTags} onItemChange={setCurrentPhraseItem} />
        )}
      </main>

      {/* Vocab tab: mastered-by-day bar chart only */}
      {mode === 'vocab' && <MasteredChart username={username} />}

      {/* Verbs tab: conjugation heatmap only */}
      {mode === 'verbs' && <ConjugationHeatmap username={username} refreshKey={heatmapKey} />}

      {/* Phrases tab: grammar progress heatmap + phrases mastered chart */}
      {mode === 'phrases' && (
        <>
          <GrammarHeatmap username={username} refreshKey={heatmapKey} selectedTags={selectedPhraseTags} onTagToggle={togglePhraseTag} onTagToggleAll={toggleAllPhraseTags} />
          <MasteredChartPhrases username={username} />
        </>
      )}

      {isAdmin && mode !== 'verbs' && (
        <AdminPanel
          username={username}
          mode={mode}
          item={mode === 'phrases'
            ? currentPhraseItem
            : item ? { id: item.id, english: item.english, spanish: item.spanish, spanishDisplay: item.spanishDisplay, emoji: item.emoji } : null}
        />
      )}

      {hoveredBucket && popoverAnchorRect && (
        <BucketPopover
          username={username}
          bucket={hoveredBucket}
          mode={mode === 'phrases' ? 'phrases' : 'vocab'}
          excludeId={null}
          anchorRect={popoverAnchorRect}
          currentItem={item ? { spanish: item.spanish ?? item.english, english: item.english } : null}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
          }}
          onMouseLeave={() => {
            hoverTimeoutRef.current = setTimeout(() => {
              setHoveredBucket(null)
              setPopoverAnchorRect(null)
            }, 200)
          }}
        />
      )}
    </div>
  )
}
