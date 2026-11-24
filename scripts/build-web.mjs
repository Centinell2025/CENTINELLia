import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ui=fs.existsSync(path.join(root,'ui'))?path.join(root,'ui'):path.join(root,'app/src/main/assets');
const manifestPath=path.join(root,'.openai/hosting.json');
if(!fs.existsSync(manifestPath))throw Error('Run this build in the registered Site checkout with its existing hosting manifest.');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(!manifest.project_id)throw Error('The existing Site identity is required.');
if(manifest.static)throw Error('The source hosting manifest must use the Worker configuration before building.');
const assets={};
for(const [name,type]of [['index.html','text/html; charset=utf-8'],['app.css','text/css; charset=utf-8'],['core.js','application/javascript; charset=utf-8'],['app.js','application/javascript; charset=utf-8']]){
  let body=fs.readFileSync(path.join(ui,name),'utf8');
  if(name==='index.html')body=body.replace('<main id="main"','<div class="preview-notice">WEB WORKSPACE · Records stay in this browser. AI consultation shares only the question and any case context you explicitly include.</div><main id="main"');
  assets['/'+name]={type,body};
}
const worker=fs.readFileSync(path.join(root,'web/ai-worker.mjs'),'utf8')+'\nconst ASSETS='+JSON.stringify(assets)+';\nexport default createWorker(ASSETS);\n';
fs.rmSync(path.join(root,'dist'),{recursive:true,force:true});
fs.mkdirSync(path.join(root,'dist/server'),{recursive:true});
fs.mkdirSync(path.join(root,'dist/.openai'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/server/index.js'),worker);
fs.copyFileSync(manifestPath,path.join(root,'dist/.openai/hosting.json'));
console.log('Built the existing private Site with packaged UI and server-only AI routes.');
