import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { javaCommand } from './build-guard.mjs';
function child(lock, script, name, code='0') {
  return new Promise((ok,fail)=>{
    const p=spawn(javaCommand,[resolve('scripts/BuildGuard.java'),lock,process.execPath,script,name,code],{stdio:'pipe'});
    let error='';p.stderr.on('data',d=>error+=d);p.on('error',fail);p.on('exit',n=>ok({code:n,error}));
  });
}
test('separate build processes serialize and a failed child releases the lock', async()=>{
  const dir=await mkdtemp(join(tmpdir(),'notes-guard-'));
  try {
    const lock=join(dir,'pipeline.lock'), log=join(dir,'events.jsonl'), script=join(dir,'child.mjs');
    await writeFile(script,`import {appendFile} from 'node:fs/promises';
const log=${JSON.stringify(log)};const name=process.argv[2];await appendFile(log,name+':start\\n');await new Promise(r=>setTimeout(r,180));await appendFile(log,name+':end\\n');process.exit(Number(process.argv[3]));`);
    const results=await Promise.all([child(lock,script,'a','7'),child(lock,script,'b')]);
    assert.deepEqual(results.map(x=>x.code),[7,0],JSON.stringify(results));
    const events=(await readFile(log,'utf8')).trim().split('\n');
    assert.ok(['a:start,a:end,b:start,b:end','b:start,b:end,a:start,a:end'].includes(events.join(',')),events.join(','));
    assert.equal((await child(lock,script,'c')).code,0);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
