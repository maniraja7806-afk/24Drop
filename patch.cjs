const fs = require('fs');
let file = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

file = file.replace(
`          }}
        >
          {view === 'global_search' ? (
            <div className="flex flex-col space-y-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-white">Search Results</h3>`,
`          }}
        >
          <AnimatePresence mode="wait">
          {view === 'global_search' ? (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col space-y-6 max-w-2xl mx-auto w-full">
              <h3 className="text-lg font-medium text-white">Search Results</h3>`
);

file = file.replace(
`                <div className="text-neutral-500 text-center py-8">No results found for "{globalSearchQuery}"</div>
              )}
            </div>
          ) : view === 'feed' ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              {posts.map((post) => (
                <DissolvingItem `,
`                <div className="text-neutral-500 text-center py-8">No results found for "{globalSearchQuery}"</div>
              )}
            </motion.div>
          ) : view === 'feed' ? (
            <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-2xl mx-auto w-full">
              {posts.map((post) => (
                <DissolvingItem `
);

file = file.replace(
`              ))}
              {posts.length === 0 && (
                <div className="text-center text-neutral-500 py-12">No posts yet. Be the first to share!</div>
              )}
            </div>
          ) : (
            <div className="flex flex-col space-y-4 max-w-3xl mx-auto">
              {(() => {
                const displayedMessages = activeThread
                  ? [activeThread, ...messages.filter((m: any) => m.parentId === activeThread.id)]`,
`              ))}
              {posts.length === 0 && (
                <div className="text-center text-neutral-500 py-12">No posts yet. Be the first to share!</div>
              )}
            </motion.div>
          ) : (
            <motion.div key={activeThread ? \`thread-\${activeThread.id}\` : \`chat-\${activeChat}\`} initial={{ opacity: 0, x: activeThread ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: activeThread ? -20 : 20 }} transition={{ duration: 0.2 }} className="flex flex-col space-y-4 max-w-3xl mx-auto w-full">
              {(() => {
                const displayedMessages = activeThread
                  ? [activeThread, ...messages.filter((m: any) => m.parentId === activeThread.id)]`
);

file = file.replace(
`              });
              })()}
              <div ref={messagesEndRef} />
            </div>
          )}
        </PullToRefresh>
        {/* Composer Footer */}
        {view !== 'global_search' && (`,
`              });
              })()}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
          </AnimatePresence>
        </PullToRefresh>
        {/* Composer Footer */}
        {view !== 'global_search' && (`
);

fs.writeFileSync('src/components/MainApp.tsx', file);
