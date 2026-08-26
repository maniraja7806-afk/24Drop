const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Strip Block 3 (Posts)
const postsRegex = /useEffect\(\(\) => \{\s*fetchApi\("\/api\/posts"\)[\s\S]*?socket\.off\("post_reaction"\);\s*\};\s*\}, \[\]\);/;
code = code.replace(postsRegex, "");

// Strip Block 4 (Messages)
const messagesRegex = /useEffect\(\(\) => \{\s*if \(\!activeChat\) return;\s*const loadMessages[\s\S]*?socket\.off\("delete_message", handleDeleteMessage\);\s*\};\s*\}, \[activeChat\]\);/;
code = code.replace(messagesRegex, "");

// Strip Block 5 (Typing)
const typingRegex = /useEffect\(\(\) => \{\s*const handleTyping = \(\{ from, avatar, color \}: any\) => \{[\s\S]*?socket\.off\("stop_typing", handleStopTyping\);\s*\};\s*\}, \[view, activeChat\]\);/;
code = code.replace(typingRegex, "");

// Inject the custom hook call inside MainApp just below the state declarations
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

// we can insert it right after the `useEffect(() => { fetchChats(); }, []);`
// Let's find `useEffect(() => {\n    fetchChats();\n  }, []);`
code = code.replace(/useEffect\(\(\) => \{\s*fetchChats\(\);\s*\}, \[\]\);/, 
  `useEffect(() => {\n    fetchChats();\n  }, []);\n\n${hookCallStr}`);

fs.writeFileSync('src/components/MainApp.tsx', code);
