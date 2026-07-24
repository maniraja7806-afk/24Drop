const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf-8');

code = code.replace(/Array\.from\(e\.target\.files\)\.map/g, 'Array.from(e.target.files as any).map');

fs.writeFileSync('src/components/Composer.tsx', code);
