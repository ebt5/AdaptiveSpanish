'use client'

import { useEffect, useState } from 'react'

interface CategoryStat {
  tag: string
  label: string
  total: number
  seen: number
  avgScore: number
  mastered: number
  learned: number
  learning: number
}

function scoreToColor(score: number, seen: number): string {
  if (seen === 0) return 'var(--border)'
  const pct = Math.min(score / 10, 1)
  if (pct === 0) return '#1e293b'
  if (pct <= 0.2) return '#164e63'
  if (pct <= 0.4) return '#0f6b3d'
  if (pct <= 0.6) return '#15803d'
  if (pct <= 0.8) return '#16a34a'
  return '#22c55e'
}

function scoreToTextColor(score: number, seen: number): string {
  if (seen === 0) return 'var(--text-muted)'
  return score >= 4 ? '#fff' : '#94a3b8'
}

export default function GrammarHeatmap({ username, refreshKey }: { username: string; refreshKey?: number }) {
  const [categories, setCategories] = useState<CategoryStat[] | null>(null)

  useEffect(() => {
    fetch(`/api/phrases/grammar-heatmap?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(d => { if (d.categories) setCategories(d.categories) })
      .catch(() => {})
  }, [username, refreshKey])

  if (!categories) return null

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: 10 }}>
        Grammar Progress
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {categories.map(cat => {
          const pctSeen = cat.total > 0 ? cat.seen / cat.total : 0
          return (
            <div key={cat.tag} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Category label */}
              <div style={{ width: 160, flexShrink: 0, fontSize: 12, color: cat.seen > 0 ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cat.label}
              </div>
              {/* Progress bar background */}
              <div style={{ flex: 1, height: 22, borderRadius: 6, background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                {/* Fill based on % seen */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${Math.round(pctSeen * 100)}%`,
                  background: scoreToColor(cat.avgScore, cat.seen),
                  borderRadius: 6,
                  transition: 'width 0.3s ease',
                }} />
                {/* Score text */}
                {cat.seen > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', paddingLeft: 8,
                    fontSize: 10, fontWeight: 700,
                    color: pctSeen > 0.3 ? '#fff' : 'var(--text-muted)',
                    zIndex: 1,
                  }}>
                    {cat.mastered}M · {cat.learned}L · {cat.learning}l
                  </div>
                )}
              </div>
              {/* Count */}
              <div style={{ width: 44, textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                {cat.seen}/{cat.total}
              </div>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>M = Mastered · L = Learned · l = Learning</p>
    </div>
  )
}
