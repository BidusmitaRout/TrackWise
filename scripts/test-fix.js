const fs = require('fs');
const path = require('path');

const suspicious = ['â', 'ð', 'Â'];
const targets = [
  path.join(__dirname, '..', 'learningtrackerfinal', 'learningtrackerfinal'),
];

const sequences = new Set();

const walk = (dir) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      suspicious.forEach((ch) => {
        let idx = content.indexOf(ch);
        while (idx !== -1) {
          sequences.add(content.slice(idx, idx + 4));
          idx = content.indexOf(ch, idx + 1);
        }
      });
    }
  });
};

walk(targets[0]);

const cp1252Map = new Map([
  [0x20AC, 0x80], [0x201A, 0x82], [0x0192, 0x83], [0x201E, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02C6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8A], [0x2039, 0x8B], [0x0152, 0x8C],
  [0x017D, 0x8E], [0x2018, 0x91], [0x2019, 0x92], [0x201C, 0x93],
  [0x201D, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02DC, 0x98], [0x2122, 0x99], [0x0161, 0x9A], [0x203A, 0x9B],
  [0x0153, 0x9C], [0x017E, 0x9E], [0x0178, 0x9F],
]);

const toByte = (code) => {
  if (code <= 0x7F) return code;
  if (code >= 0xA0 && code <= 0xFF) return code;
  if (cp1252Map.has(code)) return cp1252Map.get(code);
  if (code >= 0x80 && code <= 0x9F) return code;
  throw new Error(`Unhandled codepoint ${code.toString(16)}`);
};

const decode = (seq) => {
  const bytes = Buffer.from(Array.from(seq, (ch) => toByte(ch.charCodeAt(0))));
  return bytes.toString('utf8');
};

console.log([...sequences].map((seq) => `${JSON.stringify(seq)} -> ${decode(seq)}`));

