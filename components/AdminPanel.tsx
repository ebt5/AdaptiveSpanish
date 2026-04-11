'use client'

import { useEffect, useState } from 'react'

interface VocabItem {
  id: string
  english: string
  spanish: string
  spanishDisplay?: string
  emoji?: string | null
  imageUrl?: string | null
}

interface PhraseItem {
  id: string
  english: string
  spanish: string
  grammarNote?: string | null
  grammarTag: string
  difficultyLevel: number
}

interface VerbItem {
  id: string
  infinitive: string
  english: string
  tense: string
  pronoun: string
  form: string
  exampleEs?: string | null
  exampleEn?: string | null
}

type DrillItem = VocabItem | PhraseItem | VerbItem

interface Props {
  username: string
  mode: 'vocab' | 'phrases' | 'verbs'
  item: DrillItem | null
  onImageGenerated?: (imageUrl: string) => void
}

const GRAMMAR_TAGS = [
  'survival','ser-estar','tener-expressions','hacer-expressions','reflexive',
  'gustar-type','verb-infinitive','progressive','object-pronouns','por-para',
  'negative-constructions','hay-que-impersonal','unintentional','subjunctive',
  'conditional','idioms-discourse',
]

export default function AdminPanel({ username, mode, item, onImageGenerated }: Props) {
  const [fields, setFields] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [genImageState, setGenImageState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)

  // Reset fields when item changes
  useEffect(() => {
    if (!item) { setFields({}); return }
    if (mode === 'vocab') {
      const v = item as VocabItem
      setFields({
        englishPrimary: v.english,
        spanish: v.spanish,
        spanishDisplay: v.spanishDisplay ?? '',
        emoji: v.emoji ?? '',
      })
    } else if (mode === 'phrases') {
      const p = item as PhraseItem
      setFields({
        english: p.english,
        spanish: p.spanish,
        grammarNote: p.grammarNote ?? '',
        grammarTag: p.grammarTag,
        difficultyLevel: String(p.difficultyLevel),
      })
    } else if (mode === 'verbs') {
      const v = item as VerbItem
      setFields({
        form: v.form,
        exampleEs: v.exampleEs ?? '',
        exampleEn: v.exampleEn ?? '',
      })
    }
    setSaved(false)
    setError(null)
  }, [item?.id, mode])

  async function handleSave() {
    if (!item) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/update-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, mode, id: item.id, fields }),
      })
      const data = await res.json()
      if (data.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(data.error ?? 'Unknown error')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  if (!item) return (
    <div style={panelStyle}>
      <div style={headerStyle}>Admin Panel</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 14px' }}>No item being drilled.</p>
    </div>
  )

  const isVerb = mode === 'verbs'
  const verbItem = isVerb ? item as VerbItem : null

  async function handleGenerateImage() {
    if (!item || mode !== 'vocab') return
    setGenImageState('loading')
    setError(null)
    try {
      // Call local Mac mini server (fast, can write files, no timeout)
      const res = await fetch('http://localhost:3099/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: item.id }),
      })
      const data = await res.json()
      if (data.ok) {
        const freshUrl = data.imageUrl + '?t=' + Date.now()
        setGeneratedUrl(freshUrl)
        setGenImageState('done')
        onImageGenerated?.(data.imageUrl)
      } else {
        setGenImageState('error')
        setError(data.error ?? 'Generation failed')
      }
    } catch (e) {
      setGenImageState('error')
      setError('Local server not running. Start with: node scripts/local-image-server.js')
    }
  }

  return (
    <div style={panelStyle}>
      <div
        style={{ ...headerStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => setCollapsed(c => !c)}
      >
        <span>✏️ Admin <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{mode}</span></span>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{collapsed ? '▼' : '▲'}</span>
      </div>

      {collapsed ? null : <>
      {isVerb && verbItem && (
        <div style={infoRowStyle}>
          <span style={{ fontWeight: 700 }}>{verbItem.infinitive}</span>
          <span style={{ color: 'var(--text-muted)' }}>{verbItem.tense} · {verbItem.pronoun}</span>
        </div>
      )}

      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(fields).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </label>
            {key === 'grammarTag' ? (
              <select
                value={val}
                onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                style={inputStyle}
              >
                {GRAMMAR_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : key === 'grammarNote' || key === 'exampleEs' || key === 'exampleEn' ? (
              <textarea
                value={val}
                onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            ) : (
              <input
                type={key === 'difficultyLevel' ? 'number' : 'text'}
                min={1} max={5}
                value={val}
                onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                style={inputStyle}
              />
            )}
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: 4,
            padding: '7px 0',
            borderRadius: 7,
            border: 'none',
            background: saved ? '#16a34a' : 'var(--accent, #3b82f6)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>

        {error && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>{error}</p>}

        {/* Image generation — vocab only */}
        {mode === 'vocab' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6 }}>
            {(generatedUrl || (item as VocabItem).imageUrl) && (
              <img
                src={generatedUrl ?? ((item as VocabItem).imageUrl ?? '')}
                alt="vocab"
                style={{ width: '100%', borderRadius: 6, marginBottom: 6 }}
              />
            )}
            <button
              onClick={handleGenerateImage}
              disabled={genImageState === 'loading'}
              style={{
                width: '100%',
                padding: '7px 0',
                borderRadius: 7,
                border: 'none',
                background: genImageState === 'done' ? '#16a34a' : '#7c3aed',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: genImageState === 'loading' ? 'not-allowed' : 'pointer',
                opacity: genImageState === 'loading' ? 0.7 : 1,
              }}
            >
              {genImageState === 'loading' ? '⏳ Generating…' : genImageState === 'done' ? '✓ Image saved' : '🎨 Generate Image'}
            </button>
          </div>
        )}
      </div>
      </>}
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  top: 80,
  right: 16,
  width: 220,
  maxHeight: 'calc(100vh - 100px)',
  overflowY: 'auto',
  background: 'var(--surface, #1a1a1a)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  zIndex: 500,
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
}

const headerStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text)',
}

const infoRowStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderBottom: '1px solid var(--border)',
  fontSize: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  color: 'var(--text)',
}

const inputStyle: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--surface, #1a1a1a)',
  color: 'var(--text)',
  fontSize: 12,
  width: '100%',
  boxSizing: 'border-box',
}
