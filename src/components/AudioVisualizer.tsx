import React, { useEffect, useRef } from 'react';

export function AudioVisualizer({ stream }: { stream: MediaStream }) {
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
    analyser.fftSize = 64;
    
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
      
      // Draw 5 bars
      const numBars = 5;
      const barWidth = 2;
      const gap = 2;
      const totalWidth = numBars * barWidth + (numBars - 1) * gap;
      let x = (canvas.width - totalWidth) / 2;
      
      for (let i = 0; i < numBars; i++) {
        // Sample from the frequency data (spread across the buffer)
        const dataIndex = Math.floor(i * (bufferLength / numBars));
        const value = dataArray[dataIndex];
        
        // Map 0-255 to a min height of 2 and max height of canvas.height
        const barHeight = Math.max(2, (value / 255) * canvas.height);
        
        ctx.fillStyle = `rgb(239, 68, 68)`; // red-500
        
        // Center vertically
        const y = (canvas.height - barHeight) / 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1);
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
  
  return <canvas ref={canvasRef} width={20} height={20} className="w-5 h-5" />;
}
