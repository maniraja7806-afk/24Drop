import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# For mode === 'picker'
content = content.replace(
    "style={coords.isMobileSheet ? { height: '85vh' } : { height: '480px', maxHeight: '85vh' }}",
    "style={coords.isMobileSheet ? { height: '85vh' } : { height: '480px', maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85vh' }}"
)

# For mode === 'customize'
content = content.replace(
    "style={coords.isMobileSheet ? { height: '90vh' } : { height: '540px', maxHeight: '90vh' }}",
    "style={coords.isMobileSheet ? { height: '90vh' } : { height: '540px', maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '90vh' }}"
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
