/* Development adapter only. Hosted production runs the Worker directly. */
import http from 'node:http';
import fs from 'node:fs';
import {Readable} from 'node:stream';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const file=path.resolve('dist/server/index.js');
const server=http.createServer(async(req,res)=>{
  try{
    const module=await import(pathToFileURL(file).href+'?mtime='+fs.statSync(file).mtimeMs);
    const method=req.method||'GET';
    const request=new Request('http://'+req.headers.host+req.url,{method,headers:req.headers,...(!['GET','HEAD'].includes(method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
    // Never read production credentials or contact an AI provider from preview.
    const response=await module.default.fetch(request,{});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch(_){res.writeHead(500,{'content-type':'text/plain'});res.end('Preview could not serve the page. Rebuild the local Worker.');}
});
const option=(name,fallback)=>{const at=process.argv.indexOf(name);return at>=0?process.argv[at+1]:fallback;};
server.listen(Number(option('--port',process.env.PORT||5173)),option('--host','127.0.0.1'),()=>console.log('CENTINELLia development preview is listening.'));
