import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# For picker mode
content = content.replace(
    "style={coords.isMobileSheet ? { height: '85dvh' } : { maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85dvh' }}",
    "style={coords.isMobileSheet ? { height: '85dvh' } : { height: '480px', maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85dvh' }}"
)

# For customize mode
content = content.replace(
    "style={coords.isMobileSheet ? { height: '90dvh' } : { maxHeight: 'min(90vh, 600px)' }}",
    "style={coords.isMobileSheet ? { height: '90dvh' } : { height: '560px', maxHeight: 'min(90vh, 560px)' }}"
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
