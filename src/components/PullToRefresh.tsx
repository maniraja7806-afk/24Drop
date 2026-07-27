import React, { useState, useRef, ReactNode, UIEventHandler, MouseEventHandler } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface Props {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onScroll?: UIEventHandler<HTMLDivElement>;
}

export const PullToRefresh = ({ onRefresh, children, className = "", onClick, onScroll }: Props) => {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const MAX_PULL_DISTANCE = 80;
  const THRESHOLD = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 1) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0 && containerRef.current && containerRef.current.scrollTop <= 1) {
      setPullDistance(Math.min(distance * 0.4, MAX_PULL_DISTANCE));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD); // keep it showing loader
      try {
        await onRefresh();
      } catch (err) {
        console.error(err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  return (
    <div 
      className={`relative flex-1 overflow-y-auto ${className}`}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
      onScroll={onScroll}
    >
      <div 
        className="absolute left-0 right-0 flex justify-center items-center overflow-hidden transition-all duration-200 z-10"
        style={{ height: `${pullDistance}px`, top: 0 }}
      >
        <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center shadow-lg border border-white/5">
           <Loader2 className={clsx("w-4 h-4 text-neutral-400", isRefreshing ? "animate-spin" : "rotate-0")} style={{ transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : undefined }} />
        </div>
      </div>
      <div className="transition-transform duration-200" style={{ transform: `translateY(${pullDistance > 0 ? pullDistance : 0}px)` }}>
        {children}
      </div>
    </div>
  );
};
