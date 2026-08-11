import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# Add maxHeight to coords interface
if 'maxHeight?: number;' not in content:
    content = content.replace(
        "isMobileSheet: boolean;",
        "isMobileSheet: boolean;\n  maxHeight?: number;"
    )

# Compute max height
calc_logic = """    const viewportWidth = window.innerWidth;
    calculatedLeft = Math.max(12, Math.min(calculatedLeft, viewportWidth - popupWidth - 12));

    const maxAllowedHeight = bottomBoundary - calculatedTop;

    setCoords({
      top: Math.round(calculatedTop),
      left: Math.round(calculatedLeft),
      positionStyle: style,
      isMobileSheet: false,
      maxHeight: Math.max(200, maxAllowedHeight)
    });"""

content = re.sub(
    r'    const viewportWidth = window.innerWidth;\n    calculatedLeft = Math.max\(12, Math.min\(calculatedLeft, viewportWidth - popupWidth - 12\)\);\n\n    setCoords\(\{\n      top: Math.round\(calculatedTop\),\n      left: Math.round\(calculatedLeft\),\n      positionStyle: style,\n      isMobileSheet: false\n    \}\);',
    calc_logic,
    content,
    flags=re.DOTALL
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
