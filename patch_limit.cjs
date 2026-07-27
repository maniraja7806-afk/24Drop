const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf-8');

code = code.replace(/25 \* 1024 \* 1024 \* 1024/g, "30 * 1024 * 1024");
code = code.replace(/exceed 25GB/g, "exceed 30MB");

fs.writeFileSync('src/components/Composer.tsx', code);
