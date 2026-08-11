import re

with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

# We need to remove the injected code block at the bottom (ReactionList component)
# It starts with "// --- Drag to dismiss logic for mobile sheet ---" and ends with "if (!isOpen) return null;"
# We will use split to separate the two occurrences.

parts = content.split('  // --- Drag to dismiss logic for mobile sheet ---')
# There should be 3 parts. index 1 is the first injection, index 2 is the second injection.

if len(parts) == 3:
    # Remove the second injection
    # The second injection ends with '  if (!isOpen) return null;\n'
    # We want to replace it back with just '  if (!isOpen) return null;'
    part2 = parts[2]
    # Find where the injected useEffect ends
    end_index = part2.find('  if (!isOpen) return null;')
    
    clean_part2 = '  if (!isOpen) return null;' + part2[end_index + len('  if (!isOpen) return null;'):]
    
    new_content = parts[0] + '  // --- Drag to dismiss logic for mobile sheet ---' + parts[1] + clean_part2
    
    with open('src/components/ReactionSystem.tsx', 'w') as f:
        f.write(new_content)

