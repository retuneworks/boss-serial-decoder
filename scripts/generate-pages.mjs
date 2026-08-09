import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('docs');
const config = JSON.parse(await fs.readFile(path.resolve('site.config.json'), 'utf8'));
const base = config.baseUrl || '';

async function htmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name.endsWith('.html') ? [target] : [];
  }));
  return nested.flat();
}

function publicPath(file) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (relative === 'index.html') return '';
  return relative.endsWith('/index.html') ? relative.slice(0, -'index.html'.length) : relative;
}

function xmlEscape(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

if (base && !base.includes('USERNAME')) {
  const clean = base.replace(/\/$/, '');
  const files = await htmlFiles(root);
  const indexable = [];
  for (const file of files) {
    const html = await fs.readFile(file, 'utf8');
    if (!/<meta\s+name=["']robots["']\s+content=["'][^"']*\bindex\b/i.test(html)) continue;
    indexable.push(`${clean}/${publicPath(file)}`);
  }
  indexable.sort((a, b) => a.localeCompare(b, 'en'));
  const urls = indexable.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await fs.writeFile(path.join(root, 'sitemap.xml'), xml, 'utf8');
  await fs.writeFile(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${clean}/sitemap.xml\n`, 'utf8');
  console.log(`Generated robots.txt and sitemap.xml with ${indexable.length} indexable pages.`);
} else {
  await fs.writeFile(path.join(root, 'robots.txt'), 'User-agent: *\nAllow: /\n', 'utf8');
  await fs.rm(path.join(root, 'sitemap.xml'), { force: true });
  console.log('Generated robots.txt without a sitemap because baseUrl is not configured.');
}
