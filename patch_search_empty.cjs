const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldSearch = `{searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden z-50">
                {searchResults.map(res => (
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
              </div>
            )}`;

const newSearch = `{(searchResults.length > 0 || searchQuery.length > 2) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  searchResults.map(res => (
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
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-neutral-400 flex flex-col items-center justify-center bg-neutral-800">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-neutral-500" />
                    </div>
                    <p className="text-sm font-medium text-neutral-300">No users found</p>
                    <p className="text-xs text-neutral-500 mt-1">Try a different username</p>
                  </div>
                )}
              </div>
            )}`;

code = code.replace(oldSearch, newSearch);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched search empty state");
