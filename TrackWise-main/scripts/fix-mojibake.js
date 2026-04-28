const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'learningtrackerfinal', 'learningtrackerfinal'),
  path.join(__dirname, '..', 'learningtrackerfinal', 'react-app', 'src', 'legacy', 'pages'),
];

const replacements = new Map([
  ['â€™', "'"],
  ['â€œ', '“'],
  ['â€', '”'],
  ['â€“', '–'],
  ['â€”', '—'],
  ['â€¦', '…'],
  ['â˜°', '&#9776;'],
  ['â˜€ï¸', '&#9728;'],
  ['ðŸ†', '&#127942;'],
  ['â±ï¸', '&#9201;'],
  ['â­', '&#11088;'],
  ['ðŸ“Š', '&#128202;'],
  ['Â©', '&copy;'],
  ['ðŸ“Œ', '&#128204;'],
  ['ðŸ“Ž', '&#128206;'],
  ['ðŸ’¥', '&#128293;'],
  ['ðŸ“œ', '&#128220;'],
  ['ðŸ‘¤', '&#128100;'],
  ['ðŸ“…', '&#128197;'],
  ['ðŸ“—', '&#128215;'],
]);

const walk = (dir) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = content;
      replacements.forEach((replacement, bad) => {
        updated = updated.split(bad).join(replacement);
      });
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log('Fixed', path.relative(process.cwd(), fullPath));
      }
    }
  });
};

targets.forEach((target) => {
  if (fs.existsSync(target)) {
    walk(target);
  }
});

