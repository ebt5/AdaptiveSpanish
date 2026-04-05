'use client'

import { useEffect, useState } from 'react'

interface HeatmapData {
  pronouns: string[]
  tenses: string[]
  scores: Record<string, Record<string, number>>
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

function tenseLabel(tense: string) {
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

  const { pronouns, tenses, scores } = data

  return (
    <div className="grammar-heatmap-panel" style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: 10 }}>
        Conjugation Progress
      </h2>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: '0 8px 0 0', minWidth: 72 }}></th>
              {tenses.map(tense => (
                <th key={tense} style={{ padding: '0 3px', verticalAlign: 'bottom', width: 34 }}>
                  <div style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    whiteSpace: 'nowrap',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    paddingBottom: 6,
                    height: 72,
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {tenseLabel(tense)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pronouns.map(pronoun => (
              <tr key={pronoun}>
                <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                  {pronoun}
                </td>
                {tenses.map(tense => {
                  const score = scores[pronoun]?.[tense] ?? null
                  return (
                    <td key={tense} style={{ padding: 3 }}>
                      <div style={{
                        width: 28,
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
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Score 0–10 per pronoun × tense</p>
    </div>
  )
}
