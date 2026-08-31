import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

export function AudioPlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const rates = [0.5, 1, 1.5, 2];

  useEffect(() => {
    let active = true;
    const fetchAudioData = async () => {
      try {
        const res = await fetch(src);
        if (!active) return;
        if (!res.ok) {
          throw new Error(`Failed to load audio (${res.status})`);
        }
        
        // Try to get file size
        const size = res.headers.get('content-length');
        if (size) {
          setFileSize(parseInt(size, 10));
        }

        const arrayBuffer = await res.arrayBuffer();
        if (!active) return;
        
        if (!size) {
          setFileSize(arrayBuffer.byteLength);
        }

        // Decode for waveform
        let audioContext: AudioContext | null = null;
        try {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const rawData = audioBuffer.getChannelData(0);
          const samples = 40;
          const blockSize = Math.floor(rawData.length / samples);
          const filteredData = [];
          for (let i = 0; i < samples; i++) {
            let blockStart = blockSize * i;
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
              sum = sum + Math.abs(rawData[blockStart + j]);
            }
            filteredData.push(sum / blockSize);
          }
          
          const maxVal = Math.max(...filteredData);
          const multiplier = maxVal ? Math.pow(maxVal, -1) : 1;
          const normalizedData = filteredData.map(n => n * multiplier);
          if (active) {
            setWaveform(normalizedData);
          }
        } finally {
          if (audioContext) {
            audioContext.close().catch(console.error);
          }
        }
      } catch (e) {
        console.error("Failed to generate waveform", e);
        // Fallback to random waveform if decode fails
        if (active) {
          const fakeWaveform = Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2);
          setWaveform(fakeWaveform);
        }
      }
    };
    fetchAudioData();
    return () => { active = false; };
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e);
          toast.error("Failed to play audio. The format may be unsupported.");
        });
      }
    }
  };

  const toggleRate = () => {
    if (audioRef.current) {
      const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
      const nextRate = rates[nextIndex];
      audioRef.current.playbackRate = nextRate;
      setPlaybackRate(nextRate);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = (Number(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(Number(e.target.value));
    }
  };

  const handleSeekWaveform = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(percentage * 100);
    }
  };

  const handleEnded = () => {
    if (audioRef.current) {
      // Find next audio player in the same context
      const container = audioRef.current.closest('.messages-list, .feed-list') || document.body;
      const audioPlayers = Array.from(container.querySelectorAll('audio.chat-audio-player'));
      const currentIndex = audioPlayers.indexOf(audioRef.current);
      
      if (currentIndex !== -1 && currentIndex + 1 < audioPlayers.length) {
        const nextAudio = audioPlayers[currentIndex + 1] as HTMLAudioElement;
        nextAudio.play().catch(console.error);
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number | null) => {
    if (bytes === null) return "";
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col space-y-1 w-full max-w-md">
      <div className="flex items-center space-x-3 bg-black/20 rounded-[20px] p-2 pr-3 w-full">
        <button 
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={togglePlay}
          className="w-10 h-10 flex-shrink-0 bg-[#3b82f6] text-white rounded-full flex items-center justify-center hover:bg-[#2563eb] transition-colors shadow-sm"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
        </button>
        
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          {waveform.length > 0 ? (
            <div 
              className="relative h-8 flex items-center cursor-pointer group w-full"
              onClick={handleSeekWaveform}
            >
              <div className="flex items-center space-x-[2px] w-full h-full">
                {waveform.map((amp, i) => {
                  const isPlayed = (i / waveform.length) * 100 <= progress;
                  return (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full transition-colors duration-100 ${isPlayed ? 'bg-[#3b82f6]' : 'bg-white/30 group-hover:bg-white/40'}`}
                      style={{ height: `${Math.max(15, amp * 100)}%` }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-8 flex items-center w-full">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress || 0}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          )}
        </div>

        <button 
          aria-label="Toggle playback rate"
          onClick={toggleRate}
          className="flex-shrink-0 w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-xs font-medium text-white transition-colors"
        >
          {playbackRate}x
        </button>

        <audio 
          ref={audioRef} 
          src={src} 
          className="chat-audio-player hidden"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
      
      <div className="flex justify-between items-center px-1 text-[11px] text-neutral-400 font-medium">
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        <span>{fileSize ? formatBytes(fileSize) : ''}</span>
      </div>
    </div>
  );
}
