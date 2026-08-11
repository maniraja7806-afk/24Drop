import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# Make sure we pass height="100%" as a prop, as well as the style!
old1 = r'<EmojiPicker\s*theme=\{Theme\.DARK\}\s*previewConfig=\{\{ showPreview: false \}\}\s*onEmojiClick=\{\(e\) => handlePick\(e\.emoji\)\}\s*style=\{\{ flex: 1, width: \'100%\', height: \'100%\', \'--epr-bg-color\': \'transparent\', border: \'none\' \} as any\}\s*/>'

new1 = """<EmojiPicker
              theme={Theme.DARK}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handlePick(e.emoji)}
              width="100%"
              height="100%"
              style={{ flex: 1, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />"""

old2 = r'<EmojiPicker\s*theme=\{Theme\.DARK\}\s*previewConfig=\{\{ showPreview: false \}\}\s*onEmojiClick=\{\(e\) => handleAddEdit\(e\.emoji\)\}\s*style=\{\{ flex: 1, width: \'100%\', height: \'100%\', \'--epr-bg-color\': \'transparent\', border: \'none\' \} as any\}\s*/>'

new2 = """<EmojiPicker
              theme={Theme.DARK}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => handleAddEdit(e.emoji)}
              width="100%"
              height="100%"
              style={{ flex: 1, width: '100%', height: '100%', '--epr-bg-color': 'transparent', border: 'none' } as any}
            />"""

content = re.sub(old1, new1, content)
content = re.sub(old2, new2, content)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
