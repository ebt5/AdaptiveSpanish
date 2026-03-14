import React, { useEffect } from 'react';
import useWordsStore from '../../store/wordsStore';

const bucketConfig = [
  { key: 'learning', label: 'Learning',  color: 'var(--learning)' },
  { key: 'learned',  label: 'Learned',   color: 'var(--learned)'  },
  { key: 'mastered', label: 'Mastered',  color: 'var(--mastered)' },
];

export default function BucketDisplay() {
  const { buckets, fetchBuckets, loading } = useWordsStore();

  useEffect(() => {
    fetchBuckets();
  }, []);

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      padding: '24px 0',
    }}>
      {bucketConfig.map(({ key, label, color }) => (
        <BucketCard
          key={key}
          label={label}
          color={color}
          count={loading ? '…' : buckets[key]}
        />
      ))}
    </div>
  );
}

function BucketCard({ label, color, count }) {
  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: '20px 32px',
      textAlign: 'center',
      minWidth: '140px',
      boxShadow: `0 0 20px ${color}22`,
    }}>
      <div style={{
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: color,
        marginBottom: '12px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '48px',
        fontWeight: '700',
        color: 'var(--text)',
        lineHeight: 1,
      }}>
        {count}
      </div>
      <div style={{
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginTop: '8px',
      }}>
        words
      </div>
    </div>
  );
}
