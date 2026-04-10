'use client'

import { useState, useRef, useCallback } from 'react'

type SearchResult = {
  id: string
  spanish: string
  english: string
  bucket: 'unseen' | 'learning' | 'learned' | 'mastered'
}

const BUCKET_LABEL: Record<string, string> = {
  unseen: 'New',
  learning: 'Learning',
  learned: 'Learned',
  mastered: 'Mastered',
}

const BUCKET_COLOR: Record<string, string> = {
  unseen: 'var(--text-muted)',
  learning: '#f59e0b',
  learned: '#42affa',
  mastered: 'var(--green)',
}

export default function WordSearch({ username }: { username: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    fetch(`/api/vocab/search?username=${encodeURIComponent(username)}&q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [username])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  async function handleAdd(result: SearchResult) {
    await fetch(`/api/vocab/search?username=${encodeURIComponent(username)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: result.id }),
    })
    setAdded(prev => new Set([...prev, result.id]))
    setResults(prev => prev.map(r => r.id === result.id ? { ...r, bucket: 'learning' } : r))
  }

  return (
    <div style={{ marginTop: 12, marginBottom: 4 }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Add word to learning... (English or Spanish)"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)' }}>…</span>
        )}
      </div>

      {results.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          marginTop: 4,
          overflow: 'hidden',
          maxHeight: 260,
          overflowY: 'auto',
        }}>
          {results.map(r => (
            <div key={r.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '7px 12px',
              gap: 8,
              borderBottom: '1px solid var(--border)',
              fontSize: 13,
            }}>
              <span style={{ flex: 1, fontWeight: 600, color: 'var(--text)' }}>{r.spanish}</span>
              <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: 12 }}>{r.english}</span>
              <span style={{ fontSize: 10, color: BUCKET_COLOR[r.bucket], minWidth: 56, textAlign: 'right' }}>
                {BUCKET_LABEL[r.bucket]}
              </span>
              {(r.bucket === 'unseen' || added.has(r.id)) && r.bucket !== 'learning' && (
                <button
                  onClick={() => handleAdd(r)}
                  style={{
                    background: 'var(--green)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '3px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: 600,
                    marginLeft: 4,
                  }}
                >
                  + Add
                </button>
              )}
              {r.bucket === 'learning' && (
                <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 4 }}>✓ Added</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
