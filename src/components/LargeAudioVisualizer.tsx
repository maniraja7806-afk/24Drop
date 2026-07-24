import React, { useEffect, useRef } from 'react';

export function LargeAudioVisualizer({ stream, isPaused = false }: { stream: MediaStream, isPaused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>(new Array(40).fill(0));
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    let audioContext: AudioContext;
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API not supported", e);
      return;
    }

    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    source.connect(analyser);
    analyser.fftSize = 256; 

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId: number;
    let lastDrawTime = performance.now();

    const renderFrame = (time: number) => {
      animationId = requestAnimationFrame(renderFrame);
      if (!ctx) return;
      
      // Update history every ~50ms to get a nice scrolling effect
      if (time - lastDrawTime > 50) {
        if (!isPausedRef.current) {
          analyser.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < bufferLength; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / bufferLength); // 0 to 1
          
          // Push to history
          historyRef.current.push(rms);
          if (historyRef.current.length > 40) {
            historyRef.current.shift();
          }
        } else {
          // When paused, slowly decay the history to 0 so the bars flatten out
          for (let i = 0; i < historyRef.current.length; i++) {
            historyRef.current[i] *= 0.8;
          }
        }
        lastDrawTime = time;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 40;
      const barWidth = 4;
      const gap = 3;
      const totalWidth = numBars * barWidth + (numBars - 1) * gap;
      let x = (canvas.width - totalWidth) / 2;

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#facc15'); // Gold
      gradient.addColorStop(0.5, '#4ade80'); // Neon green
      gradient.addColorStop(1, '#2dd4bf'); // Teal
      ctx.fillStyle = gradient;

      for (let i = 0; i < numBars; i++) {
        const value = historyRef.current[i] || 0;
        
        // Map RMS (0 to 1) to bar height. Scale up slightly for better visibility.
        // Cap it so it doesn't exceed canvas height.
        const barHeight = Math.max(4, Math.min(canvas.height, (value * 3) * (canvas.height * 0.9)));
        
        const y = (canvas.height - barHeight) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();

        x += barWidth + gap;
      }
    };

    animationId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      audioContext.close().catch(console.error);
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={320} height={100} className="w-full max-w-[320px] h-16" />;
}
