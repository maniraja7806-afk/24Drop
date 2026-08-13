const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf8');

// 1. Add useLayoutEffect
if (!code.includes('useLayoutEffect')) {
  code = code.replace(/import React, { useState, useRef, useEffect, memo } from 'react';/, "import React, { useState, useRef, useEffect, useLayoutEffect, memo } from 'react';");
}

// 2. Add messageSent state and file/folder refs
if (!code.includes('messageSent')) {
  code = code.replace(
    /const textareaRef = useRef<HTMLTextAreaElement>\(null\);/,
    `const textareaRef = useRef<HTMLTextAreaElement>(null);\n  const fileInputRef = useRef<HTMLInputElement>(null);\n  const folderInputRef = useRef<HTMLInputElement>(null);\n  const [messageSent, setMessageSent] = useState(false);`
  );
}

// 3. Update handleSend to set messageSent(true)
code = code.replace(
  /if \(setReplyToMessage\) setReplyToMessage\(null\);\s*localStorage\.removeItem\(textStorageKey\);\s*localStorage\.removeItem\(storageKey\);\s*if \(textareaRef\.current\) {\s*textareaRef\.current\.style\.height = 'auto';\s*}/g,
  `if (setReplyToMessage) setReplyToMessage(null);
      localStorage.removeItem(textStorageKey);
      localStorage.removeItem(storageKey);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setMessageSent(true);`
);

// 4. Add useLayoutEffect for focus
if (!code.includes('useLayoutEffect(() => {') && !code.includes('if (messageSent)')) {
  code = code.replace(
    /const handleSend = async \(\) => {/,
    `useLayoutEffect(() => {
    if (messageSent) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        setMessageSent(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [messageSent]);\n\n  const handleSend = async () => {`
  );
}

// 5. Unmount bug fix for mobile folder upload
// Replace label elements inside the menu with buttons
code = code.replace(
  /<label className="w-full px-4 py-2.5 hover:bg-white\/5 flex items-center space-x-3 text-\[15px\] text-neutral-200 cursor-pointer transition-colors">[\s\S]*?<Upload className="w-4 h-4 text-neutral-400" \/>[\s\S]*?<span>Upload Files<\/span>[\s\S]*?<input[\s\S]*?className="hidden"[\s\S]*?\/>[\s\S]*?<\/label>/g,
  `<button 
    type="button" 
    onClick={() => { setIsMenuOpen(false); setTimeout(() => fileInputRef.current?.click(), 0); }}
    className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors"
  >
    <Upload className="w-4 h-4 text-neutral-400" />
    <span>Upload Files</span>
  </button>`
);

code = code.replace(
  /<label className="w-full px-4 py-2.5 hover:bg-white\/5 flex items-center space-x-3 text-\[15px\] text-neutral-200 cursor-pointer transition-colors">[\s\S]*?<FolderUp className="w-4 h-4 text-neutral-400" \/>[\s\S]*?<span>Upload Folder<\/span>[\s\S]*?<input[\s\S]*?className="hidden"[\s\S]*?\/>[\s\S]*?<\/label>/g,
  `<button 
    type="button" 
    onClick={() => { setIsMenuOpen(false); setTimeout(() => folderInputRef.current?.click(), 0); }}
    className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors"
  >
    <FolderUp className="w-4 h-4 text-neutral-400" />
    <span>Upload Folder</span>
  </button>`
);

// Move the hidden inputs to the bottom of the component
if (!code.includes('ref={fileInputRef}')) {
  code = code.replace(
    /<\/form>\s*<\/div>\s*\);\s*}\);/g,
    `</form>
      <input 
        type="file" 
        multiple 
        ref={fileInputRef}
        className="hidden" 
        onChange={(e) => { 
          if (e.target.files) handleAddFiles(e.target.files);
          if (e.target) e.target.value = '';
        }} 
      />
      <input 
        type="file" 
        multiple 
        ref={folderInputRef}
        {...({ webkitdirectory: "", directory: "" } as any)} 
        className="hidden" 
        onChange={(e) => { 
          if (e.target.files) handleAddFiles(e.target.files);
          if (e.target) e.target.value = '';
        }} 
      />
    </div>
  );
});`
  );
}

fs.writeFileSync('src/components/Composer.tsx', code);
