'use client'

import { useEffect, useRef, useState } from 'react'
import { playWrongSound } from '@/lib/sounds'
import VoiceInput from './VoiceInput'

const ALL_TAGS = [
  'survival','ser-estar','tener-expressions','hacer-expressions','reflexive',
  'gustar-type','verb-infinitive','progressive','object-pronouns','por-para',
  'negative-constructions','hay-que-impersonal','unintentional','subjunctive',
  'conditional','idioms-discourse',
]

const TAG_LABELS: Record<string, string> = {
  'survival': 'Survival',
  'ser-estar': 'Ser vs. Estar',
  'tener-expressions': 'Tener Expressions',
  'hacer-expressions': 'Hacer Expressions',
  'reflexive': 'Reflexive Verbs',
  'gustar-type': 'Gustar-type',
  'verb-infinitive': 'Verb + Infinitive',
  'progressive': 'Progressive',
  'object-pronouns': 'Object Pronouns',
  'por-para': 'Por vs. Para',
  'negative-constructions': 'Negatives',
  'hay-que-impersonal': 'Hay que / Impersonal',
  'unintentional': 'Unintentional se',
  'subjunctive': 'Subjunctive',
  'conditional': 'Conditional / Si',
  'idioms-discourse': 'Idioms & Discourse',
}

type Bucket = 'unseen' | 'learning' | 'learned' | 'mastered'
type MoveType = 'promote' | 'master' | 'demote' | null
type Phase = 'answering' | 'wrong-first' | 'correct' | 'revealed'

type PhraseDrillItem = {
  id: string
  english: string
  spanish: string
  grammarTag: string
  grammarNote: string | null
  bucket: Bucket
  score: number
}

type PhraseDrillState = {
  item: PhraseDrillItem | null
  counts: { learning: number; learned: number; mastered: number; unseen: number }
  unseenCount: number
  stats: { correct: number; wrong: number; promoted: number; demoted: number }
  lastMove: string | null
  lastMoveType: MoveType
}

