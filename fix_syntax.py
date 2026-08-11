with open('src/components/ReactionSystem.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """              pointerEvents: 'none'\n            })\n            className={clsx(""",
    """              pointerEvents: 'none'\n            })}\n            className={clsx("""
)

with open('src/components/ReactionSystem.tsx', 'w') as f:
    f.write(content)
