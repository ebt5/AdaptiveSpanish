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
import { playMasteredSound, playLearnedSound, playWrongSound, playLevelUpSound } from '@/lib/sounds'
import { clientWeightedPick, clientNormalize } from '@/lib/drill-client'
import type { LevelState } from '@/lib/levels'
import { LEVEL_BACKGROUNDS } from '@/lib/levels'

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
  exampleEs?: string | null
  exampleEn?: string | null
  imageUrl?: string | null
  bucket: Bucket | string
  score: number
}

type DrillState = {
  item: DrillItem | null
  counts: { learning: number; learned: number; mastered: number; unseen: number }
  unseenCount: number
  pool?: DrillItem[]
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
  const [pool, setPool] = useState<DrillItem[]>([])
  const [serverSynced, setServerSynced] = useState(true)
  const [masteredOnly, setMasteredOnly] = useState(false)
  const [showBgInfo, setShowBgInfo] = useState(false)
  const [levelState, setLevelState] = useState<LevelState | null>(null)
  const [showLevelUp, setShowLevelUp] = useState<LevelState | null>(null)
  const prevLevelRef = useRef<number | null>(null)
  const [showcaseIndex, setShowcaseIndex] = useState(0)   // which bg is shown in showcase
  const [activeBgIndex, setActiveBgIndex] = useState(0)   // which bg is the active wallpaper
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
  const [showingTranscript, setShowingTranscript] = useState(false)
  const [animatedBucket, setAnimatedBucket] = useState<'mastered' | 'learned' | null>(null)
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

  // Fetch level state
  useEffect(() => {
    if (!username) return
    fetch(`/api/level?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then((data: LevelState) => {
        prevLevelRef.current = data.totalLevel
        setLevelState(data)
      })
  }, [username])

  // Refresh level after each drill answer — detect level-ups
  function refreshLevel() {
    if (!username) return
    fetch(`/api/level?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then((data: LevelState) => {
        if (prevLevelRef.current !== null && data.totalLevel > prevLevelRef.current) {
          // Level up!
          setShowLevelUp(data)
          playLevelUpSound()
        }
        prevLevelRef.current = data.totalLevel
        setLevelState(data)
      })
  }

  // Set activeBgIndex when level state loads (default to current level's bg)
  useEffect(() => {
    if (levelState) {
      const idx = Math.min(levelState.totalLevel - 1, LEVEL_BACKGROUNDS.length - 1)
      setActiveBgIndex(idx)
    }
  }, [levelState?.totalLevel])

  // Add background when logged in — use activeBgIndex
  useEffect(() => {
    if (username) {
      document.body.classList.add('has-bg')
      const bg = LEVEL_BACKGROUNDS[activeBgIndex]
      if (bg?.image) {
        document.body.style.backgroundImage = `url('${bg.image}')`
      } else {
        document.body.style.backgroundImage = 'none'
        document.body.style.background = '#000'
      }
    } else {
      document.body.classList.remove('has-bg')
      document.body.style.backgroundImage = ''
      document.body.style.background = ''
    }
    return () => {
      document.body.classList.remove('has-bg')
      document.body.style.backgroundImage = ''
      document.body.style.background = ''
    }
  }, [username, activeBgIndex])

  useEffect(() => {
    if (!username) return
    setLoading(true)
    // Load drill state + check admin status in parallel
    Promise.all([
      fetch(`/api/drill/init?username=${encodeURIComponent(username)}`).then(r => r.json()),
      fetch('/api/user/bootstrap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) }).then(r => r.json()),
    ]).then(([drillData, userData]) => {
      setDrill(drillData)
      if (drillData.pool) setPool(drillData.pool)
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

  useEffect(() => {
    if (drill.lastMoveType === 'master') {
      playMasteredSound()
      setAnimatedBucket('mastered')
      setTimeout(() => setAnimatedBucket(null), 700)
    } else if (drill.lastMoveType === 'promote') {
      playLearnedSound()
      setAnimatedBucket('learned')
      setTimeout(() => setAnimatedBucket(null), 500)
    }
  }, [drill.lastMoveType, drill.lastMove])

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

  // Fire-and-forget server sync — never blocks UI
  function serverSync(entryId: string, answerValue: string, attemptNumber: number) {
    fetch('/api/drill/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, entryId, answer: answerValue, attemptNumber }),
    }).then(r => r.json()).then(data => {
      // Update pool from server (authoritative)
      if (data.pool) setPool(data.pool)
    }).catch(() => {})
  }

  function persistAndQueue(answerValue: string, attemptNumber: number, optimisticPhase: Phase, optimisticAnswer: string | null, optimisticState?: Partial<DrillState>) {
    if (!item || !username) return
    const currentItemId = item.id

    // Update UI immediately
    if (optimisticState) setDrill(prev => ({ ...prev, ...optimisticState }))
    setPhase(optimisticPhase)
    setAnswer(optimisticAnswer)
    setInput('')

    // Pick next item from pool instantly — exclude current item
    const isMasteredMiss = optimisticState?.lastMoveType === 'demote' && item.bucket === 'mastered'
    const activePool = masteredOnly ? pool.filter(p => p.bucket === 'mastered') : pool
    const nextItem = clientWeightedPick(activePool, currentItemId, isMasteredMiss)

    // Also remove current item from pool to prevent repeats
    setPool(prev => prev.filter(p => p.id !== currentItemId))

    if (nextItem) {
      setQueuedNext({
        item: nextItem as any,
        counts: (optimisticState?.counts as any) ?? drill.counts,
        unseenCount: optimisticState?.counts?.unseen ?? drill.unseenCount,
        stats: optimisticState?.stats ?? drill.stats,
        lastMove: optimisticState?.lastMove ?? null,
        lastMoveType: optimisticState?.lastMoveType ?? null,
      })
    }

    // Fire-and-forget server sync
    serverSync(currentItemId, answerValue, attemptNumber)
  }

  function advanceToQueued() {
    if (queuedNext) {
      setDrill({ ...queuedNext, lastMove: null, lastMoveType: null })
      setQueuedNext(null)
    }
    setPhase('answering')
    setAnswer(null)
    setInput('')
    setMilestone(null)
    refreshLevel()
  }

  function handleVoiceTranscript(text: string) {
    // Show transcript AND grade simultaneously
    setInput(text)
    setShowingTranscript(true)
    setVoiceMode(false)
    // Grade immediately
    submitWithValue(text)
    // Re-enable voice after brief display
    setTimeout(() => {
      setShowingTranscript(false)
      setVoiceMode(true)
    }, 600)
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
        playWrongSound()
        void persistAndQueue('', 1, 'revealed', item.spanishDisplay ?? item.spanish, {
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
        playWrongSound()
        void persistAndQueue('', 1, 'revealed', item.spanishDisplay ?? item.spanish, {
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
      playWrongSound()
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
        {levelState && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, marginBottom: 2 }}>
            Level {levelState.totalLevel}
            {mode === 'vocab' && <span> · {levelState.vocabToNext} words to next level</span>}
            {mode === 'phrases' && <span> · {levelState.phrasesToNext} phrases to next level</span>}
            {mode === 'verbs' && levelState.verbNearestTense && (
              <span> · {levelState.verbNearestTense.tense}: {levelState.verbNearestTense.pronounsDone}/{levelState.verbNearestTense.total} pronouns</span>
            )}
          </div>
        )}
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
                className={`bucket-card bucket-card-${key}${animatedBucket === bucketKey ? ` bucket-card-animate-${bucketKey}` : ''}`}
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
        {mode === 'vocab' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={masteredOnly}
                onChange={e => {
                  const val = e.target.checked
                  setMasteredOnly(val)
                  // Re-init pool from server with mastered-only flag for proper sampling
                  if (username) {
                    const url = val
                      ? `/api/drill/init?username=${encodeURIComponent(username)}&masteredOnly=true`
                      : `/api/drill/init?username=${encodeURIComponent(username)}`
                    fetch(url).then(r => r.json()).then(data => {
                      if (data.pool) setPool(data.pool)
                      if (data.item) setDrill(prev => ({ ...prev, item: data.item }))
                    })
                  }
                }}
                style={{ accentColor: 'var(--green)', width: 13, height: 13 }}
              />
              Drill mastered words only
            </label>
          </div>
        )}
        {mode === 'phrases' && phraseCounts.unseen > 0 && <p className="unseen-note">{phraseCounts.unseen} phrases not yet introduced</p>}

        {mode === 'vocab' ? (
          <>
            {!item ? (
              <section className="drill-panel"><div className="all-done"><div className="all-done-icon">🎉</div><div className="all-done-text">All words mastered!</div></div></section>
            ) : (
              <section className="drill-panel">
                {drill.lastMove && <div key={toastKey} className={`move-toast move-toast-${drill.lastMoveType}`}>{drill.lastMove}</div>}
                <div className="drill-card">
                  {item.imageUrl ? (
                    <div style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: 8,
                      marginBottom: 12,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)',
                      display: 'inline-block',
                    }}>
                      <img
                        src={item.imageUrl}
                        alt={item.english}
                        style={{ width: 140, height: 140, borderRadius: 8, display: 'block', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div className="drill-emoji">{item.emoji}</div>
                  )}
                  <div className="drill-prompt">{item.english}</div>
                  {item.exampleEn && <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 6, opacity: 0.8 }}>"{item.exampleEn}"</div>}
                  <div className={`drill-bucket-tag bucket-tag-${currentBucket}`}>
                    {cap(currentBucket!)}
                    {currentBucket === 'mastered' && item.score != null && (
                      <span style={{ opacity: 0.6, fontSize: '0.8em', marginLeft: 5 }}>·{item.score}</span>
                    )}
                  </div>
                </div>

                {phase === 'wrong-first' && <div className="feedback feedback-wrong"><span className="feedback-icon">✗</span><span>Not quite — one more chance</span><span className="feedback-attempt">2 / 2</span></div>}
                {phase === 'correct' && (
                  <div>
                    <div className="feedback feedback-correct"><span className="feedback-icon">✓</span><span>Correct! <span className="answer-word">{answer}</span></span></div>
                    {item.exampleEs && <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>"{item.exampleEs}"</div>}
                  </div>
                )}
                {phase === 'revealed' && (
                  <div>
                    <div className="feedback feedback-revealed"><span className="feedback-icon">→</span><span>Answer: <span className="answer-word">{answer}</span></span></div>
                    {item.exampleEs && <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>"{item.exampleEs}"</div>}
                  </div>
                )}

                {voiceMode && !isReviewing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <VoiceInput
                      key={item.id}
                      language="es"
                      onTranscript={handleVoiceTranscript}
                      disabled={isReviewing}
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
                      className={`drill-input${phase === 'wrong-first' && !showingTranscript ? ' input-wrong' : ''}`}
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
                      {isReviewing ? 'Next →' : 'Check'}
                    </button>
                  </form>
                )}



                <p className="drill-hint">
                  {!voiceMode && phase === 'answering' && 'Enter to check · blank Enter to skip & reveal'}
                  {!voiceMode && phase === 'wrong-first' && 'Last chance · blank Enter to reveal answer'}
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
          </>
        ) : mode === 'verbs' ? (
          <VerbDrillApp username={username} onAnswer={() => { setHeatmapKey(k => k + 1); refreshLevel() }} voiceMode={voiceMode} onVoicePause={(paused) => setVoiceMode(!paused)} />
        ) : (
          <PhraseDrillApp username={username} onCounts={setPhraseCounts} onAnswer={() => { setHeatmapKey(k => k + 1); refreshLevel() }} selectedTags={selectedPhraseTags} onItemChange={setCurrentPhraseItem} voiceMode={voiceMode} onVoicePause={(paused) => setVoiceMode(!paused)} />
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

      {/* Background info button */}
      <button className="bg-info-btn" onClick={() => {
        setShowcaseIndex(activeBgIndex)
        setShowBgInfo(true)
        document.body.classList.add('bg-showcase-open')
      }} title="About this scene">
        ℹ
      </button>

      {/* Level up celebration overlay */}
      {showLevelUp && (
        <div className="level-up-overlay" onClick={() => setShowLevelUp(null)}>
          <div className="level-up-particles">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="level-up-particle"
                style={{
                  left: '50%',
                  top: '50%',
                  background: ['#fcd34d', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7'][i % 6],
                  ['--px' as string]: `${(Math.random() - 0.5) * 400}px`,
                  ['--py' as string]: `${(Math.random() - 0.5) * 400}px`,
                  animationDelay: `${0.1 + Math.random() * 0.3}s`,
                }}
              />
            ))}
          </div>
          <div className="level-up-content">
            <div className="level-up-badge">🎉</div>
            <div className="level-up-title">Level {showLevelUp.totalLevel}!</div>
            <div className="level-up-subtitle">New scene unlocked</div>
            {showLevelUp.currentBg?.image && (
              <div
                className="level-up-bg-preview"
                style={{ backgroundImage: `url('${showLevelUp.currentBg.image}')` }}
              />
            )}
            <div className="level-up-location">{showLevelUp.currentBg?.name}</div>
            <div className="level-up-dismiss">tap to continue</div>
          </div>
        </div>
      )}

      {/* Background showcase overlay with paging */}
      {showBgInfo && (() => {
        const maxUnlocked = Math.min(activeBgIndex, LEVEL_BACKGROUNDS.length - 1)
        const bg = LEVEL_BACKGROUNDS[showcaseIndex]
        const closeShowcase = () => {
          setActiveBgIndex(showcaseIndex)
          setShowBgInfo(false)
          document.body.classList.remove('bg-showcase-open')
        }
        return (
          <div className="bg-showcase" onClick={closeShowcase}>
            <div className="bg-showcase-text" onClick={(e) => e.stopPropagation()}>
              <div className="bg-showcase-nav">
                <button
                  className="bg-showcase-arrow"
                  onClick={() => {
                    const next = Math.max(0, showcaseIndex - 1)
                    setShowcaseIndex(next)
                    const nextBg = LEVEL_BACKGROUNDS[next]
                    if (nextBg?.image) document.body.style.backgroundImage = `url('${nextBg.image}')`
                    else { document.body.style.backgroundImage = 'none'; document.body.style.background = '#000' }
                  }}
                  disabled={showcaseIndex <= 0}
                >
                  ◀
                </button>
                <div className="bg-showcase-center">
                  <div className="bg-showcase-title">{bg?.name ?? 'Unknown'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Level {showcaseIndex + 1}</div>
                </div>
                <button
                  className="bg-showcase-arrow"
                  onClick={() => {
                    const next = Math.min(maxUnlocked, showcaseIndex + 1)
                    setShowcaseIndex(next)
                    const nextBg = LEVEL_BACKGROUNDS[next]
                    if (nextBg?.image) document.body.style.backgroundImage = `url('${nextBg.image}')`
                    else { document.body.style.backgroundImage = 'none'; document.body.style.background = '#000' }
                  }}
                  disabled={showcaseIndex >= maxUnlocked}
                >
                  ▶
                </button>
              </div>
              <div className="bg-showcase-desc">{bg?.description ?? ''}</div>
              <div className="bg-showcase-dismiss" onClick={closeShowcase}>tap background to close · keeps this scene</div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
