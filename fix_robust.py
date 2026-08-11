import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# Replace any of the recent wrappers with a guaranteed robust flex layout
old_pattern1 = r'<div className="flex-1 w-full min-h-0 overflow-hidden relative">\s*<EmojiPicker\s*theme=\{Theme\.DARK\}\s*previewConfig=\{\{ showPreview: false \}\}\s*onEmojiClick=\{\(e\) => handlePick\(e\.emoji\)\}\s*style=\{\{ position: \'absolute\', top: 0, left: 0, right: 0, bottom: 0, width: \'100%\', height: \'100%\', \'--epr-bg-color\': \'transparent\', border: \'none\' \} as any\}\s*/>\s*</div>'

new_pattern1 = """          <div className="flex-1 w-full min-h-0 flex flex-col" style={{ minHeight: '250px' }}>
            <EmojiPicker
              theme={Theme.DARK}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handlePick(e.emoji)}
              style={{ flex: 1, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />
          </div>"""

old_pattern2 = r'<div className="flex-1 w-full min-h-0 overflow-hidden relative">\s*<EmojiPicker\s*theme=\{Theme\.DARK\}\s*previewConfig=\{\{ showPreview: false \}\}\s*onEmojiClick=\{\(e\) => handleAddEdit\(e\.emoji\)\}\s*style=\{\{ position: \'absolute\', top: 0, left: 0, right: 0, bottom: 0, width: \'100%\', height: \'100%\', \'--epr-bg-color\': \'transparent\', border: \'none\' \} as any\}\s*/>\s*</div>'

new_pattern2 = """          <div className="flex-1 w-full min-h-0 flex flex-col" style={{ minHeight: '250px' }}>
            <EmojiPicker
              theme={Theme.DARK}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handleAddEdit(e.emoji)}
              style={{ flex: 1, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />
          </div>"""

content = re.sub(old_pattern1, new_pattern1, content)
content = re.sub(old_pattern2, new_pattern2, content)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
