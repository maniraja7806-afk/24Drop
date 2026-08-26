const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace(
  /const handleStopTyping = \(\{ from \}: any\) => \{\s*setTypingUsers\(\(prev\) => prev\.filter\(\(u\) => u\.username !== from\)\);\s*\};/g,
  `const handleStopTyping = ({ from }: any) => {
      setTypingUsers((prev) => {
        if (!prev.some((u) => u.username === from)) return prev;
        return prev.filter((u) => u.username !== from);
      });
    };`
);

fs.writeFileSync('src/components/MainApp.tsx', code);
