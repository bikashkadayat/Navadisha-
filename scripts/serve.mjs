/** Minimal static server for local audit runs (Lighthouse, screenshots). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const port = Number(process.argv[2] ?? 4400);
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain','.json':'application/json'};
http.createServer((req,res)=>{
  let f = path.join(root, decodeURIComponent(new URL(req.url,'http://x').pathname));
  try { if (fs.statSync(f).isDirectory()) f = path.join(f,'index.html'); } catch { res.writeHead(404); return res.end(); }
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);return res.end();}
    res.writeHead(200,{'content-type':types[path.extname(f)]??'application/octet-stream'}); res.end(d); });
}).listen(port,'127.0.0.1',()=>console.log('serving dist on',port));
