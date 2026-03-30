'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface BucketItem {
  spanish: string
  english: string
  score: number
}

interface Props {
  username: string
  bucket: 'learning' | 'learned' | 'mastered'
  mode: 'vocab' | 'phrases'
  excludeId: string | null
  anchorRect: DOMRect | null
}

const BUCKET_LABELS: Record<string, string> = {
  learning: 'Learning',
  learned: 'Learned',
  mastered: 'Mastered',
}

export default function BucketPopover({ username, bucket, mode, excludeId, anchorRect }: Props) {
  const [items, setItems] = useState<BucketItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const apiPath = mode === 'phrases' ? '/api/phrases/bucket-items' : '/api/vocab/bucket-items'

  const fetchItems = useCallback(async (currentOffset: number, append: boolean) => {
    if (loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        username,
        bucket,
        limit: '30',
        offset: String(currentOffset),
      })
      if (excludeId) params.set('exclude', excludeId)
      const res = await fetch(`${apiPath}?${params}`)
      const data = await res.json()
      if (data.items) {
        setItems(prev => append ? [...prev, ...data.items] : data.items)
        setTotal(data.total ?? 0)
        setOffset(currentOffset + data.items.length)
      }
    } finally {
      setLoading(false)
    }
  }, [username, bucket, mode, excludeId, apiPath])

  useEffect(() => {
    setItems([])
    setOffset(0)
    setTotal(0)
    fetchItems(0, false)
  }, [username, bucket, mode, excludeId])

  function handleScroll() {
    const el = scrollRef.current
    if (!el || loading) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      if (offset < total) {
        fetchItems(offset, true)
      }
    }
  }

  if (!anchorRect) return null

  // Position: below anchor, left-aligned, but clamp to viewport
  const top = anchorRect.bottom + window.scrollY + 6
  let left = anchorRect.left + window.scrollX - 10
  const popoverWidth = 320
  if (left + popoverWidth > window.innerWidth - 16) {
    left = window.innerWidth - popoverWidth - 16
  }

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width: popoverWidth,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
          {BUCKET_LABELS[bucket]} — {mode}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{total} total</span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ maxHeight: 280, overflowY: 'auto', overscrollBehavior: 'contain' }}
      >
        {items.length === 0 && !loading && (
          <div style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Nothing here</div>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '5px 12px',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : undefined,
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flexShrink: 0, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.spanish}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', flexGrow: 1 }}>{item.english}</span>
            {bucket === 'mastered' && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>{item.score}</span>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ padding: '8px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>Loading…</div>
        )}
      </div>
    </div>
  )
}
