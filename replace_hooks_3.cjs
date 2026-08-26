const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s*fetchApi\('\/api\/storage\/usage'\)[\s\S]*?clearInterval\(interval\);\s*\};\s*\}, \[\]\);/;
code = code.replace(regex, "");

fs.writeFileSync('src/components/MainApp.tsx', code);
