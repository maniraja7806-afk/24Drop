const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Parent wrapper: remove overflow-hidden just in case
code = code.replace(
  'className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overflow-hidden"',
  'className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm"'
);

// 2. The Modal (motion.div)
// Instead of flex-1, let's explicitly give it a height so it's guaranteed to not collapse:
// h-[85vh] ensures it takes up 85vh. Or w-full max-w-lg flex flex-col h-[85vh] sm:h-[90vh] 
// Let's use `h-full max-h-[85vh] sm:max-h-[90vh]` so it takes the full space available but bounded.
// Let's remove flex-1 from it. 
code = code.replace(
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0 max-h-[85vh] sm:max-h-[90vh]"',
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col h-full max-h-[85vh] sm:max-h-[90vh]"'
);

// We need to keep overflow-hidden on the modal if we want rounded corners, but the user said "do not have overflow: hidden".
// So let's remove overflow-hidden from motion.div.

// 3. The File List Container
// The user asks for: display: flex; flex-direction: column; flex: 1; min-height: 0; overflow-y: auto;
// Current: className="flex flex-col flex-1 min-h-0 overflow-y-auto p-2 pb-4 space-y-1 custom-scrollbar"
// Let's ensure it matches perfectly. 
code = code.replace(
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto p-2 pb-4 space-y-1 custom-scrollbar"',
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"'
);

fs.writeFileSync(file, code);
