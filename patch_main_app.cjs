const fs = require('fs');
const file = 'src/components/MainApp.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('syncOfflineRequests')) {
  // Add import
  code = code.replace(
    "import { fetchApi } from '../lib/api';",
    "import { fetchApi, syncOfflineRequests } from '../lib/api';"
  );
  
  // Add sync call
  code = code.replace(
    "const onConnect = () => socket.emit('join', session.username);",
    "const onConnect = () => { socket.emit('join', session.username); syncOfflineRequests(); };"
  );
  
  fs.writeFileSync(file, code);
}
