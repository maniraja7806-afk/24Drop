const fs = require('fs');
const file = 'src/lib/api.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { addOfflineRequest } from './offlineQueue';",
  "import { addOfflineRequest, getOfflineRequests, clearOfflineRequests } from './offlineQueue';"
);

fs.writeFileSync(file, code);
