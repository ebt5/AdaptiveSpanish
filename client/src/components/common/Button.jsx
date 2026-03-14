import React from 'react';

const variants = {
  primary:  { background: 'var(--accent)',   color: '#000', border: 'none' },
  secondary:{ background: 'transparent',     color: 'var(--text)', border: '1px solid var(--border)' },
  danger:   { background: 'var(--danger)',   color: '#fff', border: 'none' },
};

export default function Button({ children, variant = 'primary', style, ...props }) {
  return (
    <button
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'opacity 0.15s',
        ...variants[variant],
        ...style,
      }}
      onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
      onMouseOut={e  => e.currentTarget.style.opacity = '1'}
      {...props}
    >
      {children}
    </button>
  );
}
