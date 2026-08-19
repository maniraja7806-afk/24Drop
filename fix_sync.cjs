const fs = require('fs');
const file = 'src/lib/api.ts';
let code = fs.readFileSync(file, 'utf8');

const syncFunction = `
export async function syncOfflineRequests() {
  const queue = getOfflineRequests();
  if (!queue.length) return;
  
  const currentQueue = [...queue];
  clearOfflineRequests();
  
  for (const req of currentQueue) {
    try {
      await fetchApi(req.endpoint, req.options);
    } catch (e: any) {
      if (e?.message?.includes('network connection') || e?.name === 'TypeError') {
        // Still offline, put it back
        addOfflineRequest(req);
      } else {
        // Request failed for other reasons (e.g. 400), drop it or log it
        console.error('Failed to sync offline request:', e);
      }
    }
  }
}
`;

if (!code.includes('syncOfflineRequests')) {
  code += '\\n' + syncFunction;
  fs.writeFileSync(file, code);
}
