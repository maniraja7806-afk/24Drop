const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const replacement = `      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(file.path, { resource_type: "auto", chunk_size: 20000000 }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });
        fileUrl = result.secure_url;
        fs.unlinkSync(file.path);
      } catch (err: any) {`;

code = code.replace(/      try \{\n        const result = await cloudinary\.uploader\.upload_large\(file\.path, \{ resource_type: "auto", chunk_size: 20000000 \}\);\n        fileUrl = result\.secure_url;\n        fs\.unlinkSync\(file\.path\);\n      \} catch \(err: any\) \{/g, replacement);

fs.writeFileSync('server.ts', code);