const emptyState: PhraseDrillState = {
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
    .replace(/[\u00bf\u00a1]/g, '')
    .replace(/[.,!?;:\u201c\u201d\u2018\u2019'"]/g, '')
    .replace(/\s+/g, ' ').trim()
}

interface Props {
  username: string
  onCounts?: (counts: { learning: number; learned: number; mastered: number; unseen: number }) => void
  onAnswer?: () => void
  selectedTags?: string[]
  onItemChange?: (item: { id: string; english: string; spanish: string; grammarTag: string; grammarNote: string | null } | null) => void
}

export default function PhraseDrillApp({ username, onCounts, onAnswer, selectedTags = ALL_TAGS, onItemChange }: Props) {
  const [drill, setDrill] = useState<PhraseDrillState>(emptyState)
  const [phase, setPhase] = useState<Phase>('answering')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [grammarNote, setGrammarNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingSync, setPendingSync] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [queuedNext, setQueuedNext] = useState<PhraseDrillState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)

  const item = drill.item
  const currentBucket = item?.bucket
  const isReviewing = phase === 'correct' || phase === 'revealed'
  const anyStats = drill.stats.correct + drill.stats.wrong > 0
  const toastKey = drill.lastMove ? `${drill.lastMove}-${drill.stats.promoted}-${drill.stats.demoted}` : ''

  useEffect(() => {
    onItemChange?.(item ? { id: item.id, english: item.english, spanish: item.spanish, grammarTag: item.grammarTag, grammarNote: item.grammarNote } : null)
  }, [item?.id])

  const tagsKey = [...selectedTags].sort().join(',')

  useEffect(() => {
    setLoading(true)
    setDrill(emptyState)
    setPhase('answering')
    setInput('')
    setAnswer(null)
    setGrammarNote(null)
    const tagsParam = selectedTags.join(',')
    fetch(`/api/phrases/drill/init?username=${encodeURIComponent(username)}&tags=${tagsParam}`).then(r => r.json()).then((data: PhraseDrillState) => {
      setDrill(data)
      setLoading(false)
      onCounts?.(data.counts)
    })
  }, [username, tagsKey])

  useEffect(() => {
    if (isReviewing) nextBtnRef.current?.focus()
    else inputRef.current?.focus()
  }, [isReviewing, phase, item?.id])

  async function persistAndQueue(answerValue: string, attemptNumber: number, optimisticPhase: Phase, optimisticAnswer: string | null, optimisticState?: Partial<PhraseDrillState>) {
    if (!item) return
    if (optimisticState) setDrill(prev => ({ ...prev, ...optimisticState }))
    setPhase(optimisticPhase)
    setAnswer(optimisticAnswer)
    setInput('')
    setPendingSync(true)
    try {
      const res = await fetch('/api/phrases/drill/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phraseId: item.id, answer: answerValue, attemptNumber, tags: selectedTags.join(',') }),
      })
      const data = await res.json()
      if (data.phase !== 'wrong-first') {
        setGrammarNote(data.grammarNote ?? null)
        setQueuedNext({ item: data.item, counts: data.counts, unseenCount: data.unseenCount, stats: data.stats, lastMove: data.lastMove, lastMoveType: data.lastMoveType })
        onCounts?.(data.counts)
        onAnswer?.()
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
    setPhase('answering')
    setAnswer(null)
    setGrammarNote(null)
    setInput('')
  }

  function submitWithValue(value: string) {
    if (!item || isReviewing) return
    const normalizedInput = normalize(value)
    const expected = normalize(item.spanish)
    const isBlank = normalizedInput === ''
    const isCorrect = normalizedInput === expected

    if (phase === 'answering') {
      if (isBlank) {
        const optimisticCounts = { ...drill.counts }
        if (item.bucket === 'learned') { optimisticCounts.learned -= 1; optimisticCounts.learning += 1 }
        else if (item.bucket === 'mastered') { optimisticCounts.mastered -= 1; optimisticCounts.learning += 1 }
        playWrongSound()
        void persistAndQueue('', 1, 'revealed', item.spanish, {
          counts: optimisticCounts,
          stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
          lastMove: item.bucket === 'learning' ? null : '↓ Demoted to Learning',
          lastMoveType: item.bucket === 'learning' ? null : 'demote',
        })
        return
      }
      if (!isCorrect) { playWrongSound(); setPhase('wrong-first'); setInput(''); return }
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
      void persistAndQueue(value, 1, 'correct', item.spanish, {
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
        void persistAndQueue(value, 2, 'correct', item.spanish, {
          counts: optimisticCounts, unseenCount: optimisticCounts.unseen,
          stats: { ...drill.stats, correct: drill.stats.correct + 1, promoted: drill.stats.promoted + (lastMoveType ? 1 : 0) },
          lastMove, lastMoveType,
        })
      } else {
        if (item.bucket === 'learned') { optimisticCounts.learned -= 1; optimisticCounts.learning += 1 }
        else if (item.bucket === 'mastered') { optimisticCounts.mastered -= 1; optimisticCounts.learning += 1 }
        playWrongSound()
        void persistAndQueue(value, 2, 'revealed', item.spanish, {
          counts: optimisticCounts,
          stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
          lastMove: item.bucket === 'learning' ? null : '↓ Demoted to Learning',
          lastMoveType: item.bucket === 'learning' ? null : 'demote',
        })
      }
    }
  }

  function handleVoiceTranscript(text: string) {
    setInput(text)
    setVoiceMode(false)
    setTimeout(() => {
      submitWithValue(text)
      setTimeout(() => setVoiceMode(true), 600)
    }, 1500)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    if (isReviewing) {
      if (pendingSync) return
      advanceToQueued()
      return
    }
    const normalizedInput = normalize(input)
    const expected = normalize(item.spanish)
    const isBlank = normalizedInput === ''
    const isCorrect = normalizedInput === expected

    if (phase === 'answering') {
      if (isBlank) {
        const optimisticCounts = { ...drill.counts }
        if (item.bucket === 'learned') { optimisticCounts.learned -= 1; optimisticCounts.learning += 1 }
        else if (item.bucket === 'mastered') { optimisticCounts.mastered -= 1; optimisticCounts.learning += 1 }
        playWrongSound()
        void persistAndQueue('', 1, 'revealed', item.spanish, {
          counts: optimisticCounts,
          stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
          lastMove: item.bucket === 'learning' ? null : '↓ Demoted to Learning',
          lastMoveType: item.bucket === 'learning' ? null : 'demote',
        })
        return
      }
      if (!isCorrect) { playWrongSound(); setPhase('wrong-first'); setInput(''); return }
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
      void persistAndQueue(input, 1, 'correct', item.spanish, {
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
        void persistAndQueue(input, 2, 'correct', item.spanish, {
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
      playWrongSound()
      void persistAndQueue(input, 2, 'revealed', item.spanish, {
        counts: optimisticCounts,
        stats: { ...drill.stats, wrong: drill.stats.wrong + 1, demoted: drill.stats.demoted + (item.bucket === 'learning' ? 0 : 1) },
        lastMove: item.bucket === 'learning' ? null : '↓ Demoted to Learning',
        lastMoveType: item.bucket === 'learning' ? null : 'demote',
      })
    }
  }

  return (
    <>
      {loading ? <section className="drill-panel"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading phrases…</p></section> : <>
      {!item ? (
        <section className="drill-panel">
          <div className="all-done">
            <div className="all-done-icon">{drill.unseenCount > 0 ? '⏳' : '🎉'}</div>
            <div className="all-done-text">{drill.unseenCount > 0 ? 'Loading next phrase…' : 'All phrases mastered!'}</div>
          </div>
        </section>
      ) : (
        <section className="drill-panel">
          {drill.lastMove && <div key={toastKey} className={`move-toast move-toast-${drill.lastMoveType}`}>{drill.lastMove}</div>}
          <div className="drill-card">
            <div className="drill-prompt" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.4 }}>{item.english}</div>
            <div className={`drill-bucket-tag bucket-tag-${currentBucket}`}>{cap(currentBucket!)}</div>
          </div>

          {phase === 'wrong-first' && <div className="feedback feedback-wrong"><span className="feedback-icon">✗</span><span>Not quite — one more chance</span><span className="feedback-attempt">2 / 2</span></div>}
          {phase === 'correct' && (
            <div>
              <div className="feedback feedback-correct"><span className="feedback-icon">✓</span><span>Correct! <span className="answer-word">{answer}</span></span></div>
              {grammarNote && <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>{grammarNote}</p>}
            </div>
          )}
          {phase === 'revealed' && (
            <div>
              <div className="feedback feedback-revealed"><span className="feedback-icon">→</span><span>Answer: <span className="answer-word">{answer}</span></span></div>
              {grammarNote && <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>{grammarNote}</p>}
            </div>
          )}

          {voiceMode && !isReviewing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <VoiceInput
                key={item.id}
                language="es"
                onTranscript={handleVoiceTranscript}
                disabled={isReviewing || pendingSync}
                autoStart={true}
                hint={item.spanish}
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
          <button
            className={`category-toggle${voiceMode ? ' category-toggle-active' : ' category-toggle-soon'}`}
            type="button"
            onClick={() => setVoiceMode(v => !v)}
            title={voiceMode ? 'Switch to typing' : 'Switch to voice'}
          >
            {voiceMode ? '🎙 Voice' : '⌨️ Type'}
          </button>
        </div>
      )}
      </>}
    </>
  )
}
