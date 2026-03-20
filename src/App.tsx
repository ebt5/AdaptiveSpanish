import { useEffect, useReducer, useRef } from 'react'
import './App.css'

// ── Vocabulary dataset ────────────────────────────────────────────────────────

interface VocabItem {
  id: number
  english: string
  spanish: string
  emoji: string
}

const VOCAB: VocabItem[] = [
  { id:  1, english: 'apple',    spanish: 'manzana',  emoji: '🍎' },
  { id:  2, english: 'water',    spanish: 'agua',     emoji: '💧' },
  { id:  3, english: 'house',    spanish: 'casa',     emoji: '🏠' },
  { id:  4, english: 'dog',      spanish: 'perro',    emoji: '🐕' },
  { id:  5, english: 'cat',      spanish: 'gato',     emoji: '🐈' },
  { id:  6, english: 'book',     spanish: 'libro',    emoji: '📚' },
  { id:  7, english: 'car',      spanish: 'coche',    emoji: '🚗' },
  { id:  8, english: 'sun',      spanish: 'sol',      emoji: '☀️' },
  { id:  9, english: 'moon',     spanish: 'luna',     emoji: '🌙' },
  { id: 10, english: 'friend',   spanish: 'amigo',    emoji: '🤝' },
  { id: 11, english: 'food',     spanish: 'comida',   emoji: '🍽️' },
  { id: 12, english: 'school',   spanish: 'escuela',  emoji: '🏫' },
  { id: 13, english: 'love',     spanish: 'amor',     emoji: '❤️' },
  { id: 14, english: 'time',     spanish: 'tiempo',   emoji: '⏰' },
  { id: 15, english: 'music',    spanish: 'música',   emoji: '🎵' },
  { id: 16, english: 'city',     spanish: 'ciudad',   emoji: '🏙️' },
  { id: 17, english: 'night',    spanish: 'noche',    emoji: '🌃' },
  { id: 18, english: 'fire',     spanish: 'fuego',    emoji: '🔥' },
  { id: 19, english: 'tree',     spanish: 'árbol',    emoji: '🌳' },
  { id: 20, english: 'hand',     spanish: 'mano',     emoji: '✋' },
  { id: 21, english: 'eye',      spanish: 'ojo',      emoji: '👁️' },
  { id: 22, english: 'bread',    spanish: 'pan',      emoji: '🍞' },
  { id: 23, english: 'fish',     spanish: 'pez',      emoji: '🐟' },
  { id: 24, english: 'bird',     spanish: 'pájaro',   emoji: '🐦' },
  { id: 25, english: 'door',     spanish: 'puerta',   emoji: '🚪' },
  { id: 26, english: 'table',    spanish: 'mesa',     emoji: '🪑' },
  { id: 27, english: 'flower',   spanish: 'flor',     emoji: '🌸' },
  { id: 28, english: 'star',     spanish: 'estrella', emoji: '⭐' },
  { id: 29, english: 'milk',     spanish: 'leche',    emoji: '🥛' },
  { id: 30, english: 'key',      spanish: 'llave',    emoji: '🔑' },
]

const LEARNING_TARGET = 20
const TOTAL = VOCAB.length
const vocabById = Object.fromEntries(VOCAB.map(v => [v.id, v])) as Record<number, VocabItem>

// ── State / reducer ───────────────────────────────────────────────────────────

type Bucket   = 'unseen' | 'learning' | 'learned' | 'mastered'
type Phase    = 'answering' | 'wrong-first' | 'correct' | 'revealed'
type MoveType = 'promote' | 'master' | 'demote' | null

interface SessionStats {
  correct:  number
  wrong:    number
  promoted: number
  demoted:  number
}

interface State {
  buckets:      Record<number, Bucket>
  queue:        number[]
  unseenPool:   number[]
  phase:        Phase
  input:        string
  stats:        SessionStats
  lastMove:     string | null
  lastMoveType: MoveType
}

