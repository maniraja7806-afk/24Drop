import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Check, X } from 'lucide-react';

function encodeWAV(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}

export function AudioTrimmer({ 
  blob, 
  onConfirm, 
  onCancel 
}: { 
  blob: Blob, 
  onConfirm: (blob: Blob) => void, 
  onCancel: () => void 
}) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trimStart, setTrimStart] = useState(0); // 0 to 1
  const [trimEnd, setTrimEnd] = useState(1); // 0 to 1
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 1 relative to full duration
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    const loadAudio = async () => {
      const arrayBuffer = await blob.arrayBuffer();
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      if (active) {
        setAudioBuffer(buffer);
        drawWaveform(buffer);
      }
    };
    loadAudio();
    return () => {
      active = false;
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [blob]);

  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4ade80';

    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  };

  const handlePlayPause = () => {
    if (!audioBuffer || !audioContextRef.current) return;

    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current!);
    } else {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      const duration = audioBuffer.duration;
      const startOffset = trimStart * duration;
      const endOffset = trimEnd * duration;
      
      source.start(0, startOffset, endOffset - startOffset);
      sourceNodeRef.current = source;
      setIsPlaying(true);
      startTimeRef.current = audioContextRef.current.currentTime - startOffset;

      const updateProgress = () => {
        if (!audioContextRef.current) return;
        const current = audioContextRef.current.currentTime - startTimeRef.current;
        setPlaybackProgress(current / duration);
        if (current >= endOffset) {
          setIsPlaying(false);
          setPlaybackProgress(trimStart);
          return;
        }
        animationRef.current = requestAnimationFrame(updateProgress);
      };
      animationRef.current = requestAnimationFrame(updateProgress);

      source.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(trimStart);
        cancelAnimationFrame(animationRef.current!);
      };
    }
  };

  const handleConfirm = () => {
    if (!audioBuffer) return;
    const startSample = Math.floor(trimStart * audioBuffer.length);
    const endSample = Math.floor(trimEnd * audioBuffer.length);
    const sliced = audioBuffer.getChannelData(0).slice(startSample, endSample);
    const trimmedBlob = encodeWAV(sliced, audioBuffer.sampleRate);
    onConfirm(trimmedBlob);
  };

  return (
    <div className="flex-1 bg-[#212121] rounded-[24px] px-4 py-4 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden w-full">
      <div className="flex items-center justify-between w-full mb-4">
        <span className="text-white text-sm font-medium">Trim Audio</span>
        <button aria-label="Cancel trimming" onClick={onCancel} className="text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative w-full h-16 bg-neutral-800 rounded-lg overflow-hidden mb-4">
        <canvas ref={canvasRef} width={600} height={64} className="w-full h-full" />
        
        {/* Playback progress line */}
        {isPlaying && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" 
            style={{ left: `${playbackProgress * 100}%` }}
          />
        )}

        {/* Trimmer UI */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-black/60 border-r-2 border-yellow-400"
          style={{ width: `${trimStart * 100}%` }}
        />
        <div 
          className="absolute top-0 bottom-0 right-0 bg-black/60 border-l-2 border-yellow-400"
          style={{ width: `${(1 - trimEnd) * 100}%` }}
        />

        <input 
          type="range" 
          min="0" max="1" step="0.01" 
          value={trimStart}
          onChange={(e) => setTrimStart(Math.min(parseFloat(e.target.value), trimEnd - 0.05))}
          className="absolute top-0 bottom-0 w-full opacity-0 cursor-ew-resize z-20"
        />
        <input 
          type="range" 
          min="0" max="1" step="0.01" 
          value={trimEnd}
          onChange={(e) => setTrimEnd(Math.max(parseFloat(e.target.value), trimStart + 0.05))}
          className="absolute top-0 bottom-0 w-full opacity-0 cursor-ew-resize z-20"
        />
      </div>

      <div className="flex items-center justify-between w-full px-4">
        <button 
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={handlePlayPause}
          className="w-10 h-10 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        
        <button 
          onClick={handleConfirm}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white text-sm font-medium flex items-center space-x-2"
        >
          <Check className="w-4 h-4" />
          <span>Finalize</span>
        </button>
      </div>
    </div>
  );
}
