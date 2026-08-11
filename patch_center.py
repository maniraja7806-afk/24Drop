import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# Change the position style for customize mode
content = content.replace(
    """            } : {
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
              pointerEvents: 'none'
            }}""",
    """            } : (mode === 'customize' ? {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999,
              pointerEvents: 'none'
            } : {
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
              pointerEvents: 'none'
            })"""
)

# And for customize mode, remove maxHeight from coords and rely on fixed centering bounds
content = content.replace(
    "style={coords.isMobileSheet ? { height: '90dvh' } : { maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '90dvh' }}",
    "style={coords.isMobileSheet ? { height: '90dvh' } : { height: '540px', maxHeight: 'min(90vh, 540px)' }}"
)

# For picker mode, use the calculated maxHeight but ensure a fixed height is present so EmojiPicker knows its container size
content = content.replace(
    "style={coords.isMobileSheet ? { height: '85dvh' } : { maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85dvh' }}",
    "style={coords.isMobileSheet ? { height: '85dvh' } : { height: '480px', maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '85dvh' }}"
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
