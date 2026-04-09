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
  const max = Math.max(...recentDays.map(d => d.count), 1)

  const svgH = 70
  const barH = svgH - 2
  const barW = 8
  const gap = 2
  const totalW = recentDays.length * (barW + gap)

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      <svg width="100%" height={svgH} viewBox={`0 0 ${totalW} ${svgH}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        {recentDays.map((d, i) => {
          const h = Math.max(d.count === 0 ? 2 : (d.count / max) * barH, d.count === 0 ? 2 : 3)
          const x = i * (barW + gap)
          const y = barH - h
          return (
            <g key={d.date}>
              <rect
                x={x} y={y} width={barW} height={h}
                fill={d.count === 0 ? 'rgba(255,255,255,0.08)' : color}
                opacity={d.count === 0 ? 1 : 0.8}
                rx="1"
              />
              <title>{d.date}: {d.count}</title>
            </g>
          )
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

      {/* Mastered score distribution */}
      {stats.scoreDist.length > 0 && (() => {
        const total = stats.scoreDist.reduce((s, b) => s + b.count, 0)
        const maxScore = 10
        // Fill gaps so all scores 1-10 are shown
        const bins: ScoreBin[] = Array.from({ length: maxScore }, (_, i) => ({
          score: i + 1,
          count: stats.scoreDist.find(b => b.score === i + 1)?.count ?? 0,
        }))
        const maxCount = Math.max(...bins.map(b => b.count), 1)
        // Color: low scores warm/amber, high scores bright green
        const binColor = (score: number) => {
          if (score <= 2) return '#f59e0b'   // amber — recently promoted
          if (score <= 5) return '#22c55e'   // green — solid
          return '#42affa'                   // blue — deeply ingrained
        }
        return (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>Mastered word strength</span>
              <span style={{ opacity: 0.6 }}>{total} words</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {bins.map(b => (
                <div key={b.score} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, textAlign: 'right', fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>{b.score}</div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 10, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(b.count / maxCount) * 100}%`,
                      height: '100%',
                      background: binColor(b.score),
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                      opacity: b.count === 0 ? 0 : 0.85,
                    }} />
                  </div>
                  {b.count > 0 && <div style={{ width: 28, textAlign: 'left', fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>{b.count}</div>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 9, color: 'var(--text-muted)' }}>
              <span>🟡 1-2: recently mastered</span>
              <span>🟢 3-5: solid</span>
              <span>🔵 6+: deeply ingrained</span>
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
