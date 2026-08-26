const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Remove the hook call
const hookRegex = /useChatSocket\(\{[\s\S]*?scrollToBottom\s*\}\);/;
code = code.replace(hookRegex, "");

// Re-inject it right after `setIsPreviewLoading` or something similar, at the end of the state declarations.
const insertPoint = /const \[isPreviewLoading, setIsPreviewLoading\] = useState\(true\);/;
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

code = code.replace(insertPoint, `const [isPreviewLoading, setIsPreviewLoading] = useState(true);\n${hookCallStr}`);

fs.writeFileSync('src/components/MainApp.tsx', code);
