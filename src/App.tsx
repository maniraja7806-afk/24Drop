/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { MainApp } from './components/MainApp';
import { fetchApi } from './lib/api';
import { Toaster, toast } from 'sonner';

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

    const handleAuthError = () => {
      toast.error('Session expired. Please sign in again.');
      localStorage.removeItem('sessionId');
      setSession(null);
    };

    const handleGlobalError = (event: ErrorEvent) => {
      toast.error(event.message || 'An unexpected error occurred');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      toast.error(event.reason?.message || 'An unexpected error occurred');
    };

    window.addEventListener('auth_error', handleAuthError);
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('auth_error', handleAuthError);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('sessionId');
    setSession(null);
  };

  if (loading) {
    return <div className="h-full min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors />
      {session ? <MainApp session={session} onLogout={logout} /> : <Landing onClaim={setSession} />}
    </>
  );
}
