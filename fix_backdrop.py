import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# Add ID to backdrop
old_backdrop = """          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              "fixed inset-0 backdrop-blur-[2px] z-[99998]",
              mode === 'quick' ? "bg-black/20" : "bg-black/60"
            )}
            onClick={(e) => {"""

new_backdrop = """          <motion.div
            id="picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              "fixed inset-0 backdrop-blur-[2px] z-[99998]",
              mode === 'quick' ? "bg-black/20" : "bg-black/60"
            )}
            onClick={(e) => {"""

content = content.replace(old_backdrop, new_backdrop)

# Update the effect
old_effect = """        currentY = Math.min(deltaY, window.innerHeight);
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
      }"""

new_effect = """        currentY = Math.min(deltaY, window.innerHeight);
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
      }"""

content = content.replace(old_effect, new_effect)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
