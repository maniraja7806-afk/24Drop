import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# We want to replace from `/**` right before `QuickReactionEditorModalProps`
# down to the end of `ReactionPickerPopup` component (just before `interface ReactionBubbleProps`)

new_content = """
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
  }>({
    top: -9999,
    left: -9999,
    positionStyle: 'above'
  });

  const calculatePosition = useCallback(() => {
    if (!isOpen) return;
    const isMobile = window.innerWidth <= 640;
    
    if (isMobile && mode !== 'quick') {
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
      const actualHeight = popupRef.current.offsetHeight;
      if (actualWidth > 0 && actualHeight > 0) {
        popupWidth = actualWidth;
        popupHeight = actualHeight;
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

    setCoords({
      top: Math.round(calculatedTop),
      left: Math.round(calculatedLeft),
      positionStyle: style,
      isMobileSheet: false
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

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popupRef.current && popupRef.current.contains(target)) return;
      if ((target as HTMLElement)?.closest?.('.epr-main, .epr-search-container, .EmojiPickerReact, .emoji-picker-react')) return;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  const handleSaveCustomize = () => {
    saveCustomReactions(editEmojis);
    setQuickEmojis(editEmojis);
    setMode('picker');
  };

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
            coords.isMobileSheet ? "w-full rounded-t-3xl max-h-[85vh]" : "w-[350px] rounded-3xl"
          )}
          style={coords.isMobileSheet ? {} : { maxHeight: 'min(500px, 85vh)' }}
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
          <div className="flex-1 w-full min-h-[300px] overflow-hidden flex flex-col">
            <EmojiPicker
              theme={Theme.DARK}
              onEmojiClick={(e) => handlePick(e.emoji)}
              lazyLoadEmojis
              width="100%"
              height="100%"
              style={{ '--epr-bg-color': 'transparent', border: 'none' } as any}
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
            coords.isMobileSheet ? "w-full rounded-t-3xl max-h-[85vh]" : "w-[350px] rounded-3xl"
          )}
          style={coords.isMobileSheet ? {} : { maxHeight: 'min(600px, 90vh)' }}
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
                className="flex flex-wrap justify-center gap-3"
              >
                {editEmojis.map((emoji, index) => (
                  <Reorder.Item 
                    key={emoji} 
                    value={emoji} 
                    className="relative cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
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

          <div className="flex-1 w-full min-h-[250px] overflow-hidden flex flex-col">
            <EmojiPicker
              theme={Theme.DARK}
              onEmojiClick={(e) => handleAddEdit(e.emoji)}
              lazyLoadEmojis
              width="100%"
              height="100%"
              style={{ '--epr-bg-color': 'transparent', border: 'none' } as any}
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
               position: 'fixed',
               bottom: 0,
               left: 0,
               right: 0,
               zIndex: 99999,
               display: 'flex',
               flexDirection: 'column',
               justifyContent: 'flex-end',
               pointerEvents: 'none'
            } : {
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
              pointerEvents: 'none'
            }}
            className={clsx(
               "select-none",
               !coords.isMobileSheet && "max-w-[calc(100vw-1.5rem)]"
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
"""

pattern = re.compile(r'/\*\*\n \* Quick Reaction Customization Modal\n \*/\nexport interface QuickReactionEditorModalProps \{.*?(?=interface ReactionBubbleProps \{)', re.DOTALL)
new_content_full = pattern.sub(new_content, content)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(new_content_full)