function buildInitialState(): State {
  const buckets: Record<number, Bucket> = {}
  const queue: number[] = []
  const unseenPool: number[] = []
  VOCAB.forEach((item, i) => {
    if (i < LEARNING_TARGET) {
      buckets[item.id] = 'learning'
      queue.push(item.id)
    } else {
      buckets[item.id] = 'unseen'
      unseenPool.push(item.id)
    }
  })
  return {
    buckets, queue, unseenPool, phase: 'answering', input: '',
    stats: { correct: 0, wrong: 0, promoted: 0, demoted: 0 },
    lastMove: null, lastMoveType: null,
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

type Action =
  | { type: 'SET_INPUT'; value: string }
  | { type: 'SUBMIT' }
  | { type: 'NEXT' }

function reducer(state: State, action: Action): State {
  const { buckets, queue, unseenPool, phase, input, stats } = state

  if (action.type === 'SET_INPUT') {
    return { ...state, input: action.value }
  }

  if (queue.length === 0) return state
  const currentId = queue[0]
  const item      = vocabById[currentId]

  if (action.type === 'SUBMIT') {
    if (phase !== 'answering' && phase !== 'wrong-first') return state
    const trimmed   = normalize(input)
    const isBlank   = trimmed === ''
    const isCorrect = trimmed === normalize(item.spanish)

    if (phase === 'answering') {
      if (isBlank)   return { ...state, phase: 'revealed',    input: '' }
      if (isCorrect) return { ...state, phase: 'correct',     input: '' }
      return               { ...state, phase: 'wrong-first',  input: '' }
    }
    // wrong-first: one more chance
    if (isBlank || !isCorrect) return { ...state, phase: 'revealed', input: '' }
    return { ...state, phase: 'correct', input: '' }
  }

  if (action.type === 'NEXT') {
    const success       = phase === 'correct'
    const currentBucket = buckets[currentId]
    const newBuckets    = { ...buckets }
    let newQueue        = queue.slice(1)
    let newUnseenPool   = [...unseenPool]
    let lastMove: string | null = null
    let lastMoveType: MoveType  = null
    const newStats = { ...stats }

    if (success) {
      newStats.correct++
      if (currentBucket === 'learning') {
        newBuckets[currentId] = 'learned'
        newQueue = [...newQueue, currentId]
        lastMove     = '↑ Promoted to Learned'
        lastMoveType = 'promote'
        newStats.promoted++
        // Replenish Learning toward target
        const learningCount = Object.values(newBuckets).filter(b => b === 'learning').length
        if (learningCount < LEARNING_TARGET && newUnseenPool.length > 0) {
          const newId   = newUnseenPool[0]
          newUnseenPool = newUnseenPool.slice(1)
          newBuckets[newId] = 'learning'
          newQueue = [...newQueue, newId]
        }
      } else if (currentBucket === 'learned') {
        newBuckets[currentId] = 'mastered'
        lastMove     = '★ Mastered!'
        lastMoveType = 'master'
        newStats.promoted++
      }
    } else {
      newStats.wrong++
      if (currentBucket === 'mastered') {
        newBuckets[currentId] = 'learned'
        lastMove     = '↓ Demoted to Learned'
        lastMoveType = 'demote'
        newStats.demoted++
      } else if (currentBucket === 'learned') {
        newBuckets[currentId] = 'learning'
        lastMove     = '↓ Demoted to Learning'
        lastMoveType = 'demote'
        newStats.demoted++
      }
      // learning stays learning — no demotion message needed
      newQueue = [...newQueue, currentId]
    }

    return {
      ...state,
      buckets: newBuckets, queue: newQueue, unseenPool: newUnseenPool,
      phase: 'answering', input: '',
      stats: newStats, lastMove, lastMoveType,
    }
  }

  return state
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countBuckets(buckets: Record<number, Bucket>) {
  const c = { unseen: 0, learning: 0, learned: 0, mastered: 0 }
  for (const b of Object.values(buckets)) c[b]++
  return c
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState)
  const inputRef   = useRef<HTMLInputElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)

  const { buckets, queue, unseenPool, phase, input, stats, lastMove, lastMoveType } = state
  const counts        = countBuckets(buckets)
  const currentId     = queue[0]
  const item          = currentId !== undefined ? vocabById[currentId] : null
  const currentBucket = item ? buckets[item.id] : null
  const isReviewing   = phase === 'correct' || phase === 'revealed'
  const anyStats      = stats.correct + stats.wrong > 0

  useEffect(() => {
    if (isReviewing) {
      nextBtnRef.current?.focus()
    } else {
      inputRef.current?.focus()
    }
  }, [phase, currentId, isReviewing])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    dispatch({ type: isReviewing ? 'NEXT' : 'SUBMIT' })
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Adaptive Spanish</h1>
        <p className="tagline">Type the Spanish. Earn your way up.</p>
      </header>

      <main className="app-main">

        {/* ── Bucket cards ─────────────────────────────────────────────────── */}
        <div className="bucket-cards">
          {([
            ['Learning', 'learning', counts.learning],
            ['Learned',  'learned',  counts.learned ],
            ['Mastered', 'mastered', counts.mastered],
          ] as [string, string, number][]).map(([label, key, count]) => (
            <div key={key} className={`bucket-card bucket-card-${key}`}>
              <div className="bucket-count">{count}</div>
              <div className="bucket-name">{label}</div>
            </div>
          ))}
        </div>
        {unseenPool.length > 0 && (
          <p className="unseen-note">{unseenPool.length} words not yet introduced</p>
        )}

        {/* ── Drill panel ───────────────────────────────────────────────────── */}
        {queue.length === 0 ? (
          <section className="drill-panel">
            <div className="all-done">
              <div className="all-done-icon">🎉</div>
              <div className="all-done-text">All {TOTAL} words mastered!</div>
              {anyStats && (
                <div className="all-done-sub">
                  {stats.correct} correct · {stats.wrong} wrong · {stats.promoted} promoted
                </div>
              )}
            </div>
          </section>
        ) : item && currentBucket ? (
          <section className="drill-panel">

            {/* Move result from previous card */}
            {lastMove && (
              <div className={`move-toast move-toast-${lastMoveType}`}>
                {lastMove}
              </div>
            )}

            {/* Prompt card */}
            <div className="drill-card">
              <div className="drill-emoji">{item.emoji}</div>
              <div className="drill-prompt">{item.english}</div>
              <div className={`drill-bucket-tag bucket-tag-${currentBucket}`}>
                {cap(currentBucket)}
              </div>
            </div>

            {/* Per-attempt feedback */}
            {phase === 'wrong-first' && (
              <div className="feedback feedback-wrong">
                Not quite — one more try
              </div>
            )}
            {phase === 'correct' && (
              <div className="feedback feedback-correct">
                Correct! <span className="answer-word">{item.spanish}</span>
              </div>
            )}
            {phase === 'revealed' && (
              <div className="feedback feedback-revealed">
                Answer: <span className="answer-word">{item.spanish}</span>
              </div>
            )}

            {/* Input row */}
            <form onSubmit={handleSubmit} className="drill-form">
              <input
                ref={inputRef}
                type="text"
                className={`drill-input${phase === 'wrong-first' ? ' input-shake' : ''}`}
                value={input}
                onChange={e => dispatch({ type: 'SET_INPUT', value: e.target.value })}
                placeholder={phase === 'wrong-first' ? 'Try again…' : 'Type Spanish…'}
                disabled={isReviewing}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button
                ref={nextBtnRef}
                type="submit"
                className={`btn btn-submit${isReviewing ? ' btn-next' : ''}`}
              >
                {isReviewing ? 'Next →' : 'Check'}
              </button>
            </form>

            <p className="drill-hint">
              {phase === 'answering'   && 'Enter to check · blank Enter to reveal'}
              {phase === 'wrong-first' && 'One more try · blank Enter to reveal'}
              {isReviewing             && 'Enter or click Next to continue'}
            </p>
          </section>
        ) : null}

        {/* ── Session stats ────────────────────────────────────────────────── */}
        {anyStats && (
          <div className="session-stats">
            <span className="stat stat-correct">✓ {stats.correct}</span>
            <span className="stat-sep">·</span>
            <span className="stat stat-wrong">✗ {stats.wrong}</span>
            <span className="stat-sep">·</span>
            <span className="stat stat-promoted">↑ {stats.promoted}</span>
            <span className="stat-sep">·</span>
            <span className="stat stat-demoted">↓ {stats.demoted}</span>
          </div>
        )}

      </main>
    </div>
  )
}
