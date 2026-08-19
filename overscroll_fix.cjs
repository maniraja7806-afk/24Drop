const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add overscroll-contain to the file list container
code = code.replace(
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"',
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-2 pb-4 space-y-1 custom-scrollbar"'
);

// We should also make sure the body scroll lock works on iOS by adding position fixed / width 100% logic or touch-action: none to overlay
// Let's add overscroll-none touch-none to the overlay container just in case
code = code.replace(
  'className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm"',
  'className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overscroll-none"'
);

fs.writeFileSync(file, code);
