const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'learningtrackerfinal', 'learningtrackerfinal'),
  path.join(__dirname, '..', 'learningtrackerfinal', 'react-app', 'src', 'legacy', 'pages'),
];

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
  if (code <= 0x7f) return code;
  if (code >= 0xa0 && code <= 0xff) return code;
  if (cp1252Map.has(code)) return cp1252Map.get(code);
  if (code >= 0x80 && code <= 0x9f) return code;
  throw new Error(`Unhandled codepoint ${code.toString(16)}`);
};

const decodeChunk = (chunk) => {
  try {
    const bytes = Buffer.from(Array.from(chunk, (ch) => toByte(ch.charCodeAt(0))));
    const decoded = bytes.toString('utf8');
    if (decoded.includes('�')) return null;
    return decoded;
  } catch (err) {
    return null;
  }
};

const fixContent = (content) => {
  const suspicious = new Set(['ð', 'â', 'Â']);
  let result = '';
  let i = 0;

  while (i < content.length) {
    const ch = content[i];
    if (suspicious.has(ch)) {
      let replaced = false;
      for (let len = 6; len >= 2; len--) {
        const chunk = content.slice(i, i + len);
        const decoded = decodeChunk(chunk);
        if (decoded) {
          result += decoded;
          i += len;
          replaced = true;
          break;
        }
      }
      if (replaced) continue;
    }
    result += ch;
    i += 1;
  }

  return result;
};

const walk = (dir) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.html')) {
      const original = fs.readFileSync(fullPath, 'utf8');
      const fixed = fixContent(original);
      if (fixed !== original) {
        fs.writeFileSync(fullPath, fixed, 'utf8');
        console.log('Patched', path.relative(process.cwd(), fullPath));
      }
    }
  });
};

targets.forEach((target) => {
  if (fs.existsSync(target)) {
    walk(target);
  }
});

