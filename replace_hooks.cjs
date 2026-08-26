const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

if (!code.includes("import { useChatSocket }")) {
  code = code.replace("import { useChatScroll }", "import { useChatScroll }\nimport { useChatSocket } from '../hooks/useChatSocket';");
}

// Strip Block 1 (Global New Message)
code = code.replace(/useEffect\(\(\) => \{\s*const handleGlobalNewMessage = \(msg: any\) => \{\s*fetchChats\(\);\s*\};\s*socket\.on\("new_message", handleGlobalNewMessage\);\s*return \(\) => \{\s*socket\.off\("new_message", handleGlobalNewMessage\);\s*\};\s*\}, \[\]\);/, "");

// Strip Block 2 (Storage)
code = code.replace(/useEffect\(\(\) => \{\s*fetchApi\('\/api\/storage\/usage'\)\.then\(setStorageUsage\)\.catch\(\(\) => \{\}\);\s*const handleStorageUpdated = \(data: any\) => \{\s*if \(data\) \{\s*setStorageUsage\(data\);\s*\}\s*\};\s*socket\.on\('storage_updated', handleStorageUpdated\);\s*const interval = setInterval\(\(\) => \{\s*fetchApi\('\/api\/storage\/usage'\)\.then\(setStorageUsage\)\.catch\(\(\) => \{\}\);\s*\}, 30000\);\s*\/\*.*\*\/\s*return \(\) => \{\s*socket\.off\('storage_updated', handleStorageUpdated\);\s*clearInterval\(interval\);\s*\};\s*\}, \[\]\);/s, "");

fs.writeFileSync('src/components/MainApp.tsx', code);
