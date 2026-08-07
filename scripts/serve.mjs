import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve('docs');
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const target = path.resolve(root, relative);
  if (!target.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(target, (statError, stat) => {
    if (statError || !stat.isFile()) {
      const fallback = path.join(root, '404.html');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fallback).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(target).pipe(res);
  });
});

server.listen(port, () => console.log(`Local site: http://localhost:${port}`));
