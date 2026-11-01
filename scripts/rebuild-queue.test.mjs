import test from 'node:test';
import assert from 'node:assert/strict';
import { createRebuildQueue } from './rebuild-queue.mjs';
test('changes during a build are coalesced into a serial follow-up build', async () => {
  const gate = Promise.withResolvers(); const started = Promise.withResolvers();
  const builds=[]; let active=0;
  const request=createRebuildQueue(async changes=>{
    assert.equal(active++,0); builds.push([...changes].sort());
    if(builds.length===1){started.resolve();await gate.promise;}
    active--;
  });
  const done=request('content'); await started.promise;
  request('content'); request('ui'); request('ui'); gate.resolve(); await done;
  assert.deepEqual(builds,[['content'],['content','ui']]);
  await request('content'); assert.equal(builds.length,3);
});
test('a failed build reports an error and still processes pending changes', async()=>{
  const gate=Promise.withResolvers();const started=Promise.withResolvers();let count=0;const errors=[];
  const request=createRebuildQueue(async()=>{if(++count===1){started.resolve();await gate.promise;throw new Error('invalid content');}},e=>errors.push(e.message));
  const done=request('content');await started.promise;request('ui');gate.resolve();await done;
  assert.equal(count,2);assert.deepEqual(errors,['invalid content']);
});
