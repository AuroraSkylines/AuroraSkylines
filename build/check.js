const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\maxry\\Downloads\\city-builder-FINAL2-UPDATED\\build\\game.js', 'utf8');

let braces = 0;
let parens = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') braces++;
    if (line[j] === '}') braces--;
    if (line[j] === '(') parens++;
    if (line[j] === ')') parens--;
  }
  if (line.startsWith('function ')) {
    console.log(`Function at line ${i + 1} starts, braces = ${braces}`);
  }
}

console.log(`Final braces: ${braces}, parens: ${parens}`);
