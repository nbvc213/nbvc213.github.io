import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,dirname } from 'node:path';
import { checkRelease } from './release-check.mjs';
async function fixture(){const dir=await mkdtemp(join(tmpdir(),'notes-release-'));for(const file of ['index.html','404.html','.nojekyll','assets/app.js','media/icons.svg','data/catalog.json']){await mkdir(dirname(join(dir,file)),{recursive:true});await writeFile(join(dir,file),file.endsWith('catalog.json')?JSON.stringify({site:{url:'https://example.test'},notes:[{id:'test'}]}):'test');}return dir;}
test('release check accepts a static artifact and rejects backup or source additions',async()=>{
  const dir=await fixture();try{assert.equal((await checkRelease(dir)).notes,1);await mkdir(join(dir,'media','content'));await writeFile(join(dir,'media','content','note.md'),'source');await assert.rejects(checkRelease(dir),/原稿/);await rm(join(dir,'media','content'),{recursive:true});await writeFile(join(dir,'notes-personal-2026-11-01.json'),'{}');await assert.rejects(checkRelease(dir),/备份/);}finally{await rm(dir,{recursive:true,force:true});}
});
test('release check rejects unsupported project subpaths',async()=>{const dir=await fixture();try{await writeFile(join(dir,'data/catalog.json'),JSON.stringify({site:{url:'https://example.test/repo/'},notes:[{}]}));await assert.rejects(checkRelease(dir),/根站点/);}finally{await rm(dir,{recursive:true,force:true});}});
