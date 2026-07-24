const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf-8');

code = code.replace(/disabled=\{isSending \|\| \(!composerText\.trim\(\) && !file && !driveFile\)\}/g, 'disabled={isSending || (!composerText.trim() && attachments.length === 0 && !driveFile)}');
code = code.replace(/composerText\.trim\(\) \|\| file \|\| driveFile/g, 'composerText.trim() || attachments.length > 0 || driveFile');

fs.writeFileSync('src/components/Composer.tsx', code);
