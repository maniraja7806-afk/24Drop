import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# 1. Update calculatePosition
# Add keyboard check
keyboard_check = """
    const isMobile = window.innerWidth <= 640;
    
    // Detect if viewport height is restricted by keyboard
    const isKeyboardRestricted = window.visualViewport 
      ? window.visualViewport.height < window.innerHeight * 0.75 
      : false;
      
    if ((isMobile || isKeyboardRestricted) && mode !== 'quick') {
       setCoords({ top: 0, left: 0, positionStyle: 'center', isMobileSheet: true });
       return;
    }
"""
content = re.sub(
    r'const isMobile = window.innerWidth <= 640;\s*if \(isMobile && mode !== \'quick\'\) \{\s*setCoords\(\{ top: 0, left: 0, positionStyle: \'center\', isMobileSheet: true \}\);\s*return;\s*\}',
    keyboard_check.strip(),
    content
)

# 2. Update styles in portalContent
old_style = """            style={coords.isMobileSheet ? {
               position: 'fixed',
               bottom: 0,
               left: 0,
               right: 0,
               zIndex: 99999,
               display: 'flex',
               flexDirection: 'column',
               justifyContent: 'flex-end',
               pointerEvents: 'none'
            } : {"""

new_style = """            style={coords.isMobileSheet ? {
               zIndex: 99999,
               pointerEvents: 'none'
            } : {"""
content = content.replace(old_style, new_style)

old_cls = """            className={clsx(
               "select-none",
               !coords.isMobileSheet && "max-w-[calc(100vw-1.5rem)]"
            )}"""

new_cls = """            className={clsx(
               "select-none",
               !coords.isMobileSheet && "max-w-[calc(100vw-1.5rem)]",
               coords.isMobileSheet && "fixed bottom-0 w-full flex flex-col justify-end left-0 right-0 z-[100000]"
            )}"""
content = content.replace(old_cls, new_cls)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
