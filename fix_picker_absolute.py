import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# Replace both instances of EmojiPicker wrappers
old_wrapper_picker = """          <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
            <EmojiPicker
              theme={Theme.DARK}
              onEmojiClick={(e) => handlePick(e.emoji)}
              width="100%"
              height="100%"
              style={{ flex: 1, width: "100%", height: "100%", "--epr-bg-color": "transparent", border: "none" } as any}
            />
          </div>"""

new_wrapper_picker = """          <div className="flex-1 w-full relative min-h-0">
            <div className="absolute inset-0">
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={(e) => handlePick(e.emoji)}
                width="100%"
                height="100%"
                style={{ '--epr-bg-color': 'transparent', border: 'none' } as any}
              />
            </div>
          </div>"""

old_wrapper_customize = """          <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
            <EmojiPicker
              theme={Theme.DARK}
              onEmojiClick={(e) => handleAddEdit(e.emoji)}
              width="100%"
              height="100%"
              style={{ flex: 1, width: "100%", height: "100%", "--epr-bg-color": "transparent", border: "none" } as any}
            />
          </div>"""

new_wrapper_customize = """          <div className="flex-1 w-full relative min-h-0">
            <div className="absolute inset-0">
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={(e) => handleAddEdit(e.emoji)}
                width="100%"
                height="100%"
                style={{ '--epr-bg-color': 'transparent', border: 'none' } as any}
              />
            </div>
          </div>"""

content = content.replace(old_wrapper_picker, new_wrapper_picker)
content = content.replace(old_wrapper_customize, new_wrapper_customize)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
