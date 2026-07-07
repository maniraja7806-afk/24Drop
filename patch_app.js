const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Import EmojiPicker
if (!code.includes('import EmojiPicker')) {
  code = code.replace("import { AudioVisualizer } from './AudioVisualizer';", "import { AudioVisualizer } from './AudioVisualizer';\nimport EmojiPicker, { Theme } from 'emoji-picker-react';");
}

// Add state
const stateToAdd = `
  const [activeReactionMsg, setActiveReactionMsg] = useState<string | null>(null);
  const [quickEmojis, setQuickEmojis] = useState<string[]>(() => {
    const saved = localStorage.getItem('quickEmojis');
    return saved ? JSON.parse(saved) : ['👍', '❤️', '😂', '😮', '😢', '🔥'];
  });
  const [isCustomizingEmojis, setIsCustomizingEmojis] = useState(false);
`;

if (!code.includes('activeReactionMsg')) {
  code = code.replace("const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);", "const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);\n" + stateToAdd);
}

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched imports and state.");
