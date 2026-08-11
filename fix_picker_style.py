import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

content = content.replace('height={350}', 'style={{ flex: 1, width: "100%", height: "100%", "--epr-bg-color": "transparent", border: "none" } as any}')
content = content.replace('              style={{ \'--epr-bg-color\': \'transparent\', border: \'none\' } as any}\n', '')

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
