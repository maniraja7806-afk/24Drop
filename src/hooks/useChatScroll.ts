import { useState, useRef, useEffect, useCallback, UIEvent } from 'react';

interface UseChatScrollProps {
  messages: any[];
  posts: any[];
  view: string;
  activeChat: any;
  activeThread: any;
  onScrollAction?: () => void;
}

export const useChatScroll = ({
  messages,
  posts,
  view,
  activeChat,
  activeThread,
  onScrollAction
}: UseChatScrollProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  const isProgrammaticScrollRef = useRef(false);
  const targetScrollTopRef = useRef<number | null>(null);
  const programTimerRef = useRef<any>(null);
  const activeScrollRafRef = useRef<number | null>(null);

  const updateIsAtBottom = useCallback((val: boolean) => {
    isAtBottomRef.current = val;
    setIsAtBottom(val);
  }, []);

  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLengthRef = useRef(0);
  const prevPostsLengthRef = useRef(0);
  const prevLastMsgIdRef = useRef<string | null>(null);
  const prevLastPostIdRef = useRef<string | null>(null);

  // Attach user interaction listeners to know when user manually scrolls away
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleUserInteraction = () => {
      if (activeScrollRafRef.current !== null) {
        cancelAnimationFrame(activeScrollRafRef.current);
        activeScrollRafRef.current = null;
      }
      isProgrammaticScrollRef.current = false;
      if (programTimerRef.current) {
        clearTimeout(programTimerRef.current);
        programTimerRef.current = null;
      }
    };

    container.addEventListener('wheel', handleUserInteraction, { passive: true });
    container.addEventListener('touchstart', handleUserInteraction, { passive: true });
    container.addEventListener('pointerdown', handleUserInteraction, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleUserInteraction);
      container.removeEventListener('touchstart', handleUserInteraction);
      container.removeEventListener('pointerdown', handleUserInteraction);
    };
  }, [view, activeChat, activeThread]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (activeScrollRafRef.current !== null) {
      cancelAnimationFrame(activeScrollRafRef.current);
      activeScrollRafRef.current = null;
    }

    isProgrammaticScrollRef.current = true;
    updateIsAtBottom(true);

    if (programTimerRef.current) clearTimeout(programTimerRef.current);

    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      setUnreadCount(0);

      const calculateTarget = () => {
        const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
        return maxScroll;
      };

      let finalScrollTop = calculateTarget();
      targetScrollTopRef.current = finalScrollTop;

      const startScrollTop = container.scrollTop;
      const distance = finalScrollTop - startScrollTop;

      if (!smooth || Math.abs(distance) < 2) {
        container.scrollTop = finalScrollTop;
        isProgrammaticScrollRef.current = false;
        return;
      }

      // Spring physics parameters for snappy, natural native-like chat auto-scroll
      const stiffness = 220;
      const damping = 26;
      let currentPos = startScrollTop;
      let velocity = 0;
      let lastTime = performance.now();

      const animateStep = (now: number) => {
        finalScrollTop = calculateTarget();
        targetScrollTopRef.current = finalScrollTop;

        let dt = (now - lastTime) / 1000;
        lastTime = now;
        if (dt > 0.064) dt = 0.016; // Guard against frame drops or tab switching

        const displacement = currentPos - finalScrollTop;
        const springForce = -stiffness * displacement;
        const dampingForce = -damping * velocity;
        const acceleration = springForce + dampingForce;

        velocity += acceleration * dt;
        currentPos += velocity * dt;
        container.scrollTop = currentPos;

        if (Math.abs(currentPos - finalScrollTop) < 0.5 && Math.abs(velocity) < 5) {
          container.scrollTop = finalScrollTop;
          activeScrollRafRef.current = null;
          isProgrammaticScrollRef.current = false;
        } else {
          activeScrollRafRef.current = requestAnimationFrame(animateStep);
        }
      };

      activeScrollRafRef.current = requestAnimationFrame(animateStep);
    });
  }, [updateIsAtBottom]);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    if (onScrollAction) {
      onScrollAction();
    }
    const container = e.currentTarget;

    if (isProgrammaticScrollRef.current) {
      if (programTimerRef.current) clearTimeout(programTimerRef.current);
      const isCloseToTarget = targetScrollTopRef.current !== null && 
        Math.abs(container.scrollTop - targetScrollTopRef.current) <= 4;
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      const isAtMax = Math.abs(container.scrollTop - maxScroll) <= 4;

      if (isCloseToTarget || isAtMax) {
        isProgrammaticScrollRef.current = false;
      } else {
        programTimerRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 120);
        return;
      }
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom <= 100;
    
    updateIsAtBottom(nearBottom);

    if (nearBottom) {
      setUnreadCount(0);
    }
  }, [updateIsAtBottom, onScrollAction]);

  // Single requestAnimationFrame-based observer synchronizing scroll container's scrollTop, composer height, and visualViewport
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const composerEl = document.getElementById('chat-composer');

    const reconcileScroll = () => {
      if (!(view === 'chat' || activeThread)) return;
      if (isProgrammaticScrollRef.current) return;
      
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const nearBottom = distanceFromBottom <= 100;
      
      if (nearBottom || isAtBottomRef.current) {
        scrollToBottom(false);
      }
    };

    let syncRafId: number | null = null;
    const scheduleSync = () => {
      if (syncRafId !== null) cancelAnimationFrame(syncRafId);
      syncRafId = requestAnimationFrame(() => {
        syncRafId = null;
        reconcileScroll();
      });
    };

    const observer = new ResizeObserver(scheduleSync);
    observer.observe(container);
    if (composerEl) {
      observer.observe(composerEl);
    }

    window.addEventListener('resize', scheduleSync);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleSync);
      window.visualViewport.addEventListener('scroll', scheduleSync);
    }

    return () => {
      if (syncRafId !== null) cancelAnimationFrame(syncRafId);
      observer.disconnect();
      window.removeEventListener('resize', scheduleSync);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', scheduleSync);
        window.visualViewport.removeEventListener('scroll', scheduleSync);
      }
    };
  }, [view, activeChat, activeThread, scrollToBottom]);

  // WhatsApp-like Smart Auto-scroll (Global Sync Fix)
  useEffect(() => {
    if (view === 'chat' || activeThread) {
      const isNewMsgAdded = messages.length > prevMessagesLengthRef.current;
      const prevLength = prevMessagesLengthRef.current;
      prevMessagesLengthRef.current = messages.length;

      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
      const isGenuinelyNewMessage = lastMsg && prevLastMsgIdRef.current && lastMsg.id !== prevLastMsgIdRef.current;
      prevLastMsgIdRef.current = lastMsg ? lastMsg.id : null;

      if (isNewMsgAdded && messages.length > 0) {
        if (prevLength === 0) {
          // Initial chat load
          scrollToBottom(false);
        } else if (isGenuinelyNewMessage) {
          // Genuinely new real-time message appended -> forcefully auto-scroll everyone
          scrollToBottom(true);
          // Fallback for image loading layout shifts
          setTimeout(() => scrollToBottom(true), 100);
        } else {
          // Same last message ID, meaning length increased due to historical messages prepending or similar
          // Do not steal focus/scroll if they are reading up
          const container = scrollContainerRef.current;
          const isNearBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 300) : true;
          
          if (!isNearBottom && !isAtBottomRef.current) {
            setUnreadCount(prev => prev + (messages.length - prevLength));
          }
        }
      } else if (messages.length > 0 && prevLength === 0) {
        // Initial chat load
        scrollToBottom(false);
      }
    } else if (view === 'feed') {
      const isNewPostAdded = posts.length > prevPostsLengthRef.current;
      const prevLength = prevPostsLengthRef.current;
      prevPostsLengthRef.current = posts.length;

      const lastPost = posts.length > 0 ? posts[posts.length - 1] : null;
      const isGenuinelyNewPost = lastPost && prevLastPostIdRef.current && lastPost.id !== prevLastPostIdRef.current;
      prevLastPostIdRef.current = lastPost ? lastPost.id : null;

      if (isNewPostAdded && posts.length > 0) {
        if (prevLength === 0) {
          scrollToBottom(false);
        } else if (isGenuinelyNewPost) {
          scrollToBottom(true);
          setTimeout(() => scrollToBottom(true), 100);
        }
      } else if (posts.length > 0 && prevLength === 0) {
        scrollToBottom(false);
      }
    }
  }, [messages, posts, view, activeThread, scrollToBottom]);

  useEffect(() => {
    setUnreadCount(0);
    updateIsAtBottom(true);
    
    if (view === 'chat' || activeThread) {
      prevMessagesLengthRef.current = 0;
      prevLastMsgIdRef.current = null;
    } else if (view === 'feed') {
      prevPostsLengthRef.current = 0;
      prevLastPostIdRef.current = null;
    }
    
    scrollToBottom(false);
  }, [activeChat, view, activeThread, updateIsAtBottom, scrollToBottom]);

  return {
    scrollContainerRef,
    isAtBottom,
    unreadCount,
    setUnreadCount,
    scrollToBottom,
    handleScroll
  };
};
