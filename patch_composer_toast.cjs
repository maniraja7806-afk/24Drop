const fs = require('fs');
const file = 'src/components/Composer.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('queued: true')) {
  code = code.replace(
    "await sendRequest({ content: composerText.trim(), parentId: effectiveParentId });",
    "const res = await sendRequest({ content: composerText.trim(), parentId: effectiveParentId }); if (res?._queued) setToastMessage('Message queued (offline). Will send when reconnected.');"
  );
  fs.writeFileSync(file, code);
}
