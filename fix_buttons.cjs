const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace(
  /<button\s+aria-label="Delete post"[\s\S]*?<Trash2 className="w-3\.5 h-3\.5" \/>\s*<\/button>/g,
  `{post.username === session?.username && (
$&
)}`
);

code = code.replace(
  /<button\s+aria-label="Edit post"[\s\S]*?<Edit2 className="w-3\.5 h-3\.5" \/>\s*<span>Edit<\/span>\s*<\/button>/g,
  `{post.username === session?.username && (
$&
)}`
);

code = code.replace(
  /<button\s+aria-label="Delete message"[\s\S]*?<Trash2 className="w-3\.5 h-3\.5" \/>\s*<\/button>/g,
  `{isMe && (
$&
)}`
);

code = code.replace(
  /<button\s+aria-label="Edit message"[\s\S]*?<Edit2 className="w-3\.5 h-3\.5" \/>\s*<span>Edit<\/span>\s*<\/button>/g,
  `{isMe && (
$&
)}`
);

fs.writeFileSync('src/components/MainApp.tsx', code);
