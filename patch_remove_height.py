import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# For mode === 'picker'
content = content.replace(
    "style={coords.isMobileSheet ? { height: '85dvh' } : { height: '480px', maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85dvh' }}",
    "style={coords.isMobileSheet ? { height: '85dvh' } : { maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85dvh' }}"
)

# For mode === 'customize'
content = content.replace(
    "style={coords.isMobileSheet ? { height: '90dvh' } : { height: '540px', maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '90dvh' }}",
    "style={coords.isMobileSheet ? { height: '90dvh' } : { maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '90dvh' }}"
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
