'use client'

import { useEffect, useState } from 'react'
import { getStoredUsername } from '@/lib/identity'

type DayData = { date: string; count: number }

export default function MasteredChart() {
  const [data, setData] = useState<DayData[] | null>(null)

  useEffect(() => {
    let cancelled = false

    function load() {
      const username = getStoredUsername()
      if (!username) return

      fetch(`/api/stats/daily-mastered?username=${encodeURIComponent(username)}`)
        .then((r) => r.json())
        .then((json) => {
          if (!cancelled && Array.isArray(json)) setData(json)
        })
        .catch(() => {})
    }

    // Try immediately
    load()

    // If username wasn't ready yet, retry a few times
    const t1 = setTimeout(load, 500)
    const t2 = setTimeout(load, 1500)
    const t3 = setTimeout(load, 3000)

    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  if (!data || data.length === 0) return null

  const max = Math.max(...data.map((d) => d.count))
  const mid = Math.round(max / 2)

  const svgHeight = 80
  const labelWidth = 24
  const barAreaHeight = svgHeight - 4

  return (
    <div style={{ width: '100%', marginTop: '2rem', paddingBottom: '1rem' }}>
      <div
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginBottom: '0.4rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        mastered by day
      </div>
      <div style={{ display: 'flex', width: '100%', gap: 0 }}>
        {/* Y-axis labels */}
        <div
          style={{
            width: labelWidth,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingRight: '4px',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            height: svgHeight,
            boxSizing: 'border-box',
          }}
        >
          <span>{max}</span>
          <span>{mid}</span>
        </div>

        {/* Bar area */}
        <div style={{ flex: 1, height: svgHeight, position: 'relative' }}>
          <svg
            width="100%"
            height={svgHeight}
            preserveAspectRatio="none"
            viewBox={`0 0 ${data.length * 10} ${svgHeight}`}
            style={{ display: 'block', overflow: 'visible' }}
          >
            {/* Mid gridline */}
            <line
              x1="0"
              y1={barAreaHeight - (mid / max) * barAreaHeight}
              x2={data.length * 10}
              y2={barAreaHeight - (mid / max) * barAreaHeight}
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
            {data.map((d, i) => {
              const barH = max > 0 ? (d.count / max) * barAreaHeight : 0
              const x = i * 10 + 1
              const w = 8
              const y = barAreaHeight - barH
              return (
                <rect
                  key={d.date}
                  x={x}
                  y={y}
                  width={w}
                  height={barH}
                  fill="var(--green)"
                  opacity="0.75"
                  rx="1"
                />
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}
