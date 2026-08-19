import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Plus, X, Smile, Trash2, RotateCcw, Check, Star } from 'lucide-react';
import clsx from 'clsx';

export const DEFAULT_REACTIONS = ['😀', '😂', '❤️', '👍', '🔥', '🎉'];

export const getCustomReactions = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_REACTIONS;
  try {
    const saved = localStorage.getItem('custom_quick_reactions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 6);
    }
  } catch (e) {}
  return DEFAULT_REACTIONS;
};

export const saveCustomReactions = (emojis: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    const valid = emojis.slice(0, 8);
    localStorage.setItem('custom_quick_reactions', JSON.stringify(valid));
    window.dispatchEvent(new Event('custom_reactions_updated'));
  } catch (e) {}
};

export interface ReactionItem {
  id?: string;
  username: string;
  emoji: string;
}


interface ReactionPickerProps {
  isOpen: boolean;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  isMe?: boolean;
  align?: 'left' | 'right' | 'center';
  targetElement?: HTMLElement | null;
  onPin?: () => void;
  isPinned?: boolean;
}

export const ReactionPickerPopup: React.FC<ReactionPickerProps> = ({
  isOpen,
  onSelectEmoji,
  onClose,
  isMe = false,
  align = 'center',
  targetElement,
}) => {
  const [mode, setMode] = useState<'quick' | 'picker' | 'customize'>('quick');
  const [quickEmojis, setQuickEmojis] = useState<string[]>(getCustomReactions);
  const [editEmojis, setEditEmojis] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const anchorRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    positionStyle: 'above' | 'below' | 'center';
    isMobileSheet?: boolean;
    maxHeight?: number;
  }>({
    top: -9999,
    left: -9999,
    positionStyle: 'above'
  });

  const calculatePosition = useCallback(() => {
    if (!isOpen) return;
    const isMobile = window.innerWidth <= 640;
    
    // Detect if viewport height is restricted by keyboard
    const isKeyboardRestricted = window.visualViewport 
      ? window.visualViewport.height < window.innerHeight * 0.75 
      : false;
      
    if ((isMobile || isKeyboardRestricted) && mode !== 'quick') {
       setCoords({ top: 0, left: 0, positionStyle: 'center', isMobileSheet: true });
       return;
    }

    const targetEl = targetElement || anchorRef.current?.parentElement;
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    if (targetRect.width === 0 && targetRect.height === 0) return;

    const navbarEl = document.querySelector('header, nav, .navbar');
    let topBoundary = 56;
    if (navbarEl) {
      const navRect = navbarEl.getBoundingClientRect();
      topBoundary = Math.max(50, navRect.bottom + 8);
    }

    const composerEl = document.querySelector('[data-composer="true"], #chat-composer, footer');
    let bottomBoundary = window.innerHeight - 16;
    if (composerEl) {
      const compRect = composerEl.getBoundingClientRect();
      if (compRect.top > 80) {
        bottomBoundary = compRect.top - 12;
      }
    }

    if (window.visualViewport) {
      const vvBottom = window.visualViewport.offsetTop + window.visualViewport.height;
      bottomBoundary = Math.min(bottomBoundary, vvBottom - 12);
    }

    let popupWidth = 340;
    let popupHeight = 54;
    
    if (mode === 'picker') {
      popupWidth = 350;
      popupHeight = 480;
    } else if (mode === 'customize') {
      popupWidth = 350;
      popupHeight = 520;
    }

    if (popupRef.current) {
      const actualWidth = popupRef.current.offsetWidth;
      if (actualWidth > 0) {
        popupWidth = actualWidth;
      }
    }

    const spaceAbove = targetRect.top - topBoundary;
    const spaceBelow = bottomBoundary - targetRect.bottom;

    let calculatedTop = 0;
    let style: 'above' | 'below' | 'center' = 'above';

    if (spaceAbove >= popupHeight + 8) {
      calculatedTop = targetRect.top - popupHeight - 10;
      style = 'above';
    } else if (spaceBelow >= popupHeight + 8) {
      calculatedTop = targetRect.bottom + 10;
      style = 'below';
    } else {
      calculatedTop = Math.max(
        topBoundary + 8,
        Math.min(targetRect.top - popupHeight - 10, bottomBoundary - popupHeight - 8)
      );
      style = 'center';
    }

    let calculatedLeft = 0;
    if (isMe || align === 'right') {
      calculatedLeft = targetRect.right - popupWidth;
    } else if (align === 'left') {
      calculatedLeft = targetRect.left;
    } else {
      calculatedLeft = targetRect.left + (targetRect.width / 2) - (popupWidth / 2);
    }

    const viewportWidth = window.innerWidth;
    calculatedLeft = Math.max(12, Math.min(calculatedLeft, viewportWidth - popupWidth - 12));

    const maxAllowedHeight = bottomBoundary - calculatedTop;

    setCoords({
      top: Math.round(calculatedTop),
      left: Math.round(calculatedLeft),
      positionStyle: style,
      isMobileSheet: false,
      maxHeight: Math.max(200, maxAllowedHeight)
    });
  }, [isOpen, targetElement, isMe, align, mode]);

  useEffect(() => {
    if (isOpen) {
      setMode('quick');
      setQuickEmojis(getCustomReactions());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      setQuickEmojis(getCustomReactions());
    };
    window.addEventListener('custom_reactions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('custom_reactions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const targetEl = targetElement || anchorRef.current?.parentElement;
    if (targetEl && mode === 'quick') {
      const rect = targetEl.getBoundingClientRect();
      const composerEl = document.querySelector('[data-composer="true"], #chat-composer, footer');
      const bottomLimit = composerEl ? composerEl.getBoundingClientRect().top - 30 : window.innerHeight - 90;
      
      if (rect.bottom > bottomLimit || rect.top < 70) {
        try {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (e) {}
      }
    }
  }, [isOpen, targetElement, mode]);

  useLayoutEffect(() => {
    if (isOpen) {
      calculatePosition();
      const t1 = setTimeout(calculatePosition, 40);
      const t2 = setTimeout(calculatePosition, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen, calculatePosition, mode]);

  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      requestAnimationFrame(calculatePosition);
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('orientationchange', handleUpdate);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleUpdate);
      window.visualViewport.addEventListener('scroll', handleUpdate);
    }

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('orientationchange', handleUpdate);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleUpdate);
        window.visualViewport.removeEventListener('scroll', handleUpdate);
      }
    };
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    let isReady = false;
    const readyTimer = setTimeout(() => {
      isReady = true;
    }, 150);

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (!isReady) return;
      const target = e.target as Node;
      if (popupRef.current && popupRef.current.contains(target)) return;
      if ((target as HTMLElement)?.closest?.('.epr-main, .epr-search-container, .EmojiPickerReact, .emoji-picker-react')) return;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handleClickOutside as EventListener);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(readyTimer);
      document.removeEventListener('pointerdown', handleClickOutside as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }
  };

  const handlePick = (emoji: string) => {
    triggerHaptic();
    onSelectEmoji(emoji);
    onClose();
  };

  const openCustomize = () => {
    triggerHaptic();
    setEditEmojis(quickEmojis);
    setErrorMsg(null);
    setMode('customize');
  };

  const handleRemoveEdit = (emoji: string) => {
    if (editEmojis.length <= 1) return;
    setEditEmojis(editEmojis.filter(e => e !== emoji));
    setErrorMsg(null);
  };

  const handleAddEdit = (emoji: string) => {
    if (editEmojis.length >= 8) {
      setErrorMsg("Maximum 8 quick reactions.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    if (!editEmojis.includes(emoji)) {
      setEditEmojis([...editEmojis, emoji]);
      setErrorMsg(null);
    }
  };

  // Force blur the search input in the Emoji Picker to prevent mobile keyboard from opening
  useEffect(() => {
    if (isOpen && (mode === 'picker' || mode === 'customize')) {
      const timer = setTimeout(() => {
        if (popupRef.current) {
          const searchInputs = popupRef.current.querySelectorAll('input');
          searchInputs.forEach(input => input.blur());
        }
      }, 50); // Short delay to ensure it renders
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  const handleSaveCustomize = () => {
    saveCustomReactions(editEmojis);
    setQuickEmojis(editEmojis);
    setMode('picker');
  };


  // --- Drag to dismiss logic for mobile sheet ---
  useEffect(() => {
    const el = popupRef.current;
    if (!el || !coords.isMobileSheet) return;

    let startY = 0;
    let startTime = 0;
    let isDragging = false;
    let scrollTarget: Element | null = null;
    let currentY = 0;

    const onPointerDown = (e: PointerEvent) => {
      // Only handle touch or pen interactions for the mobile drag to avoid weird mouse behaviors
      if (e.pointerType === 'mouse') return;
      
      startY = e.clientY;
      startTime = Date.now();
      isDragging = false;
      currentY = 0;
      scrollTarget = (e.target as Element).closest('.epr-main, .epr-body');
      
      el.style.transition = 'none';
      // Do not capture pointer unconditionally because it prevents nested scrolling on some browsers
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const deltaY = e.clientY - startY;
      
      if (deltaY > 0) {
        // If we are inside a scrolling container and it's not at the top, let it scroll
        if (scrollTarget && scrollTarget.scrollTop > 0) {
          return;
        }
        
        // Start dragging
        if (!isDragging) {
           isDragging = true;
           // If we start dragging, we can optionally capture the pointer
           el.setPointerCapture(e.pointerId);
        }
        
        currentY = Math.min(deltaY, window.innerHeight);
        el.style.transform = `translateY(${currentY}px)`;
        const backdrop = document.getElementById('picker-backdrop');
        if (backdrop) {
          const progress = Math.min(currentY / 250, 1);
          backdrop.style.opacity = `${1 - progress}`;
        }
        
        // Prevent body scroll / pull to refresh
        if (e.cancelable) e.preventDefault();
      } else if (isDragging) {
        // Dragging back up towards the origin
        currentY = Math.max(0, deltaY);
        el.style.transform = `translateY(${currentY}px)`;
        const backdrop = document.getElementById('picker-backdrop');
        if (backdrop) {
          const progress = Math.min(currentY / 250, 1);
          backdrop.style.opacity = `${1 - progress}`;
        }
        if (e.cancelable) e.preventDefault();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      if (!isDragging) return;
      
      const velocity = currentY / (Date.now() - startTime);
      el.style.transition = 'transform 250ms ease-out';
      const backdrop = document.getElementById('picker-backdrop');
      if (backdrop) {
        backdrop.style.transition = 'opacity 250ms ease-out';
      }
      
      if (currentY >= 120 || velocity > 1.0) {
        el.style.transform = `translateY(100%)`;
        if (backdrop) backdrop.style.opacity = '0';
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            if (popupRef.current) popupRef.current.style.transform = 'translateY(0)';
            if (backdrop) {
              backdrop.style.opacity = '1';
              backdrop.style.transition = '';
            }
          }, 100);
        }, 250);
      } else {
        el.style.transform = `translateY(0)`;
        if (backdrop) {
          backdrop.style.opacity = '1';
          setTimeout(() => {
            if (backdrop) backdrop.style.transition = '';
          }, 250);
        }
      }
      
      isDragging = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    // Use pointer events with touch-action style dynamically assigned to the popup if needed
    // Note: To prevent default browser touch actions from taking over immediately, touch-action: pan-y or none might be needed via CSS if the browser cancels pointer events. However, we'll keep passive: false for standard behaviors.
    el.addEventListener('pointerdown', onPointerDown, { passive: true });
    el.addEventListener('pointermove', onPointerMove, { passive: false });
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    // Some browsers still require touch listeners to preventDefault effectively for scrolling, 
    // so we optionally add a touchmove listener to just prevent scroll when dragging.
    const preventTouch = (e: TouchEvent) => {
       if (isDragging && e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchmove', preventTouch, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('touchmove', preventTouch);
      el.style.transform = 'translateY(0)';
    };
  }, [coords.isMobileSheet, isOpen]);

  if (!isOpen) return null;


  const renderContent = () => {
    if (mode === 'quick') {
      return (
        <motion.div
          key="quick"
          initial={{ opacity: 0, scale: 0.75, y: coords.positionStyle === 'above' ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.75, y: coords.positionStyle === 'above' ? 8 : -8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="flex items-center gap-1 sm:gap-1.5 bg-[#181818]/98 backdrop-blur-2xl border border-white/20 p-1.5 sm:p-2 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.85)] max-w-[calc(100vw-2rem)] overflow-x-auto justify-start no-scrollbar pointer-events-auto"
        >
          {quickEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              aria-label={`React with ${emoji}`}
              onClick={(e) => { e.stopPropagation(); handlePick(emoji); }}
              className="w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] sm:min-w-[40px] flex-shrink-0 flex items-center justify-center text-xl sm:text-2xl hover:scale-135 active:scale-90 transition-transform duration-150 rounded-full hover:bg-white/10 relative group"
            >
              <span className="transform transition-transform">{emoji}</span>
              {index === 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 border border-black rounded-full flex items-center justify-center shadow" title="Default reaction on double-tap">
                  <Star className="w-2 h-2 fill-black text-black" />
                </span>
              )}
            </button>
          ))}
          <div className="w-[1px] h-6 bg-white/15 mx-0.5 flex-shrink-0" />
          <button
            type="button"
            aria-label="More emojis"
            onClick={(e) => { e.stopPropagation(); triggerHaptic(); setMode('picker'); }}
            className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] flex-shrink-0 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/15 transition-all"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </motion.div>
      );
    }

    if (mode === 'picker') {
      return (
        <motion.div
          key="picker"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={clsx(
            "bg-[#181818] border border-white/15 shadow-2xl flex flex-col pointer-events-auto overflow-hidden",
            coords.isMobileSheet ? "w-full rounded-t-3xl max-h-[85dvh]" : "w-[350px] rounded-3xl"
          )}
          style={coords.isMobileSheet ? { height: '85dvh' } : { height: '480px', maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85dvh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {coords.isMobileSheet && <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-3 flex-shrink-0" />}
          
          <div className="flex flex-col border-b border-white/10 shrink-0">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm font-semibold text-white">Your Reactions</span>
              <button 
                onClick={(e) => { e.stopPropagation(); openCustomize(); }} 
                aria-label="Customize quick reactions"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-400/10 transition-colors"
              >
                Customize
              </button>
            </div>
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
              {quickEmojis.map(emoji => (
                <button 
                  key={emoji} 
                  aria-label={`React with ${emoji}`}
                  onClick={(e) => { e.stopPropagation(); handlePick(emoji); }} 
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-2xl bg-white/5 rounded-full hover:bg-white/15 hover:scale-110 active:scale-95 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
                    <div className="flex-1 w-full min-h-0 flex flex-col" >
            <EmojiPicker
              theme={Theme.DARK}
              autoFocusSearch={false}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handlePick(e.emoji)}
              width="100%"
              height="100%"
              style={{ flex: 1, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />
          </div>
        </motion.div>
      );
    }

    if (mode === 'customize') {
      return (
        <motion.div
          key="customize"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={clsx(
            "bg-[#181818] border border-white/15 shadow-2xl flex flex-col pointer-events-auto overflow-hidden",
            coords.isMobileSheet ? "w-full rounded-t-3xl max-h-[85dvh]" : "w-[350px] rounded-3xl"
          )}
          style={coords.isMobileSheet ? { height: '85dvh' } : { height: '560px', maxHeight: 'min(90vh, 560px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {coords.isMobileSheet && <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-3 flex-shrink-0" />}

          <div className="flex flex-col items-center justify-center px-5 py-4 border-b border-white/10 shrink-0 bg-[#222222]">
            <h3 className="text-base font-bold text-white">Customize Quick Reactions</h3>
            <p className="text-xs text-neutral-400 mt-1">Set up to 8 emojis. First emoji is your default.</p>
          </div>
          
          <div className="p-4 flex flex-col border-b border-white/10 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 select-none">
              <Reorder.Group 
                axis="x" 
                values={editEmojis} 
                onReorder={setEditEmojis} 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2"
              >
                {editEmojis.map((emoji, index) => (
                  <Reorder.Item 
                    key={emoji} 
                    value={emoji} 
                    className="shrink-0 relative cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl relative">
                      {emoji}
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 border border-[#181818] rounded-full flex items-center justify-center" title="Default reaction on double-tap">
                           <Star className="w-2.5 h-2.5 fill-black text-black" />
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${emoji} from quick reactions`}
                        onClick={(e) => { e.stopPropagation(); handleRemoveEdit(emoji); }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 border-2 border-[#181818] rounded-full flex items-center justify-center transition-colors shadow-sm"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm text-center mt-3 font-medium">
                {errorMsg}
              </motion.div>
            )}
          </div>

                    <div className="flex-1 w-full min-h-0 flex flex-col" >
            <EmojiPicker
              theme={Theme.DARK}
              autoFocusSearch={false}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handleAddEdit(e.emoji)}
              width="100%"
              height="100%"
              style={{ flex: 1, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />
          </div>
          
          <div className="px-5 py-4 border-t border-white/10 bg-[#222222] flex justify-end gap-3 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMode('picker'); }}
              aria-label="Cancel customization"
              className="px-5 py-2.5 rounded-xl font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleSaveCustomize(); }}
              aria-label="Save quick reactions"
              className="px-6 py-2.5 rounded-xl font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-lg shadow-blue-500/20"
            >
              Save
            </button>
          </div>
        </motion.div>
      );
    }
  };

  const portalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            id="picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              "fixed inset-0 backdrop-blur-[2px] z-[99998]",
              mode === 'quick' ? "bg-black/20" : "bg-black/60"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
          <div 
            ref={popupRef}
            style={coords.isMobileSheet ? {
               zIndex: 99999,
               pointerEvents: 'none'
            } : (mode === 'customize' ? {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999,
              pointerEvents: 'none'
            } : {
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
              pointerEvents: 'none'
            })}
            className={clsx(
               "select-none",
               !coords.isMobileSheet && "max-w-[calc(100vw-1.5rem)]",
               coords.isMobileSheet && "fixed bottom-0 w-full flex flex-col justify-end left-0 right-0 z-[100000]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span ref={anchorRef} className="hidden" />
      {typeof document !== 'undefined' ? createPortal(portalContent, document.body) : null}
    </>
  );
};
interface ReactionBubbleProps {
  reactions: ReactionItem[];
  currentUsername: string;
  onToggleEmoji: (emoji: string) => void;
  onOpenUsersModal: () => void;
  isMe?: boolean;
}

export const ReactionBubblePill: React.FC<ReactionBubbleProps> = ({
  reactions = [],
  currentUsername,
  onToggleEmoji,
  onOpenUsersModal,
  isMe = false
}) => {
  if (!reactions || reactions.length === 0) return null;

  // Aggregate reactions by emoji
  const grouped: { [emoji: string]: { count: number; reactedByMe: boolean; users: string[] } } = {};
  reactions.forEach(r => {
    if (!r.emoji) return;
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { count: 0, reactedByMe: false, users: [] };
    }
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.username);
    if (r.username === currentUsername) {
      grouped[r.emoji].reactedByMe = true;
    }
  });

  const uniqueEntries = Object.entries(grouped);
  if (uniqueEntries.length === 0) return null;

  return (
    <div 
      className={clsx(
        "flex flex-wrap items-center gap-1.5 mt-1 z-10 select-none",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      {/* Single clean reaction pill per emoji type */}
      {uniqueEntries.map(([emoji, { count, reactedByMe, users }]) => {
        const usersStr = Array.from(new Set(users)).join(', ');
        return (
          <button
            key={emoji}
            type="button"
            aria-label={`Reaction ${emoji}. Reacted by ${usersStr}. Click to ${reactedByMe ? 'remove' : 'add'} reaction.`}
            title={`Reacted by: ${usersStr}. Click to ${reactedByMe ? 'remove' : 'add'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleEmoji(emoji);
            }}
            className={clsx(
              "inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all active:scale-90 shadow-sm cursor-pointer select-none",
              reactedByMe
                ? "bg-blue-600/25 border-blue-500/60 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.25)] hover:bg-blue-600/35"
                : "bg-neutral-900/90 border-white/10 text-neutral-300 hover:bg-white/10 hover:border-white/20"
            )}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span className="text-[11px] font-bold">{count}</span>
          </button>
        );
      })}

      {/* Optional reactors info button when multiple reactions exist */}
      {reactions.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenUsersModal();
          }}
          className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-neutral-900/80 border border-white/10 text-[10px] text-neutral-400 hover:text-white hover:bg-white/15 transition-colors font-medium"
          title="See who reacted"
        >
          <span>Who reacted</span>
        </button>
      )}
    </div>
  );
};

interface ReactedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactions: ReactionItem[];
  currentUsername: string;
  onRemoveReaction: (emoji: string) => void;
}

export const ReactedUsersModal: React.FC<ReactedUsersModalProps> = ({
  isOpen,
  onClose,
  reactions = [],
  currentUsername,
  onRemoveReaction
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;


  // Count per emoji
  const counts: { [emoji: string]: number } = {};
  reactions.forEach(r => {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
  });

  const filteredReactions = selectedFilter === 'all'
    ? reactions
    : reactions.filter(r => r.emoji === selectedFilter);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="bg-[#1f1f1f] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Sheet Grab Handle */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-2 sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>Reactions</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-neutral-300">
                {reactions.length}
              </span>
            </h3>
            <button
              type="button"
              aria-label="Close reactions modal"
              onClick={onClose}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 overflow-x-auto custom-scrollbar bg-neutral-900/50">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0",
                selectedFilter === 'all'
                  ? "bg-white text-black font-semibold"
                  : "text-neutral-400 hover:text-white hover:bg-white/10"
              )}
            >
              All ({reactions.length})
            </button>

            {Object.entries(counts).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedFilter(emoji)}
                className={clsx(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0",
                  selectedFilter === emoji
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-neutral-300 hover:bg-white/10"
                )}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredReactions.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-sm">
                No reactions found.
              </div>
            ) : (
              filteredReactions.map((r, idx) => {
                const isMe = r.username === currentUsername;
                return (
                  <div 
                    key={r.id || `${r.username}-${r.emoji}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-neutral-700 border border-white/10 flex items-center justify-center font-bold text-sm text-white">
                        {r.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white flex items-center gap-1.5">
                          {r.username}
                          {isMe && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded">You</span>}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {isMe ? 'Tap emoji or button to remove' : 'Reacted'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{r.emoji}</span>
                      {isMe && (
                        <button
                          type="button"
                          aria-label="Remove my reaction"
                          onClick={() => {
                            onRemoveReaction(r.emoji);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                          title="Remove reaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
