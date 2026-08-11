import re

with open('src/index.css', 'r') as f:
    content = f.read()

content = re.sub(r'\.EmojiPickerReact \{\n  min-height: 0 !important;\n  height: 100% !important;\n\}', '', content)
content = re.sub(r'\.EmojiPickerReact, \.EmojiPickerReact \.epr-main \{\n  min-height: 0 !important;\n  height: 100% !important;\n\}', '', content)

with open('src/index.css', 'w') as f:
    f.write(content)
