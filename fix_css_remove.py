import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Remove the custom flexbox layout
content = re.sub(r'/\* Emoji Picker Flexbox Layout \*/.*', '', content, flags=re.DOTALL)

with open('src/index.css', 'w') as f:
    f.write(content)
