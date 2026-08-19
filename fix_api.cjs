const fs = require('fs');
const file = 'src/lib/api.ts';
let code = fs.readFileSync(file, 'utf8');

code = `import { addOfflineRequest } from './offlineQueue';\n` + code;

code = code.replace(
  `    if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {\n      throw new Error('Unable to connect to server. Please check your network connection.');\n    }`,
  `    if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
      if (options.method === 'POST') {
        addOfflineRequest({ endpoint, options: { ...options, headers } });
        // Return a mock successful response for offline queued messages
        return { _queued: true };
      }
      throw new Error('Unable to connect to server. Please check your network connection.');
    }`
);

fs.writeFileSync(file, code);
