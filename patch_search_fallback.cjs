const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldSearch = `{searchResults.map(res => (
                  <button 
                    key={res.username}
                    onClick={() => openChat(res.username)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center space-x-3 transition-colors"
                  >
                    <div className={clsx("w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-sm", res.color)}>
                      {res.avatar}
                    </div>
                    <span>{res.username}</span>
                  </button>
                ))}`;

const newSearch = `{searchResults.map(res => (
                  <button 
                    key={res.username}
                    onClick={() => openChat(res.username)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center space-x-3 transition-colors"
                  >
                    <div className={clsx("w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-sm", res.color)}>
                      {res.avatar}
                    </div>
                    <span>{res.username}</span>
                  </button>
                ))}
                {searchQuery.length > 2 && !searchResults.some(r => r.username.toLowerCase() === searchQuery.toLowerCase()) && (
                  <button 
                    onClick={() => openChat(searchQuery.trim())}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center space-x-3 transition-colors text-neutral-300"
                  >
                    <div className="w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-sm bg-neutral-700">
                      💬
                    </div>
                    <span>Chat with <strong>{searchQuery}</strong></span>
                  </button>
                )}`;

code = code.replace(oldSearch, newSearch);

// Also need to make sure the dropdown shows if searchQuery.length > 2, even if searchResults is empty!
const oldCond = `{searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden z-50">`;

const newCond = `{(searchResults.length > 0 || searchQuery.length > 2) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden z-[100] shadow-2xl">`;

code = code.replace(oldCond, newCond);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched search fallback");
