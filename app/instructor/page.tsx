'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getStoredUsername } from '@/lib/identity'

// ── Types ────────────────────────────────────────────────────────────────────

interface Classroom {
  id: string
  name: string
  studentCount: number
}

interface StudentRow {
  userId: string
  username: string
  activeDays30: number
  vocabMastered: number
  phrasesMastered: number
  vocabCorrectPct: number | null
  phrasesCorrectPct: number | null
  verbsCorrectPct: number | null
  totalDrills7: number
  overallPct7: number | null
  totalDrills30: number
  overallPct30: number | null
  netVocab30: number
  vocabTrend: 'up' | 'down' | 'flat'
  lastActive: string | null
}

interface VocabCounts { learning: number; learned: number; mastered: number; unseen: number }
interface PhraseCounts { learning: number; learned: number; mastered: number; unseen: number }

interface HeatmapData {
  pronouns: string[]
  tenses: string[]
  scores: Record<string, Record<string, number>>
}

interface CategoryStat {
  tag: string; label: string; total: number; seen: number
  avgScore: number; mastered: number; learned: number; learning: number
}

interface StudentDetail {
  username: string
  vocabCounts: VocabCounts
  phraseCounts: PhraseCounts
  verbHeatmap: HeatmapData
  grammarHeatmap: { categories: CategoryStat[] }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pctColor(pct: number | null): string {
  if (pct === null) return 'var(--text-muted)'
  if (pct >= 80) return '#16a34a'
  if (pct >= 60) return '#d97706'
  return '#dc2626'
}

function PctCell({ pct }: { pct: number | null }) {
  if (pct === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return <span style={{ color: pctColor(pct), fontWeight: 700 }}>{pct}%</span>
}

// ── Mini ConjugationHeatmap (read-only) ──────────────────────────────────────

function scoreToColor(score: number | null): string {
  if (score === null) return 'var(--border)'
  const pct = score / 10
  if (pct === 0) return '#1e293b'
  if (pct <= 0.2) return '#164e63'
  if (pct <= 0.4) return '#0f6b3d'
  if (pct <= 0.6) return '#15803d'
  if (pct <= 0.8) return '#16a34a'
  return '#22c55e'
}

function scoreToTextColor(score: number | null): string {
  if (score === null) return 'var(--text-muted)'
  return score >= 4 ? '#fff' : '#94a3b8'
}

function tenseLabel(tense: string) {
  const labels: Record<string, string> = {
    present: 'Present', preterite: 'Preterite', imperfect: 'Imperfect',
    future: 'Future', conditional: 'Conditional', present_subjunctive: 'Subj. (pres)',
    imperfect_subjunctive: 'Subj. (imp)', present_perfect: 'Pres. Perfect',
    imperative: 'Imperative', past_perfect: 'Past Perf.', future_perfect: 'Future Perf.',
    conditional_perfect: 'Cond. Perf.', present_perfect_subjunctive: 'Perf. Subj.',
  }
  return labels[tense] ?? tense
}

function VerbHeatmap({ data }: { data: HeatmapData }) {
  const { pronouns, tenses, scores } = data
  return (
    <div>
      <h3 style={sectionHeading}>Conjugation Progress</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: '0 8px 0 0', minWidth: 72 }} />
              {tenses.map(tense => (
                <th key={tense} style={{ padding: '0 3px', verticalAlign: 'bottom', width: 34 }}>
                  <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', paddingBottom: 6, height: 72, display: 'flex', alignItems: 'center' }}>
                    {tenseLabel(tense)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pronouns.map(pronoun => (
              <tr key={pronoun}>
                <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{pronoun}</td>
                {tenses.map(tense => {
                  const score = scores[pronoun]?.[tense] ?? null
                  return (
                    <td key={tense} style={{ padding: 3 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: scoreToColor(score), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: scoreToTextColor(score), fontVariantNumeric: 'tabular-nums' }}>
                        {score !== null ? score : '·'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Score 0–10 per pronoun × tense</p>
    </div>
  )
}

// ── Mini GrammarHeatmap (read-only, no checkboxes) ────────────────────────────

const GRAMMAR_COLORS = {
  mastered: '#16a34a', learned: '#f97316', learning: '#3b82f6', unseen: 'var(--border)',
}

function GrammarHeatmap({ categories }: { categories: CategoryStat[] }) {
  return (
    <div>
      <h3 style={sectionHeading}>Grammar Progress</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['mastered','learned','learning','unseen'] as const).map(b => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: GRAMMAR_COLORS[b], flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{b}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {categories.map(cat => {
          const unseen = cat.total - cat.seen
          const segments = [
            { key: 'mastered', count: cat.mastered, color: GRAMMAR_COLORS.mastered },
            { key: 'learned', count: cat.learned, color: GRAMMAR_COLORS.learned },
            { key: 'learning', count: cat.learning, color: GRAMMAR_COLORS.learning },
            { key: 'unseen', count: unseen, color: GRAMMAR_COLORS.unseen },
          ].filter(s => s.count > 0)
          return (
            <div key={cat.tag} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 164, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: cat.seen > 0 ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{cat.label}</span>
              </div>
              <div style={{ flex: 1, height: 20, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                {segments.map(seg => (
                  <div key={seg.key} style={{ width: `${(seg.count / cat.total) * 100}%`, background: seg.color }} />
                ))}
              </div>
              <div style={{ width: 36, textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                {cat.seen}/{cat.total}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Student Detail Modal ──────────────────────────────────────────────────────

function BucketRow({ label, counts }: { label: string; counts: { learning: number; learned: number; mastered: number; unseen: number } }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {([['Learning', counts.learning, '#2563eb'], ['Learned', counts.learned, '#ea580c'], ['Mastered', counts.mastered, '#16a34a'], ['Unseen', counts.unseen, 'var(--text-muted)']] as [string, number, string][]).map(([b, n, color]) => (
          <div key={b} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentDetailModal({ userId, username: callerUsername, onClose }: { userId: string; username: string; onClose: () => void }) {
  const [detail, setDetail] = useState<StudentDetail | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/instructor/student/${userId}/detail?username=${encodeURIComponent(callerUsername)}`)
      .then(r => r.json())
      .then(setDetail)
  }, [userId, callerUsername])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 760, padding: 24, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>

        {!detail ? (
          <p style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>Loading…</p>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{detail.username}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <BucketRow label="Vocabulary" counts={detail.vocabCounts} />
              <BucketRow label="Phrases" counts={detail.phraseCounts} />
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 20 }}>
              <VerbHeatmap data={detail.verbHeatmap} />
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <GrammarHeatmap categories={detail.grammarHeatmap.categories} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Shared style helpers ──────────────────────────────────────────────────────

const sectionHeading: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
  color: 'var(--text-muted)', marginBottom: 10,
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InstructorPage() {
  const [username, setUsername] = useState<string | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [addInput, setAddInput] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)
  const [detailUserId, setDetailUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load username from local storage
  useEffect(() => {
    const stored = getStoredUsername()
    setUsername(stored)
  }, [])

  // Load classrooms
  useEffect(() => {
    if (!username) return
    fetch(`/api/instructor/classrooms?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setClassrooms(data)
        if (data.length > 0) setSelectedClassroomId(data[0].id)
      })
      .catch(() => setError('Failed to load classrooms'))
  }, [username])

  // Load students for selected classroom
  const loadStudents = useCallback(() => {
    if (!username || !selectedClassroomId) return
    setLoadingStudents(true)
    fetch(`/api/instructor/classroom/${selectedClassroomId}/students?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setStudents(data)
        setLoadingStudents(false)
      })
      .catch(() => setLoadingStudents(false))
  }, [username, selectedClassroomId])

  useEffect(() => { loadStudents() }, [loadStudents])

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !selectedClassroomId || !addInput.trim()) return
    setAddLoading(true)
    setAddError(null)
    const res = await fetch(`/api/instructor/classroom/${selectedClassroomId}/students?username=${encodeURIComponent(username)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentUsername: addInput.trim().toLowerCase() }),
    })
    const data = await res.json()
    setAddLoading(false)
    if (data.error) { setAddError(data.error); return }
    setAddInput('')
    loadStudents()
  }

  async function handleRemoveStudent(studentId: string) {
    if (!username || !selectedClassroomId) return
    await fetch(`/api/instructor/classroom/${selectedClassroomId}/students/${studentId}?username=${encodeURIComponent(username)}`, { method: 'DELETE' })
    loadStudents()
  }

  if (!username) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No session found. <a href="/" style={{ color: 'var(--accent)' }}>Go to drill app</a> and log in first.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <p style={{ color: 'var(--red)' }}>{error === 'forbidden' ? 'Your account does not have instructor access.' : error}</p>
        <p style={{ marginTop: 12 }}><a href="/" style={{ color: 'var(--accent)' }}>← Back to Drill</a></p>
      </div>
    )
  }

  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 60px', minHeight: '100dvh' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px' }}>Instructor Portal</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{username}</p>
        </div>
        <a href="/" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>← Back to Drill</a>
      </header>

      {classrooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No classrooms yet</p>
          <p style={{ fontSize: 14 }}>Ask an admin to create a classroom for you.</p>
        </div>
      ) : (
        <>
          {/* Classroom selector */}
          {classrooms.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {classrooms.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassroomId(c.id)}
                  style={{
                    padding: '6px 16px', borderRadius: 99, border: '1.5px solid',
                    borderColor: c.id === selectedClassroomId ? 'var(--accent)' : 'var(--border)',
                    background: c.id === selectedClassroomId ? 'var(--accent)' : 'var(--surface)',
                    color: c.id === selectedClassroomId ? '#fff' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {c.name} <span style={{ opacity: 0.7, fontWeight: 400 }}>({c.studentCount})</span>
                </button>
              ))}
            </div>
          )}

          {selectedClassroom && (
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selectedClassroom.name}</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedClassroom.studentCount} student{selectedClassroom.studentCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Add student */}
          <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={addInput}
              onChange={e => setAddInput(e.target.value)}
              placeholder="Add student by username…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
            />
            <button type="submit" disabled={addLoading || !addInput.trim()} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: addLoading ? 0.6 : 1 }}>
              {addLoading ? 'Adding…' : 'Add Student'}
            </button>
            {addError && <p style={{ width: '100%', color: 'var(--red)', fontSize: 13, margin: 0 }}>{addError}</p>}
          </form>

          {/* Roster table */}
          {loadingStudents ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading students…</p>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No students in this classroom yet.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>Add a student by username above.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Student', 'Active (30d)', 'Drills (7d)', 'Drills (30d)', 'Net Vocab ↑', 'Vocab %', 'Phrases %', 'Verbs %', 'Last active', ''].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.userId} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--text)' }}>{s.username}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{s.activeDays30}d</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {s.totalDrills7 > 0 ? <>{s.totalDrills7} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({s.overallPct7}%)</span></> : '—'}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {s.totalDrills30 > 0 ? <>{s.totalDrills30} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({s.overallPct30}%)</span></> : '—'}
                      </td>
                      <td style={{ padding: '10px 10px', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ color: s.netVocab30 > 0 ? '#16a34a' : s.netVocab30 < 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                          {s.netVocab30 > 0 ? '▲' : s.netVocab30 < 0 ? '▼' : '—'} {s.netVocab30 !== 0 ? Math.abs(s.netVocab30) : ''}
                          {s.vocabTrend === 'up' && s.netVocab30 > 0 && <span style={{ fontSize: 10, marginLeft: 4, color: '#16a34a' }}>↑</span>}
                          {s.vocabTrend === 'down' && <span style={{ fontSize: 10, marginLeft: 4, color: '#ef4444' }}>↓</span>}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px' }}><PctCell pct={s.vocabCorrectPct} /></td>
                      <td style={{ padding: '10px 10px' }}><PctCell pct={s.phrasesCorrectPct} /></td>
                      <td style={{ padding: '10px 10px' }}><PctCell pct={s.verbsCorrectPct} /></td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: 12 }}>{s.lastActive ?? '—'}</td>
                      <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => setDetailUserId(s.userId)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--accent)', fontWeight: 600, fontSize: 12, cursor: 'pointer', marginRight: 6 }}>
                          View
                        </button>
                        <button onClick={() => handleRemoveStudent(s.userId)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }} title="Remove from classroom">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Student detail modal */}
      {detailUserId && username && (
        <StudentDetailModal
          userId={detailUserId}
          username={username}
          onClose={() => setDetailUserId(null)}
        />
      )}
    </div>
  )
}
