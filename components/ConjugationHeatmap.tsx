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

export default function ConjugationHeatmap({ username }: { username: string }) {
  const [data, setData] = useState<HeatmapData | null>(null)

  useEffect(() => {
    fetch(`/api/verbs/heatmap?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(setData)
  }, [username])

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

      {/* Verb detail grid: rows = verb, columns = pronoun (for current tenses) */}
      {tenses.map(tense => (
        <div key={tense} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>
            {tenselabel(tense)} — by verb
          </h3>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0 8px 3px 0', color: 'var(--text-muted)', fontWeight: 600, minWidth: 72 }}>verb</th>
                  {pronouns.map(p => (
                    <th key={p} style={{ padding: '0 2px 3px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', minWidth: 30 }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {verbs.map(verb => (
                  <tr key={verb}>
                    <td style={{ padding: '2px 8px 2px 0', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text)', fontSize: 12 }}>
                      {verb}
                    </td>
                    {pronouns.map(pronoun => {
                      const score = scores[verb]?.[tense]?.[pronoun] ?? null
                      return (
                        <td key={pronoun} style={{ padding: 2 }}>
                          <div style={{
                            width: 26,
                            height: 20,
                            borderRadius: 4,
                            background: scoreToColor(score !== undefined ? score : null),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            fontWeight: 700,
                            color: scoreToTextColor(score !== undefined ? score : null),
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
        </div>
      ))}

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Avg score 0–10 per pronoun × tense</p>
    </div>
  )
}
