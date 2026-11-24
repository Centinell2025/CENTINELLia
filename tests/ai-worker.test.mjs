import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorker} from '../web/ai-worker.mjs';
const base='https://dfir.example';
const request=(body,extra={})=>new Request(base+'/api/ai/consult',{method:'POST',headers:{'content-type':'application/json','origin':base,'oai-authenticated-user-id':'test-owner',...extra},body:typeof body==='string'?body:JSON.stringify(body)});
test('AI routes reject anonymous users and never reveal a configured key',async()=>{
  const worker=createWorker();const key='test-only-not-a-real-key';
  const anonymous=await worker.fetch(new Request(base+'/api/ai/status'),{OPENAI_API_KEY:key});assert.equal(anonymous.status,401);
  const status=await worker.fetch(new Request(base+'/api/ai/status',{headers:{'oai-authenticated-user-id':'owner'}}),{OPENAI_API_KEY:key});
  const text=await status.text();assert.equal(JSON.parse(text).configured,true);assert.ok(!text.includes(key));
});
test('missing configuration, cross-origin requests and invalid bodies do not contact a provider',async()=>{
  let called=0;const worker=createWorker({},async()=>{called++;throw Error();});
  assert.equal((await worker.fetch(request({question:'Review the evidence'}),{})).status,503);
  assert.equal((await worker.fetch(request({question:'Review'},{origin:'https://other.example'}),{OPENAI_API_KEY:'test'})).status,403);
  assert.equal((await worker.fetch(request('{broken'),{OPENAI_API_KEY:'test'})).status,400);
  assert.equal((await worker.fetch(request('null'),{OPENAI_API_KEY:'test'})).status,400);
  assert.equal((await worker.fetch(request('[]'),{OPENAI_API_KEY:'test'})).status,400);
  assert.equal((await worker.fetch(request({question:'x'.repeat(4001)}),{OPENAI_API_KEY:'test'})).status,400);
  assert.equal((await worker.fetch(request({question:'x',context:'x'.repeat(12001)}),{OPENAI_API_KEY:'test'})).status,400);
  assert.equal((await worker.fetch(request('x'.repeat(100001)),{OPENAI_API_KEY:'test'})).status,413);
  assert.equal(called,0);
});
test('only explicitly provided case context is forwarded, response storage is disabled, provider output is bounded',async()=>{
  let sent;
  const worker=createWorker({},async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');sent=JSON.parse(options.body);return Response.json({output:[{type:'reasoning',summary:[]},{type:'message',role:'assistant',content:[{type:'output_text',text:'Verify the original authentication log.'}]}]});});
  let response=await worker.fetch(request({question:'What should I verify?'}),{OPENAI_API_KEY:'test-only'});
  assert.equal(response.status,200);assert.equal(sent.store,false);assert.ok(sent.input.includes('No case record was included.'));assert.equal(sent.max_output_tokens,1500);
  assert.equal((await response.json()).answer,'Verify the original authentication log.');
  response=await worker.fetch(request({question:'Review the sequence',context:'TRAINING: a log entry was reported.'}),{OPENAI_API_KEY:'test-only'});
  assert.equal(response.status,200);assert.ok(sent.input.includes('BEGIN UNTRUSTED CASE RECORD'));
});
test('request pacing and provider failures are handled without leaking provider bodies',async()=>{
  const worker=createWorker({},async()=>new Response('private-provider-error-data',{status:401}));
  for(let i=0;i<5;i++){const result=await worker.fetch(request({question:'Review'}),{OPENAI_API_KEY:'test'});assert.equal(result.status,502);assert.ok(!(await result.text()).includes('private-provider'));}
  assert.equal((await worker.fetch(request({question:'Review'}),{OPENAI_API_KEY:'test'})).status,429);
});
test('packaged pages are served without needing an AI key',async()=>{
  const worker=createWorker({'/index.html':{type:'text/html',body:'<h1>Workspace</h1>'}});
  assert.equal(await (await worker.fetch(new Request(base))).text(),'<h1>Workspace</h1>');
  assert.equal((await worker.fetch(new Request(base+'/missing'))).status,404);
});
