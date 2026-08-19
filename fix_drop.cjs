const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf8');

const replacement = `      onDrop={async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!e.dataTransfer.items) {
          if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
          return;
        }

        const items = Array.from(e.dataTransfer.items).filter(item => item.kind === 'file');
        const files = [];

        const readEntry = async (entry, path = '') => {
          if (entry.isFile) {
            const file = await new Promise((resolve) => entry.file(resolve));
            // Polyfill webkitRelativePath for dropped files
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path + file.name,
              writable: false
            });
            files.push(file);
          } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries = await new Promise((resolve) => {
              reader.readEntries(resolve);
            });
            for (const child of entries) {
              await readEntry(child, path + entry.name + '/');
            }
          }
        };

        for (const item of items) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await readEntry(entry);
          }
        }

        if (files.length > 0) {
          handleAddFiles(files);
        }
      }}`;

code = code.replace(/onDrop=\{\(e\) => \{\s*e\.preventDefault\(\);\s*setIsDragOver\(false\);\s*if \(e\.dataTransfer\.files\) handleAddFiles\(e\.dataTransfer\.files\);\s*\}\}/, replacement);
fs.writeFileSync('src/components/Composer.tsx', code);
