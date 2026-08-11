const fs = require('fs');
const content = fs.readFileSync('node_modules/emoji-picker-react/dist/index.js', 'utf8');
if (content.includes("What's Your Mood")) {
  console.log("Found What's Your Mood in the library!");
} else {
  console.log("Not found in the library.");
}
