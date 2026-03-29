'use client'

import { useEffect, useState } from 'react'

interface HeatmapData {
  verbs: string[]
  pronouns: string[]
  tenses: string[]
  scores: Record<string, Record<string, Record<string, number>>>
}

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

function tenselabel(tense: string) {
  const labels: Record<string, string> = {
    present: 'Present',
    preterite: 'Preterite',
    imperfect: 'Imperfect',
    future: 'Future',
    conditional: 'Conditional',
    subjunctive: 'Subjunctive',
  }
  return labels[tense] ?? tense
}

export default function ConjugationHeatmap({ username, refreshKey }: { username: string; refreshKey?: number }) {
  const [data, setData] = useState<HeatmapData | null>(null)

  useEffect(() => {
    fetch(`/api/verbs/heatmap?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(setData)
  }, [username, refreshKey])

  if (!data) return null

  const { verbs, pronouns, tenses, scores } = data

  // Build a summary: for each (pronoun, tense), compute average score across all verbs
  // Also show individual verb breakdown below
  function avgScore(pronoun: string, tense: string): number | null {
    const vals: number[] = []
    for (const verb of verbs) {
      const s = scores[verb]?.[tense]?.[pronoun]
      if (s !== undefined) vals.push(s)
    }
    if (vals.length === 0) return null
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: 10 }}>
        Conjugation Progress
      </h2>

      {/* Summary heatmap: rows = pronoun, columns = tense */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 24 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, minWidth: 80 }}></th>
              {tenses.map(tense => (
                <th key={tense} style={{ padding: '0 4px 4px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', minWidth: 72 }}>
                  {tenselabel(tense)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pronouns.map(pronoun => (
              <tr key={pronoun}>
                <td style={{ padding: '3px 12px 3px 0', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                  {pronoun}
                </td>
                {tenses.map(tense => {
                  const score = avgScore(pronoun, tense)
                  return (
                    <td key={tense} style={{ padding: 3 }}>
                      <div style={{
                        minWidth: 60,
                        height: 28,
                        borderRadius: 6,
                        background: scoreToColor(score),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: scoreToTextColor(score),
                        fontVariantNumeric: 'tabular-nums',
                      }}>
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



      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Avg score 0–10 per pronoun × tense</p>
    </div>
  )
}
