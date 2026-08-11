import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'theme={Theme.DARK}',
    'theme={Theme.DARK}\n                previewConfig={{ showPreview: false }}'
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
