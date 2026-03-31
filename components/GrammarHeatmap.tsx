'use client'

import { useEffect, useState } from 'react'
import GrammarGuideModal from './GrammarGuideModal'

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

const COLORS = {
  mastered: '#16a34a',
  learned: '#f97316',
  learning: '#3b82f6',
  unseen: 'var(--border)',
}

export default function GrammarHeatmap({ username, refreshKey }: { username: string; refreshKey?: number }) {
  const [categories, setCategories] = useState<CategoryStat[] | null>(null)
  const [tooltip, setTooltip] = useState<{ cat: CategoryStat; x: number; y: number } | null>(null)
  const [guideOpen, setGuideOpen] = useState<string | null>(null)

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

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['mastered','learned','learning','unseen'] as const).map(b => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[b], flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{b}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {categories.map(cat => {
          const unseen = cat.total - cat.seen
          const segments = [
            { key: 'mastered', count: cat.mastered, color: COLORS.mastered },
            { key: 'learned', count: cat.learned, color: COLORS.learned },
            { key: 'learning', count: cat.learning, color: COLORS.learning },
            { key: 'unseen', count: unseen, color: COLORS.unseen },
          ].filter(s => s.count > 0)

          return (
            <div key={cat.tag} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 152, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, color: cat.seen > 0 ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{cat.label}</span>
                <button
                  onClick={() => setGuideOpen(cat.tag)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}
                  title={`Learn about ${cat.label}`}
                >ℹ</button>
              </div>
              {/* Stacked bar */}
              <div
                style={{ flex: 1, height: 20, borderRadius: 5, overflow: 'hidden', display: 'flex', cursor: 'default' }}
                onMouseEnter={e => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setTooltip({ cat, x: rect.left, y: rect.bottom + window.scrollY + 4 })
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {segments.map(seg => (
                  <div
                    key={seg.key}
                    style={{
                      width: `${(seg.count / cat.total) * 100}%`,
                      background: seg.color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                ))}
              </div>
              <div style={{ width: 36, textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                {cat.seen}/{cat.total}
              </div>
            </div>
          )
        })}
      </div>

      <GrammarGuideModal tag={guideOpen} onClose={() => setGuideOpen(null)} />

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          top: tooltip.y,
          left: Math.min(tooltip.x, window.innerWidth - 200),
          background: 'var(--surface, #1a1a1a)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          zIndex: 1000,
          pointerEvents: 'none',
          minWidth: 160,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>{tooltip.cat.label}</div>
          <div style={{ color: COLORS.mastered }}>Mastered: {tooltip.cat.mastered}</div>
          <div style={{ color: COLORS.learned }}>Learned: {tooltip.cat.learned}</div>
          <div style={{ color: COLORS.learning }}>Learning: {tooltip.cat.learning}</div>
          <div style={{ color: 'var(--text-muted)' }}>Unseen: {tooltip.cat.total - tooltip.cat.seen}</div>
        </div>
      )}
    </div>
  )
}
