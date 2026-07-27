const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/fileUrl = \(result as any\)\.secure_url;\n\s+fs\.unlinkSync\(file\.path\);/g, 
  "fileUrl = (result as any).secure_url;\n        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);");

fs.writeFileSync('server.ts', code);
