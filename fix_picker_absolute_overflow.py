import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="absolute inset-0">',
    '<div className="absolute inset-0 overflow-hidden">'
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
