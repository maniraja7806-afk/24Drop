import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# Instead of relying on `flex: 1` getting evaluated inside EmojiPicker, let's just make the EmojiPicker its own flex-1 item without the wrapper.
old_picker = """          <div className="flex-1 w-full min-h-0 flex flex-col">
            <EmojiPicker
              theme={Theme.DARK}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handlePick(e.emoji)}
              style={{ flex: 1, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />
          </div>"""

new_picker = """          <div className="flex-1 w-full min-h-0 overflow-hidden relative">
            <EmojiPicker
              theme={Theme.DARK}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handlePick(e.emoji)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />
          </div>"""

old_customize = """          <div className="flex-1 w-full min-h-0 flex flex-col">
            <EmojiPicker
              theme={Theme.DARK}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handleAddEdit(e.emoji)}
              style={{ flex: 1, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />
          </div>"""

new_customize = """          <div className="flex-1 w-full min-h-0 overflow-hidden relative">
            <EmojiPicker
              theme={Theme.DARK}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handleAddEdit(e.emoji)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />
          </div>"""

content = content.replace(old_picker, new_picker)
content = content.replace(old_customize, new_customize)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
