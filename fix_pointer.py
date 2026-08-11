import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

old_drag = """    const onTouchStart = (e: TouchEvent) => {
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

    const onTouchEnd = () => {
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
    };"""

new_drag = """    const onPointerDown = (e: PointerEvent) => {
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
    };"""

content = content.replace(old_drag, new_drag)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
