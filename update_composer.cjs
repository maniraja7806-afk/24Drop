const fs = require('fs');
const file = 'src/components/Composer.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "await fetchApi('/api/posts', {",
  "return await fetchApi('/api/posts', {"
);

code = code.replace(
  "await fetchApi(`/api/messages/${activeChat}`, {",
  "return await fetchApi(`/api/messages/${activeChat}`, {"
);

fs.writeFileSync(file, code);
