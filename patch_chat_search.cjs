const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const stateInsert = `  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');`;

code = code.replace(`  const [searchQuery, setSearchQuery] = useState('');`, stateInsert);

const oldHeader = `        <header className="h-16 flex items-center px-4 md:px-6 border-b border-white/10 flex-shrink-0 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
          {view === 'chat' && (
            <button 
              onClick={() => setView('feed')}
              className="md:hidden mr-3 p-2 hover:bg-white/10 text-neutral-400 hover:text-white rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-semibold">
            {view === 'feed' ? 'Public Feed' : \`Chat with \${activeChat}\`}
          </h2>
        </header>`;

const newHeader = `        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/10 flex-shrink-0 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center">
            {view === 'chat' && (
              <button 
                onClick={() => setView('feed')}
                className="md:hidden mr-3 p-2 hover:bg-white/10 text-neutral-400 hover:text-white rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {view === 'feed' ? 'Public Feed' : \`Chat with \${activeChat}\`}
            </h2>
          </div>
          
          {view === 'chat' && (
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-3 top-2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
              />
            </div>
          )}
        </header>`;

code = code.replace(oldHeader, newHeader);

const oldMessagesMap = `{messages.map((msg) => {`;

const newMessagesMap = `{messages.filter(msg => msg.content?.toLowerCase().includes(chatSearchQuery.toLowerCase()) || msg.fileName?.toLowerCase().includes(chatSearchQuery.toLowerCase())).map((msg) => {`;

code = code.replace(oldMessagesMap, newMessagesMap);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched chat search!");
