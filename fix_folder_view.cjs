const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add useEffect to imports
code = code.replace(
  "import React, { useState, useMemo } from 'react';",
  "import React, { useState, useMemo, useEffect } from 'react';"
);

// 2. Add composerHeight logic
const hookInsert = `
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [composerHeight, setComposerHeight] = useState(0);

  useEffect(() => {
    if (!isModalOpen) return;
    const el = document.getElementById('chat-composer');
    if (!el) {
      setComposerHeight(0);
      return;
    }
    const observer = new ResizeObserver(entries => {
      for (let e of entries) {
        setComposerHeight(e.target.getBoundingClientRect().height);
      }
    });
    observer.observe(el);
    setComposerHeight(el.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, [isModalOpen]);
`;

code = code.replace(
  "  const [isModalOpen, setIsModalOpen] = useState(false);\n  const [searchQuery, setSearchQuery] = useState('');",
  hookInsert.trim()
);

// 3. Update paddingBottom on the wrapper
code = code.replace(
  `className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overflow-hidden"`,
  `className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overflow-hidden"\n            style={{ paddingBottom: composerHeight ? \`\${composerHeight + 16}px\` : undefined }}`
);

// 4. Update row padding
code = code.replaceAll(
  `className="group flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"`,
  `className="group flex items-center justify-between py-3 px-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer min-h-[56px]"`
);

// 5. Ensure file list wrapper takes all space.
// It's already: className="flex-1 min-h-0 overflow-y-auto p-2 pb-4 space-y-1 custom-scrollbar"
// Let's change the motion.div to h-full if they want it to take all space, or max-h-[100%] so it expands up to the max space.
// The user said: "The preview modal should expand to use the available viewport height, while still respecting the fixed message composer at the bottom"
// max-h-[100%] already does exactly that when the list is long. When it's short, it doesn't leave an empty gap at the bottom of the modal, which is good.
// But they said "occupy all available space... so the files are displayed completely and the last visible file ends just above the input box". 
// To make it unconditionally full height, we can change max-h-[100%] to h-full. 
// "do not let the modal itself or the page scroll—only the file list should scroll"
// "do not keep the list constrained to a tiny area"
// Let's change it to h-full to be absolutely sure it takes all available space!
code = code.replace(
  `className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[100%] shrink min-h-0"`,
  `className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-full shrink min-h-0"`
);

fs.writeFileSync(file, code);
