const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Imports
code = code.replace(
  "import { AudioVisualizer } from './AudioVisualizer';",
  "import { AudioVisualizer } from './AudioVisualizer';\nimport { Composer } from './Composer';"
);

// Remove states
code = code.replace(/  const \[composerText, setComposerText\] = useState\(''\);\n/g, "");
code = code.replace(/  const \[isSending, setIsSending\] = useState\(false\);\n/g, "");
code = code.replace(/  const \[isMenuOpen, setIsMenuOpen\] = useState\(false\);\n/g, "");

// Remove textareaRef
code = code.replace(/  const textareaRef = useRef<HTMLTextAreaElement>\(null\);\n/g, "");

// Replace the handleDriveClick to handleComposerChange with empty
// Wait, I should just match the chunk and replace it.
const regex = /  const handleDriveClick = async \(\) => \{[\s\S]*?const handleComposerChange = \(e: React\.ChangeEvent<HTMLTextAreaElement>\) => \{[\s\S]*?    \}\n  \};\n/m;
code = code.replace(regex, "");

// Also remove deletePost and toggleReaction if they are between those?
// Oh, wait, deletePost and toggleReaction are right after handleSend.
// Let's not use regex like that, it's risky.

fs.writeFileSync('src/components/MainApp.tsx', code);
