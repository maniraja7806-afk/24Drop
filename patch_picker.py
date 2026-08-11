import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

content = content.replace("              lazyLoadEmojis\n", "")

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
