import re

with open('src/components/MainApp.tsx', 'r') as f:
    content = f.read()

# Remove the old Emoji Picker block in MainApp
pattern = re.compile(r'\{\/\* Full Emoji Picker & Customization Modal \*\/\}.*?<\/AnimatePresence>', re.DOTALL)
content = pattern.sub('', content)

# Remove unused states related to old emoji picker
content = re.sub(r'const \[activeReactionMsgFull, setActiveReactionMsgFull\] = useState<string \| null>\(null\);\n', '', content)

with open('src/components/MainApp.tsx', 'w') as f:
    f.write(content)
