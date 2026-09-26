// Bundles index.html and src/*.js into one self-contained HTML file.
// Usage: node tools/build.js                 -> dist/super-punekar.html (open it anywhere, works offline)
//        node tools/build.js --fragment out  -> page body only, for hosts that add their own <html>/<head>
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const inlined = html.replace(/<script src="(src\/[^"]+)"><\/script>/g, (m, src) => {
  const code = fs.readFileSync(path.join(root, src), 'utf8');
  if (code.includes('</script')) throw new Error(src + ' contains a closing script tag');
  return `<script>\n${code}</script>`;
});

const fragIdx = process.argv.indexOf('--fragment');
if (fragIdx !== -1) {
  const out = process.argv[fragIdx + 1];
  const head = inlined.match(/<head>([\s\S]*?)<\/head>/)[1];
  const body = inlined.match(/<body>([\s\S]*?)<\/body>/)[1];
  const frag = head
    .replace(/<meta charset[^>]*>\s*/, '')
    .replace(/<meta name="viewport"[^>]*>\s*/, '')
    .trim() + '\n' + body.trim() + '\n';
  fs.writeFileSync(out, frag);
  console.log('wrote', out, (frag.length / 1024).toFixed(0) + ' KB');
} else {
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  const out = path.join(root, 'dist', 'super-punekar.html');
  fs.writeFileSync(out, inlined);
  console.log('wrote', path.relative(root, out), (inlined.length / 1024).toFixed(0) + ' KB');
}
