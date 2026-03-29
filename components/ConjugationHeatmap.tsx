'use client'

import { useEffect, useState } from 'react'

interface HeatmapData {
  verbs: string[]
  pronouns: string[]
  tenses: string[]
  scores: Record<string, Record<string, Record<string, number>>>
}

function scoreToColor(score: number | undefined): string {
  if (score === undefined) return 'var(--border)'
  // 0 = dark/cold, 10 = bright green
  const pct = score / 10
  if (pct === 0) return '#1e293b'
  if (pct <= 0.2) return '#164e63'
  if (pct <= 0.4) return '#0f6b3d'
  if (pct <= 0.6) return '#15803d'
  if (pct <= 0.8) return '#16a34a'
  return '#22c55e'
}

function scoreToTextColor(score: number | undefined): string {
  if (score === undefined) return 'var(--text-muted)'
  return score >= 4 ? '#fff' : '#94a3b8'
}

export default function ConjugationHeatmap({ username }: { username: string }) {
  const [data, setData] = useState<HeatmapData | null>(null)

  useEffect(() => {
    fetch(`/api/verbs/heatmap?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(setData)
  }, [username])

  if (!data) return null

  const { verbs, pronouns, tenses, scores } = data

  // Build column headers: tense+pronoun combos
  const cols = tenses.flatMap(tense => pronouns.map(pronoun => ({ tense, pronoun, label: `${tense.slice(0, 4)}·${pronoun}` })))

  return (
    <div style={{ marginTop: 8 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: 10 }}>
        Conjugation Progress
      </h2>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0 6px 4px 0', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 72 }}>verb</th>
              {cols.map(({ tense, pronoun, label }) => (
                <th key={`${tense}-${pronoun}`} style={{ padding: '0 2px 4px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', minWidth: 36 }}>
                  {pronoun}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {verbs.map(verb => (
              <tr key={verb}>
                <td style={{ padding: '2px 6px 2px 0', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text)' }}>
                  {verb}
                </td>
                {cols.map(({ tense, pronoun }) => {
                  const score = scores[verb]?.[tense]?.[pronoun]
                  return (
                    <td key={`${tense}-${pronoun}`} style={{ padding: 2 }}>
                      <div
                        style={{
                          width: 28,
                          height: 22,
                          borderRadius: 4,
                          background: scoreToColor(score),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          color: scoreToTextColor(score),
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {score ?? '·'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Score 0–10 per conjugation</p>
    </div>
  )
}
