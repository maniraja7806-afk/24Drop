import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TimerReset, Zap } from 'lucide-react';
import { fetchApi } from '../lib/api';

export function Landing({ onClaim }: { onClaim: (session: any) => void }) {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const identityRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const generate = async (forceNew = false) => {
    setLoading(true);
    try {
      if (!forceNew) {
        const stored = localStorage.getItem('suggestedUsernames');
        const expiry = localStorage.getItem('suggestedUsernamesExpiry');
        if (stored && expiry && Date.now() < Number(expiry)) {
          setUsernames(JSON.parse(stored));
          setLoading(false);
          return;
        }
      }
      const data = await fetchApi('/api/usernames/generate');
      setUsernames(data.usernames);
      localStorage.setItem('suggestedUsernames', JSON.stringify(data.usernames));
      localStorage.setItem('suggestedUsernamesExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
  }, []);

  useEffect(() => {
    if (usernames.length > 0 && identityRef.current && containerRef.current) {
      setTimeout(() => {
        const container = containerRef.current;
        const target = identityRef.current;
        if (!container || !target) return;

        const targetPosition = target.offsetTop - (container.clientHeight / 2) + (target.clientHeight / 2);
        const startPosition = container.scrollTop;
        const distance = targetPosition - startPosition;
        const duration = 2500; // 2.5 seconds for a very slow, gentle scroll
        let start = null;

        const easeInOutQuad = (t, b, c, d) => {
          t /= d / 2;
          if (t < 1) return (c / 2) * t * t + b;
          t--;
          return (-c / 2) * (t * (t - 2) - 1) + b;
        };

        const animation = (currentTime) => {
          if (start === null) start = currentTime;
          const timeElapsed = currentTime - start;
          const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
          container.scrollTop = run;
          if (timeElapsed < duration) {
            requestAnimationFrame(animation);
          } else {
            container.scrollTop = targetPosition;
          }
        };

        requestAnimationFrame(animation);
      }, 1200);
    }
  }, [usernames]);

  const claim = async (username: string) => {
    try {
      const data = await fetchApi('/api/usernames/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      localStorage.setItem('sessionId', data.sessionId);
      onClaim(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div ref={containerRef} className="h-full min-h-screen bg-neutral-950 text-white flex flex-col items-center relative overflow-x-hidden overflow-y-auto p-6 scroll-smooth">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 opacity-80" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center max-w-lg w-full text-center space-y-24 mt-24 pb-48"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center space-x-3 mb-8"
          >
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
              <TimerReset className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-display font-bold tracking-tight">24Drop</h1>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-neutral-500">
            Share Anything.
            <br />
            Gone in 24 Hours.
          </h2>
          <p className="text-neutral-400 text-lg md:text-xl font-light">
            No Email. No Password. No Traces.
          </p>
        </div>

        <div ref={identityRef} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative">
          <div className="mb-6 text-center">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Select temporary identity</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {usernames.map((uname, idx) => (
                <motion.button
                  key={uname}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => claim(uname)}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all rounded-2xl p-4 flex items-center justify-between group"
                >
                  <span className="font-mono text-lg font-medium tracking-tight group-hover:text-white transition-colors">{uname}</span>
                  <Zap className="w-4 h-4 text-neutral-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
