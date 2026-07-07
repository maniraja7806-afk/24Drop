const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const eventEffect = `  useEffect(() => {
    const handleEmojiClick = (e: any) => {
      const emoji = e.detail;
      if (isCustomizing) {
        setQuickEmojis(prev => {
          let newEmojis;
          if (prev.length < 6) {
            newEmojis = [...prev, emoji];
          } else {
            newEmojis = [...prev.slice(1), emoji];
          }
          localStorage.setItem('quickEmojis', JSON.stringify(newEmojis));
          return newEmojis;
        });
      } else {
        if (activeReactionMsgFull) {
          toggleReaction(activeReactionMsgFull, emoji);
          setActiveReactionMsgFull(null);
        }
      }
    };
    window.addEventListener('emoji_picker_click', handleEmojiClick);
    return () => window.removeEventListener('emoji_picker_click', handleEmojiClick);
  }, [isCustomizing, activeReactionMsgFull]);`;

code = code.replace("useEffect(() => {\n    initAuth();", eventEffect + "\n\n  useEffect(() => {\n    initAuth();");
fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched event listener.");
