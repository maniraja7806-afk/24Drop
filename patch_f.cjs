const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf-8');
code = code.replace(/Array\.from\(e\.target\.files as any\)\.map\(f => \{/g, 'Array.from(e.target.files as any).map((f: any) => {');
fs.writeFileSync('src/components/Composer.tsx', code);
