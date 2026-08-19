const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// The modal container: make sure it has h-full or similar if needed, or just flex-col
// The user asks to ensure parent containers do not have height: 0 or overflow: hidden (except for modal bounds)
// The modal has overflow-hidden, which is fine for the modal box itself to clip rounded corners.
// Let's just update the file list container exactly as requested.
code = code.replace(
  'className="flex-auto overflow-y-auto overflow-x-hidden min-h-0 p-2 pb-4 space-y-1 custom-scrollbar"',
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"'
);

// We should also make the modal parent explicitly flex-1 or h-full so it takes the height required for flex-1 on the child to work correctly if it's currently collapsing.
code = code.replace(
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"',
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0 max-h-[85vh] sm:max-h-[90vh]"'
);


fs.writeFileSync(file, code);
