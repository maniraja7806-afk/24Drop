const fs = require('fs');
let content = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    setUnreadCount(0);
    updateIsAtBottom(true);
    prevMessagesLengthRef.current = 0;
    scrollToBottom(false);
  }, [activeChat]);`;

const newEffect = `  useEffect(() => {
    setUnreadCount(0);
    updateIsAtBottom(true);
    if (view === 'chat' || activeThread) {
      prevMessagesLengthRef.current = 0;
    } else if (view === 'feed') {
      prevPostsLengthRef.current = 0;
    }
    scrollToBottom(false);
  }, [activeChat, view, activeThread]);`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/MainApp.tsx', content);
console.log('Fixed view change effect');
