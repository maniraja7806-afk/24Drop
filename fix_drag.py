import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

drag_effect = """
  // --- Drag to dismiss logic for mobile sheet ---
  useEffect(() => {
    const el = popupRef.current;
    if (!el || !coords.isMobileSheet) return;

    let startY = 0;
    let startTime = 0;
    let isDragging = false;
    let scrollTarget: Element | null = null;
    let currentY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
      isDragging = false;
      currentY = 0;
      scrollTarget = (e.target as Element).closest('.epr-main, .epr-body');
      
      el.style.transition = 'none';
    };

    const onTouchMove = (e: TouchEvent) => {
      const deltaY = e.touches[0].clientY - startY;
      
      if (deltaY > 0) {
        // If we are inside a scrolling container and it's not at the top, let it scroll
        if (scrollTarget && scrollTarget.scrollTop > 0) {
          return;
        }
        
        // Start dragging
        isDragging = true;
        
        currentY = Math.min(deltaY, window.innerHeight);
        el.style.transform = `translateY(${currentY}px)`;
        
        // Prevent body scroll / pull to refresh
        if (e.cancelable) e.preventDefault();
      } else if (isDragging) {
        // Dragging back up towards the origin
        currentY = Math.max(0, deltaY);
        el.style.transform = `translateY(${currentY}px)`;
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      
      const velocity = currentY / (Date.now() - startTime);
      el.style.transition = 'transform 250ms ease-out';
      
      if (currentY >= 120 || velocity > 1.0) {
        el.style.transform = `translateY(100%)`;
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            if (popupRef.current) popupRef.current.style.transform = 'translateY(0)';
          }, 100);
        }, 250);
      } else {
        el.style.transform = `translateY(0)`;
      }
      
      isDragging = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.style.transform = 'translateY(0)';
    };
  }, [coords.isMobileSheet, isOpen]);

  if (!isOpen) return null;
"""

content = content.replace('  if (!isOpen) return null;', drag_effect)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
