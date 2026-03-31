'use client'

import { useEffect } from 'react'
import { getGuide } from '@/lib/grammar-guides'

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*([^*]+)\*\*/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
      )}
    </>
  )
}

interface Props {
  tag: string | null
  onClose: () => void
}

export default function GrammarGuideModal({ tag, onClose }: Props) {
  const guide = tag ? getGuide(tag) : null

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!guide) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '5vh', paddingBottom: '5vh',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface, #1a1a1a)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          maxWidth: 640,
          width: '92%',
          padding: '28px 28px 24px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: 'var(--text-muted)', lineHeight: 1,
          }}
        >×</button>

        {/* Title */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{guide.name}</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>{guide.whatItIs}</p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 18 }} />

        {/* Why tricky */}
        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>Why it's tricky for English speakers</h3>
        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginBottom: 18 }}>{guide.whyTricky}</p>

        {/* Pattern */}
        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>The pattern</h3>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 13, fontFamily: 'monospace',
          color: 'var(--text)', lineHeight: 1.7,
          marginBottom: 18, whiteSpace: 'pre-line',
        }}>
          {guide.pattern}
        </div>

        {/* Forms table */}
        {guide.forms && (
          <>
            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>Forms</h3>
            <div style={{ overflowX: 'auto', marginBottom: 18 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {guide.forms.headers.map((h, i) => (
                      <th key={i} style={{ textAlign: 'left', padding: '5px 10px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.forms.rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {row.cells.map((cell, j) => (
                        <td key={j} style={{ padding: '6px 10px', color: 'var(--text)', verticalAlign: 'top', lineHeight: 1.4 }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {guide.forms.note && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: -12, marginBottom: 18, lineHeight: 1.5 }}>
                {guide.forms.note}
              </div>
            )}
          </>
        )}

        {/* Examples */}
        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>Examples</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {guide.examples.map((ex, i) => (
            <div key={i} style={{ borderLeft: '3px solid var(--accent, #3b82f6)', paddingLeft: 12 }}>
              <div style={{ fontSize: 14, color: 'var(--text)', fontStyle: 'italic', marginBottom: 2 }}>
                <BoldText text={ex.es} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ex.en}</div>
            </div>
          ))}
        </div>

        {/* Common mistakes */}
        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>Common mistakes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {guide.mistakes.map((m, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontSize: 12, marginBottom: 2 }}>
                <span style={{ color: '#f87171' }}>✗ {m.wrong}</span>
              </div>
              <div style={{ fontSize: 12, marginBottom: 2 }}>
                <span style={{ color: '#4ade80' }}>✓ {m.right}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.note}</div>
            </div>
          ))}
        </div>

        {/* Trigger words */}
        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>Key signals</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {guide.triggers.map((t, i) => (
            <span key={i} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              borderRadius: 20, padding: '3px 10px',
              fontSize: 11, color: 'var(--text-muted)',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
