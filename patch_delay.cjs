const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/if \(fs\.existsSync\(file\.path\)\) fs\.unlinkSync\(file\.path\);/g, 
  "setTimeout(() => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }, 10000);");

fs.writeFileSync('server.ts', code);
