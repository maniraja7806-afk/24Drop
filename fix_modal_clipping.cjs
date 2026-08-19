const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix modal container: remove h-[65vh] and min-h-[450px], replace with h-[380px] max-h-full
code = code.replace(
  /className="bg-neutral-900 border border-white\/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col[^"]*"/,
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-[380px] max-h-full"'
);

// 2. Fix wrapper: ensure we don't clip by using overflow-hidden safely, or just rely on max-h-full in the modal
// Actually, if the wrapper is `flex flex-col items-center justify-center p-4`, then `max-h-full` on the child will resolve to 100% of the wrapper's padded height.
// The wrapper is currently: `className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overscroll-none"`
// Let's keep wrapper as is, `max-h-full` on the modal will bound it to the available space minus padding.

fs.writeFileSync(file, code);
