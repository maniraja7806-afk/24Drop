import re

with open('src/components/MainApp.tsx', 'r') as f:
    content = f.read()

# Remove unused states
content = re.sub(r'const \[isCustomizingEmojis, setIsCustomizingEmojis\] = useState\(false\);\n', '', content)
content = re.sub(r'const \[isCustomizing, setIsCustomizing\] = useState\(false\);\n', '', content)

# Remove the useEffect that uses activeReactionMsgFull
pattern = re.compile(r'  useEffect\(\(\) => \{\n    const handleEmojiClick = \(e: any\) => \{.*?\n  \}, \[isCustomizing, activeReactionMsgFull\]\);\n', re.DOTALL)
content = pattern.sub('', content)

with open('src/components/MainApp.tsx', 'w') as f:
    f.write(content)
