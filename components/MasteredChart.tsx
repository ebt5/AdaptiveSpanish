'use client'

import { useEffect, useState } from 'react'

type DayData = { date: string; count: number }
type ScoreBin = { score: number; count: number }
type StatsData = {
  daily: DayData[]
  cumulative: DayData[]
  mastered7: number
  mastered30: number
  avgPerDay30: number
  scoreDist: ScoreBin[]
}

function StatTile({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 8,
      padding: '10px 12px',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        fontSize: 22,
        fontWeight: 800,
        color: color ?? 'var(--green)',
        lineHeight: 1.1,
        marginBottom: 3,
      }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  )
}

function BarChart({
  data,
  label,
  color = 'var(--green)',
  showDateLabels = false,
}: {
  data: DayData[]
  label: string
  color?: string
  showDateLabels?: boolean
}) {
  const recentDays = data.slice(-30)
  const maxPos = Math.max(...recentDays.map(d => d.count), 1)
  const maxNeg = Math.abs(Math.min(...recentDays.map(d => d.count), 0))

  const svgH = 80
  const barW = 8
  const gap = 2
  const totalW = recentDays.length * (barW + gap)

  // Baseline y position — proportional to positive range
  const posH = maxNeg > 0 ? Math.round(svgH * maxPos / (maxPos + maxNeg)) : svgH - 4
  const negH = svgH - posH
  const baseline = posH

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      <svg width="100%" height={svgH} viewBox={`0 0 ${totalW} ${svgH}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        {/* Baseline */}
        <line x1="0" y1={baseline} x2={totalW} y2={baseline} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        {recentDays.map((d, i) => {
          const x = i * (barW + gap)
          if (d.count === 0) {
            return (
              <g key={d.date}>
                <rect x={x} y={baseline - 1} width={barW} height={2} fill="rgba(255,255,255,0.08)" rx="1" />
                <title>{d.date}: 0</title>
              </g>
            )
          } else if (d.count > 0) {
            const h = Math.max((d.count / maxPos) * posH, 3)
            return (
              <g key={d.date}>
                <rect x={x} y={baseline - h} width={barW} height={h} fill={color} opacity={0.8} rx="1" />
                <title>{d.date}: +{d.count}</title>
              </g>
            )
          } else {
            const h = Math.max((Math.abs(d.count) / Math.max(maxNeg, 1)) * negH, 3)
            return (
              <g key={d.date}>
                <rect x={x} y={baseline} width={barW} height={h} fill="#ef4444" opacity={0.75} rx="1" />
                <title>{d.date}: {d.count}</title>
              </g>
            )
          }
        })}
      </svg>
    </div>
  )
}

export default function MasteredChart({ username }: { username: string | null }) {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    if (!username) return
    let cancelled = false
    fetch(`/api/stats/daily-mastered?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(json => { if (!cancelled && json.daily) setStats(json) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [username])

  if (!stats || stats.daily.length === 0) return null

  return (
    <div className="mastered-chart" style={{ width: '100%', marginTop: '1.5rem', paddingBottom: '1rem' }}>
      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <StatTile value={stats.mastered7}    label="New last 7d"      color="var(--green)" />
        <StatTile value={stats.mastered30}   label="New last 30d"     color="#42affa" />
        <StatTile value={stats.avgPerDay30}  label="Avg / day (30d)"  color="#fcd34d" />
      </div>

      {/* Mastered score distribution — per-score stacked bar */}
      {stats.scoreDist.length > 0 && (() => {
        const total = stats.scoreDist.reduce((s, b) => s + b.count, 0)
        if (total === 0) return null

        // All 10 score slots, fill 0 for missing
        const bins: ScoreBin[] = Array.from({ length: 10 }, (_, i) => ({
          score: i + 1,
          count: stats.scoreDist.find(b => b.score === i + 1)?.count ?? 0,
        }))

        // Each score 1-6 gets its own color; 7-10 all the same deep blue
        const SCORE_COLORS = [
          '#ef4444', // 1  — red
          '#f97316', // 2  — orange
          '#facc15', // 3  — yellow
          '#a3e635', // 4  — lime
          '#22c55e', // 5  — green
          '#2dd4bf', // 6  — teal
          '#818cf8', // 7  — deep blue (mastered)
          '#818cf8', // 8  — same
          '#818cf8', // 9  — same
          '#818cf8', // 10 — same
        ]

        return (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>Mastered word strength</span>
              <span style={{ opacity: 0.6 }}>{total} words</span>
            </div>
            {/* Stacked bar */}
            <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
              {bins.filter(b => b.count > 0).map(b => (
                <div
                  key={b.score}
                  title={`Score ${b.score}: ${b.count} word${b.count !== 1 ? 's' : ''}`}
                  style={{ flex: b.count, background: SCORE_COLORS[b.score - 1], opacity: 0.9 }}
                />
              ))}
            </div>
            {/* Mini legend — only show scores that have words */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
              {bins.filter(b => b.count > 0).map(b => (
                <span key={b.score}>
                  <span style={{ color: SCORE_COLORS[b.score - 1] }}>■</span> {b.score} ({b.count})
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Daily bar chart */}
      <BarChart data={stats.daily}      label="New words mastered — daily (last 30 days)" color="var(--green)" />

      {/* Cumulative bar chart */}
      <BarChart data={stats.cumulative} label="Total mastered — cumulative" color="#42affa" />
    </div>
  )
}
