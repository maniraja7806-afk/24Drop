const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// The fixed inset-0 wrapper needs py-4 so the modal doesn't touch the top/bottom edges of the screen
code = code.replace(
  'className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overflow-hidden"',
  'className="fixed inset-0 z-[60] flex flex-col items-center justify-center py-4 px-4 sm:p-8 bg-black/60 backdrop-blur-sm overflow-hidden"'
);

// The modal itself needs max-h-full so it doesn't overflow its parent if flex-1 makes it too big, 
// and flex: 1 1 auto to let it grow up to max-height, and min-h-0 so its children can scroll.
code = code.replace(
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0"',
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-[1_1_auto] min-h-0 max-h-full"'
);

// Ensure the file list expands properly
code = code.replace(
  'className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"',
  'className="flex-[1_1_auto] min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"'
);

fs.writeFileSync(file, code);
