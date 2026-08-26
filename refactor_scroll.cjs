const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Insert import if not exists
if (!code.includes("import { useChatScroll }")) {
  code = code.replace("import React,", "import { useChatScroll } from '../hooks/useChatScroll';\nimport React,");
}

const startString = "  const scrollContainerRef = useRef<HTMLDivElement>(null);";
const endString = "  }, [activeChat, view, activeThread]);";

const startIndex = code.indexOf(startString);
let tempStr = code.substring(startIndex);
const endIndex = startIndex + tempStr.indexOf(endString) + endString.length;

if (startIndex !== -1 && tempStr.indexOf(endString) !== -1) {
  const hookUsage = `  const {
    scrollContainerRef,
    isAtBottom,
    unreadCount,
    setUnreadCount,
    scrollToBottom,
    handleScroll
  } = useChatScroll({
    messages,
    posts,
    view,
    activeChat,
    activeThread,
    onScrollAction: () => setActiveMenuMsg(null)
  });`;
  
  code = code.substring(0, startIndex) + hookUsage + code.substring(endIndex);
  fs.writeFileSync('src/components/MainApp.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find bounds.");
}
