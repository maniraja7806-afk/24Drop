const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const helper = `const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const parts = text.split(new RegExp(\`(\${query.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&')})\`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-500/40 text-inherit rounded-sm px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export function MainApp`;

code = code.replace('export function MainApp', helper);

const oldContent = `{msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}`;
const newContent = `{msg.content && <div className="whitespace-pre-wrap">{highlightText(msg.content, chatSearchQuery)}</div>}`;

code = code.replace(oldContent, newContent);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched highlight text");
