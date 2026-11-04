import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
test('auto indexes same filenames in separate folders and updates only modified notes',()=>{
 const root=mkdtempSync(join(tmpdir(),'notes-index-'));
 try{
 for(const folder of ['甲','乙']){mkdirSync(join(root,'content',folder),{recursive:true});writeFileSync(join(root,'content',folder,'笔记.md'),'正文');}
 const run=(...args)=>{const result=spawnSync(process.execPath,[fileURLToPath(new URL('./sync-content.mjs',import.meta.url)),...args],{cwd:root,encoding:'utf8'});assert.equal(result.status,0,result.stderr);};
 run();const file=join(root,'config/content-index.json');let index=JSON.parse(readFileSync(file));const a=index.notes['content/甲/笔记.md'],b=index.notes['content/乙/笔记.md'];assert.notEqual(a.id,b.id);
 a.updated=b.updated='2000-01-01';writeFileSync(file,JSON.stringify(index));writeFileSync(join(root,'content/甲/笔记.md'),'修改正文');
 run('--update');index=JSON.parse(readFileSync(file));assert.notEqual(index.notes['content/甲/笔记.md'].updated,'2000-01-01');assert.equal(index.notes['content/乙/笔记.md'].updated,'2000-01-01');assert.equal(index.notes['content/甲/笔记.md'].id,a.id);
 const saved=readFileSync(file,'utf8');run('--update');assert.equal(readFileSync(file,'utf8'),saved);
 }finally{rmSync(root,{recursive:true,force:true});}
});
