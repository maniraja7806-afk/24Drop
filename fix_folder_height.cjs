const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// The wrapper currently uses: h-full
// It should probably just be max-h-full or h-full depending on the container
// Let's replace: className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-full shrink min-h-0"
// With: className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-1 shrink min-h-0"
// Actually flex-1 on the modal div helps it expand correctly inside the fixed inset flex container if it needs to.

code = code.replace(
  /className="bg-neutral-900 border border-white\/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-full shrink min-h-0"/g,
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0"'
);

// We need to make sure the file list container really expands
// It is currently: className="flex-1 min-h-0 overflow-y-auto p-2 pb-4 space-y-1 custom-scrollbar"
// Add overflow-x-hidden
code = code.replace(
  /className="flex-1 min-h-0 overflow-y-auto p-2 pb-4 space-y-1 custom-scrollbar"/g,
  'className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"'
);

fs.writeFileSync(file, code);
