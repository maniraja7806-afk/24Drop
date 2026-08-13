const fs = require('fs');
let content = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// 1. Add prevPostsLengthRef
content = content.replace(
  /const prevMessagesLengthRef = useRef\(0\);/,
  `const prevMessagesLengthRef = useRef(0);\n  const prevPostsLengthRef = useRef(0);`
);

// 2. Fix the WhatsApp-like Smart Auto-scroll useEffect
const oldUseEffect = `  // WhatsApp-like Smart Auto-scroll
  useEffect(() => {
    if (view === 'chat' || activeThread) {
      const isNewMsgAdded = messages.length > prevMessagesLengthRef.current;
      const prevLength = prevMessagesLengthRef.current;
      prevMessagesLengthRef.current = messages.length;

      if (isNewMsgAdded && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const isSentByMe = lastMsg && lastMsg.senderUsername === session.username;

        if (isSentByMe || isAtBottomRef.current) {
          scrollToBottom(true);
        } else {
          setUnreadCount(prev => prev + 1);
        }
      } else if (messages.length > 0 && prevLength === 0) {
        // Initial chat load
        scrollToBottom(false);
      }
    }
  }, [messages, view, activeThread]);`;

const newUseEffect = `  // WhatsApp-like Smart Auto-scroll (Global Sync Fix)
  useEffect(() => {
    if (view === 'chat' || activeThread) {
      const isNewMsgAdded = messages.length > prevMessagesLengthRef.current;
      const prevLength = prevMessagesLengthRef.current;
      prevMessagesLengthRef.current = messages.length;

      if (isNewMsgAdded && messages.length > 0) {
        const container = scrollContainerRef.current;
        // Relax the bottom threshold to ensure slight bounces don't break receiver auto-scroll
        const isNearBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 300) : true;
        
        // Preserve historical reading protection, but ensure ANY new message scrolls receivers near bottom
        if (isNearBottom || isAtBottomRef.current) {
          scrollToBottom(true);
          // Fallback for image loading layout shifts
          setTimeout(() => scrollToBottom(true), 100);
        } else {
          setUnreadCount(prev => prev + 1);
        }
      } else if (messages.length > 0 && prevLength === 0) {
        // Initial chat load
        scrollToBottom(false);
      }
    } else if (view === 'feed') {
      const isNewPostAdded = posts.length > prevPostsLengthRef.current;
      const prevLength = prevPostsLengthRef.current;
      prevPostsLengthRef.current = posts.length;

      if (isNewPostAdded && posts.length > 0) {
        const container = scrollContainerRef.current;
        const isNearBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 300) : true;
        
        if (isNearBottom || isAtBottomRef.current) {
          scrollToBottom(true);
          setTimeout(() => scrollToBottom(true), 100);
        }
      } else if (posts.length > 0 && prevLength === 0) {
        scrollToBottom(false);
      }
    }
  }, [messages, posts, view, activeThread]);`;

content = content.replace(oldUseEffect, newUseEffect);

fs.writeFileSync('src/components/MainApp.tsx', content);
console.log('Fixed auto-scroll in MainApp.tsx');
