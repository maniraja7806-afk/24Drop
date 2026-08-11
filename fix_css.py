import re

with open('src/index.css', 'r') as f:
    content = f.read()

content = content.replace('flex: 1 !important;', 'flex: 1 1 auto !important;')

with open('src/index.css', 'w') as f:
    f.write(content)
