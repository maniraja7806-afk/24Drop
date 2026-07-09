import React, { useState, useEffect, useRef } from 'react';

export function RecordingTimer({ isRecording, isPaused }: { isRecording: boolean, isPaused?: boolean }) {
  const [time, setTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      startTimeRef.current = Date.now();
      interval = setInterval(() => {
        setTime(accumulatedTimeRef.current + (Date.now() - startTimeRef.current));
      }, 100);
    } else if (isRecording && isPaused) {
      accumulatedTimeRef.current += (Date.now() - startTimeRef.current);
      setTime(accumulatedTimeRef.current);
    } else {
      setTime(0);
      accumulatedTimeRef.current = 0;
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const totalSeconds = time / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const deci = Math.floor((totalSeconds % 1) * 10);

  return (
    <>{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}.{deci}</>
  );
}
