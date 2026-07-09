import React, { useEffect, useRef } from 'react';

export function LargeAudioVisualizer({ stream }: { stream: MediaStream }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    analyser.fftSize = 128; // More frequency bins

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId: number;

    const renderFrame = () => {
      animationId = requestAnimationFrame(renderFrame);
      if (!ctx) return;

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 40; // Number of bars to display
      const barWidth = 4;
      const gap = 3;
      const totalWidth = numBars * barWidth + (numBars - 1) * gap;
      let x = (canvas.width - totalWidth) / 2;

      for (let i = 0; i < numBars; i++) {
        // Distribute samples
        // Skip first few low frequencies or adjust mapping to look good
        const dataIndex = Math.floor((i + 5) * (bufferLength / (numBars + 10)));
        const value = dataArray[dataIndex] || 0;

        // Map 0-255 to bar height. Scale down slightly to leave some headroom.
        const barHeight = Math.max(4, (value / 255) * (canvas.height * 0.8));

        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#facc15'); // Gold
        gradient.addColorStop(0.5, '#4ade80'); // Neon green
        gradient.addColorStop(1, '#2dd4bf'); // Teal
        ctx.fillStyle = gradient;

        
        const y = (canvas.height - barHeight) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();

        x += barWidth + gap;
      }
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      audioContext.close().catch(console.error);
    };
  }, [stream]);

  // Make canvas wide enough to fit bars. 40 * 4 + 39 * 3 = 160 + 117 = 277. Let's make it 300.
  return <canvas ref={canvasRef} width={320} height={100} className="w-full max-w-[320px] h-16" />;
}
