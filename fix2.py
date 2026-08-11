with open("src/components/MainApp.tsx", "r") as f:
    lines = f.readlines()

new_lines = lines[:487] + lines[489:]

with open("src/components/MainApp.tsx", "w") as f:
    f.writelines(new_lines)
