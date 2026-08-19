const fs = require('fs');
const file = 'src/components/Composer.tsx';
let code = fs.readFileSync(file, 'utf8');

// Undo the specific replacement
code = code.replace(
  "const res = await sendRequest({ content: composerText.trim(), parentId: effectiveParentId }); if (res?._queued) setToastMessage('Message queued (offline). Will send when reconnected.');",
  "await sendRequest({ content: composerText.trim(), parentId: effectiveParentId });"
);

// Add the toast to sendRequest itself
code = code.replace(
  "      const sendRequest = async (payload: any) => {\n        if (view === 'feed') {\n          return await fetchApi('/api/posts', {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify(payload)\n          });\n        } else if (view === 'chat' && activeChat) {\n          return await fetchApi(`/api/messages/${activeChat}`, {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify(payload)\n          });\n        }\n      };",
  `      const sendRequest = async (payload: any) => {
        let res;
        if (view === 'feed') {
          res = await fetchApi('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else if (view === 'chat' && activeChat) {
          res = await fetchApi(\`/api/messages/\${activeChat}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
        if (res?._queued) {
          setToastMessage('Message queued (offline). Will send when reconnected.');
        }
        return res;
      };`
);

fs.writeFileSync(file, code);
