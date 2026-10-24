/**
 * Minimal local static preview server for native DÈLGHEM website.
 * No external dependencies; never used as a production runtime.
 */
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {dirname,extname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.argv[2]??8765);
if(!Number.isSafeInteger(port)||port<1024||port>65535)
 throw Error('Provide a local port from 1024 to 65535');
const mime={
 '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json; charset=utf-8','.webp':'image/webp',
 '.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg',
 '.jpeg':'image/jpeg','.xml':'application/xml; charset=utf-8',
 '.txt':'text/plain; charset=utf-8','.woff2':'font/woff2',
 '.ttf':'font/ttf','.webmanifest':'application/manifest+json'
};
createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const u=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(u.pathname);
  if(pathname.includes('\0')||pathname.split('/').some(p=>p.startsWith('.'))){
   res.writeHead(404);res.end();return;
  }
  let file=resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  const data=await readFile(file);
  res.setHeader('Content-Type',mime[extname(file).toLowerCase()]||'application/octet-stream');
  res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.writeHead(200);res.end(req.method==='HEAD'?undefined:data);
 }catch(error){
  res.writeHead(error?.code==='ENOENT'?404:500);res.end();
 }
}).listen(port,'127.0.0.1',()=>console.log('DÈLGHEM static preview at http://127.0.0.1:'+port+'/'));
