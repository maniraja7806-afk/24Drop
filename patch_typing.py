import re

with open('src/components/MainApp.tsx', 'r') as f:
    content = f.read()

# Remove old typing indicator from header
old_typing_in_header = """              {view === 'chat' && typingUsers.length > 0 && (
                <span className="text-xs sm:text-[13px] text-blue-400 font-medium animate-pulse mt-0.5 truncate">
                  {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              )}
            </div>"""
new_header_end = "            </div>"
content = content.replace(old_typing_in_header, new_header_end)

# Add new typing indicator below header
old_header_close = "        </header>\n\n        {/* Pinned Messages Banner */}"
new_typing_ui = """        </header>
        
        {view === 'chat' && typingUsers.length > 0 && (
          <div className="bg-neutral-800/80 border-b border-white/5 px-4 py-1.5 flex items-center space-x-2 shadow-sm z-10 shrink-0">
            <div className="flex -space-x-1">
              {typingUsers.slice(0, 3).map((u, i) => (
                <div key={i} className="w-4 h-4 rounded-full border border-neutral-900 bg-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] font-medium text-white">{u.username.charAt(0).toUpperCase()}</span>
                  )}
                  {u.color && (
                     <div className="absolute inset-0 opacity-20" style={{ backgroundColor: u.color }}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-neutral-400 ml-1">
              {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        {/* Pinned Messages Banner */}"""
content = content.replace(old_header_close, new_typing_ui)

with open('src/components/MainApp.tsx', 'w') as f:
    f.write(content)
