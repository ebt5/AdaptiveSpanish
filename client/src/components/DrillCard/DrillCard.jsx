import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';

/**
 * DrillCard — M1 shell (not wired to drill engine yet)
 * Shows a placeholder prompt to validate layout.
 */
export default function DrillCard() {
  const [input, setValue]   = useState('');
  const [attempt, setAttempt] = useState(1);  // 1 or 2
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleSubmit = () => {
    if (!input.trim()) {
      // Empty enter → skip / show answer (M2 will handle this fully)
      return;
    }
    // M2 will wire up the answer-checking logic
    setValue('');
    if (attempt === 1) setAttempt(2);
    else setAttempt(1);
  };

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '36px',
      maxWidth: '560px',
      width: '100%',
      margin: '0 auto',
    }}>
      {/* Word image placeholder */}
      <div style={{
        width: '100%',
        height: '200px',
        background: 'var(--bg-card)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px',
        marginBottom: '28px',
        border: '1px dashed var(--border)',
      }}>
        Word image will appear here
      </div>

      {/* Prompt */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Translate to Spanish
        </div>
        <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text)' }}>
          house
        </div>
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: attempt === 2 ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          Attempt {attempt} of 2
        </div>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your answer… (Enter to submit, Enter on empty to skip)"
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'var(--bg-card)',
          border: '2px solid var(--border)',
          borderRadius: '10px',
          color: 'var(--text)',
          fontSize: '18px',
          outline: 'none',
          transition: 'border-color 0.2s',
          marginBottom: '16px',
        }}
        onFocus={e  => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e   => e.target.style.borderColor = 'var(--border)'}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button onClick={handleSubmit} style={{ flex: 1 }}>
          Submit
        </Button>
        <Button
          variant="secondary"
          onClick={() => setValue('')}
          style={{ flex: 1 }}
        >
          Skip / Show Answer
        </Button>
      </div>

      {/* Accent hint */}
      <div style={{
        marginTop: '16px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        Tip: type <code style={{ color: 'var(--accent)' }}>n~</code> → ñ &nbsp;|&nbsp;
        <code style={{ color: 'var(--accent)' }}>e'</code> → é
      </div>
    </div>
  );
}
