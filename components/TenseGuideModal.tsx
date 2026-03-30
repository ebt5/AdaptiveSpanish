'use client'

import { useEffect } from 'react'
import { TENSE_GUIDES } from '@/lib/tense-guides'

interface Props {
  tense: string | null
  onClose: () => void
}

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*([^*]+)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

export default function TenseGuideModal({ tense, onClose }: Props) {
  const guide = tense ? TENSE_GUIDES[tense] : null

  useEffect(() => {
    if (!guide) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [guide, onClose])

  if (!guide) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 680,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '28px 28px 32px',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none',
            fontSize: 22, lineHeight: 1,
            color: 'var(--text-muted)', cursor: 'pointer',
            padding: '2px 6px', borderRadius: 4,
          }}
        >
          ×
        </button>

        {/* Heading */}
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, paddingRight: 32 }}>
          {guide.name}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          {guide.description}
        </p>

        {/* Examples */}
        <div style={{ marginBottom: 22 }}>
          {guide.examples.map((ex, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontStyle: 'italic', fontSize: 15 }}>{parseBold(ex.es)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{ex.en}</div>
            </div>
          ))}
        </div>

        {/* Formation table */}
        <SectionHeading>Formation</SectionHeading>
        <ConjTable headers={guide.formation.headers} rows={guide.formation.rows} />
        {guide.formation.note && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
            {guide.formation.note}
          </p>
        )}

        {/* Irregulars */}
        {guide.irregulars && (
          <>
            <SectionHeading style={{ marginTop: 22 }}>Common Irregulars</SectionHeading>
            <ConjTable headers={guide.irregulars.verbs} rows={guide.irregulars.rows} />
          </>
        )}

        {/* Trigger words */}
        <SectionHeading style={{ marginTop: 22 }}>Signal Words</SectionHeading>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {guide.triggerWords.map(w => (
            <span
              key={w}
              style={{
                fontSize: 12, fontWeight: 500,
                padding: '3px 9px', borderRadius: 99,
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Contrast note */}
        {guide.contrastNote && (
          <div
            style={{
              marginTop: 20, padding: '10px 14px',
              borderLeft: '3px solid var(--accent)',
              background: 'var(--bg)',
              borderRadius: '0 6px 6px 0',
              fontSize: 13, color: 'var(--text-muted)',
            }}
          >
            <strong style={{ color: 'var(--text)' }}>Note: </strong>
            {guide.contrastNote}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionHeading({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h3 style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.7px', color: 'var(--text-muted)',
      marginBottom: 8, ...style,
    }}>
      {children}
    </h3>
  )
}

function ConjTable({ headers, rows }: { headers: string[]; rows: Array<{ pronoun: string; forms: string[] }> }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: 13,
      }}>
        <thead>
          <tr style={{ background: 'var(--bg)' }}>
            <th style={thStyle({ isFirst: true })}>Pronoun</th>
            {headers.map(h => <th key={h} style={thStyle({})}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.pronoun} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
              <td style={tdStyle({ isFirst: true })}>{row.pronoun}</td>
              {row.forms.map((f, j) => (
                <td key={j} style={tdStyle({})}>{f}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function thStyle({ isFirst }: { isFirst?: boolean }): React.CSSProperties {
  return {
    padding: '6px 10px',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--text-muted)',
    borderBottom: '1.5px solid var(--border)',
    whiteSpace: 'nowrap',
    fontSize: 12,
    fontStyle: isFirst ? 'normal' : 'normal',
  }
}

function tdStyle({ isFirst }: { isFirst?: boolean }): React.CSSProperties {
  return {
    padding: '5px 10px',
    borderBottom: '1px solid var(--border)',
    color: isFirst ? 'var(--text-muted)' : 'var(--text)',
    fontWeight: isFirst ? 500 : 400,
    whiteSpace: 'nowrap',
  }
}
