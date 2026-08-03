const fs = require('fs');
let content = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const target = `
                            <textarea
                              value={editMessageContent}
                              onChange={(e) => setEditMessageContent(e.target.value)}
                              className={clsx(
`;

const replacement = `
                            <textarea
                              value={editMessageContent}
                              onChange={(e) => setEditMessageContent(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e) => e.stopPropagation()}
                              className={clsx(
`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/MainApp.tsx', content);
  console.log('Successfully replaced textarea.');
} else {
  console.log('Target not found in file.');
}
