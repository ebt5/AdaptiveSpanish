'use client'

import { useEffect, useState } from 'react'

type DayData = { date: string; count: number }

export default function MasteredChart({ username }: { username: string | null }) {
  const [data, setData] = useState<DayData[] | null>(null)

  useEffect(() => {
    if (!username) return
    let cancelled = false

    fetch(`/api/stats/daily-mastered?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && Array.isArray(json)) setData(json)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [username])

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
                <g key={d.date}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={barH}
                    fill="var(--green)"
                    opacity="0.75"
                    rx="1"
                  />
                  <title>{d.date}: {d.count > 0 ? '+' : ''}{d.count}</title>
                  {/* Invisible hit area for hover */}
                  <rect
                    x={x}
                    y={0}
                    width={w}
                    height={barAreaHeight}
                    fill="transparent"
                  />
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}
