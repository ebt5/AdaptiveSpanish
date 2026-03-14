import React from 'react';

const SETTINGS = [
  { key: 'vocabulary', label: 'Vocabulary' },
  { key: 'phrases',    label: 'Phrases'    },
  { key: 'verbs',      label: 'Verb Conjugation' },
];

export default function DrillSettings({ settings, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
      padding: '12px 0',
    }}>
      {SETTINGS.map(({ key, label }) => (
        <label
          key={key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: settings[key] ? 'var(--text)' : 'var(--text-muted)',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={!!settings[key]}
            onChange={e => onChange(key, e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
