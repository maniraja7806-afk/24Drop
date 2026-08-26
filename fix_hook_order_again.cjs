const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Remove the hook call
const hookRegex = /useChatSocket\(\{[\s\S]*?scrollToBottom\s*\}\);/;
code = code.replace(hookRegex, "");

// find useChatScroll end:
//     activeThread,
//     onScrollAction: () => setActiveMenuMsg(null)
//   });
// Re-inject it right after this.

const insertPoint = /onScrollAction: \(\) => setActiveMenuMsg\(null\)\s*\}\);/;
const hookCallStr = `
  useChatSocket({
    session,
    activeChat,
    view,
    setPosts,
    setMessages,
    setTypingUsers,
    setToastMessage,
    setStorageUsage,
    fetchChats,
    scrollToBottom
  });
`;

code = code.replace(insertPoint, match => match + "\n" + hookCallStr);

fs.writeFileSync('src/components/MainApp.tsx', code);
