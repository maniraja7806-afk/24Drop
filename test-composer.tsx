import { useState, useEffect } from 'react';
export function useComposerHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = document.getElementById('chat-composer');
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (let e of entries) setHeight(e.target.getBoundingClientRect().height);
    });
    observer.observe(el);
    setHeight(el.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, []);
  return height;
}
