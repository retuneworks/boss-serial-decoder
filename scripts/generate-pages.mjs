import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('docs');
const config=JSON.parse(await fs.readFile(path.resolve('site.config.json'),'utf8'));
const base=config.baseUrl||'';
if(base && !base.includes('USERNAME')){
  const clean=base.replace(/\/$/,'');
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${clean}/</loc></url>\n  <url><loc>${clean}/about.html</loc></url>\n</urlset>\n`;
  await fs.writeFile(path.join(root,'sitemap.xml'),xml,'utf8');
  await fs.writeFile(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${clean}/sitemap.xml\n`,'utf8');
}else{
  await fs.writeFile(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\n','utf8');
  await fs.rm(path.join(root,'sitemap.xml'),{force:true});
}
console.log('Generated robots.txt and sitemap settings.');
