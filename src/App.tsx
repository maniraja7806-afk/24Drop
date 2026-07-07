/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { MainApp } from './components/MainApp';
import { fetchApi } from './lib/api';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        try {
          const data = await fetchApi('/api/session');
          setSession(data);
        } catch (e) {
          localStorage.removeItem('sessionId');
        }
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const logout = () => {
    localStorage.removeItem('sessionId');
    setSession(null);
  };

  if (loading) {
    return <div className="h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return session ? <MainApp session={session} onLogout={logout} /> : <Landing onClaim={setSession} />;
}
