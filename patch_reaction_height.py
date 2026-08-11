import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

content = content.replace('min-h-[300px]', 'min-h-0')

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
