import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# Replace actualHeight reading
content = re.sub(
    r'    if \(popupRef\.current\) \{\n      const actualWidth = popupRef\.current\.offsetWidth;\n      const actualHeight = popupRef\.current\.offsetHeight;\n      if \(actualWidth > 0 && actualHeight > 0\) \{\n        popupWidth = actualWidth;\n        popupHeight = actualHeight;\n      \}\n    \}',
    '    if (popupRef.current) {\n      const actualWidth = popupRef.current.offsetWidth;\n      if (actualWidth > 0) {\n        popupWidth = actualWidth;\n      }\n    }',
    content,
    flags=re.DOTALL
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
