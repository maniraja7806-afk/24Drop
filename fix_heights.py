import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# For picker mode
content = content.replace(
    "style={coords.isMobileSheet ? { height: '85dvh' } : { height: '480px', maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85dvh' }}",
    "style={coords.isMobileSheet ? { height: '85dvh' } : { maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85dvh' }}"
)

# For customize mode
content = content.replace(
    "style={coords.isMobileSheet ? { height: '90dvh' } : { height: '540px', maxHeight: 'min(90vh, 540px)' }}",
    "style={coords.isMobileSheet ? { height: '90dvh' } : { maxHeight: 'min(90vh, 600px)' }}"
)

# And let's make sure EmojiPicker gets 100% height again so it fills whatever max-height allows
content = content.replace("height={350}", 'height="100%"')

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
