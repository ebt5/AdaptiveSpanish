import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import BucketDisplay from '../components/BucketDisplay/BucketDisplay';
import DrillCard from '../components/DrillCard/DrillCard';
import DrillSettings from '../components/DrillSettings/DrillSettings';
import Button from '../components/common/Button';

export default function AppPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [drillSettings, setDrillSettings] = useState({
    vocabulary: true,
    phrases:    false,
    verbs:      false,
  });

  const handleSettingChange = (key, val) => {
    setDrillSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🇪🇸</span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>
            Adaptive Spanish
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {user?.username}
          </span>
          <Button variant="secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Buckets */}
        <BucketDisplay />

        {/* Divider */}
        <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

        {/* Drill settings */}
        <DrillSettings settings={drillSettings} onChange={handleSettingChange} />

        {/* Drill card */}
        <div style={{ marginTop: '24px', width: '100%' }}>
          <DrillCard />
        </div>
      </main>
    </div>
  );
}
