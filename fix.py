with open("src/components/MainApp.tsx", "r") as f:
    lines = f.readlines()

new_lines = lines[:479] + [
    "    }\n",
    "    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;\n",
    "    const nearBottom = distanceFromBottom <= 100;\n",
    "    updateIsAtBottom(nearBottom);\n",
    "    if (nearBottom) {\n",
    "      setUnreadCount(0);\n",
    "    }\n",
    "  };\n"
] + lines[489:]

with open("src/components/MainApp.tsx", "w") as f:
    f.writelines(new_lines)
