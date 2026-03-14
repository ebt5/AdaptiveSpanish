import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import AuthPage from './pages/AuthPage';
import AppPage  from './pages/AppPage';

function RequireAuth({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"    element={<AuthPage />} />
      <Route path="/app" element={
        <RequireAuth>
          <AppPage />
        </RequireAuth>
      } />
      <Route path="*"    element={<Navigate to="/" replace />} />
    </Routes>
  );
}
