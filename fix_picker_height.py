import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

content = content.replace('width="100%"\n              height="100%"', 'width="100%"\n              height={350}')

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
