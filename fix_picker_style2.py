import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'style={{ flex: 1, width: "100%", height: "100%", "--epr-bg-color": "transparent", border: "none" } as any}',
    'height="100%"\n              style={{ flex: 1, width: "100%", height: "100%", "--epr-bg-color": "transparent", border: "none" } as any}'
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
