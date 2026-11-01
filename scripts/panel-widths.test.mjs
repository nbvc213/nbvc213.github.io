import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
await mkdir('.tools',{recursive:true});
const source=ts.transpileModule(await readFile('web/panel-widths.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}});
await writeFile('.tools/panel-widths-test.mjs',source.outputText);
const {fitPanelWidths:fit}=await import(pathToFileURL(resolve('.tools/panel-widths-test.mjs')));
test('desktop panels obey limits and leave at least 480px for the article',()=>{
  for(const width of [1101,1200,1440,1800])for(const left of [10,180,220,360,999])for(const right of [10,180,224,360,999]){
    const result=fit(width,left,right,true,true);assert.ok(result.left>=180&&result.left<=360);assert.ok(result.right>=180&&result.right<=360);assert.ok(width-result.left-result.right>=480);
  }
});
test('collapsed and mobile panels do not reserve article space',()=>{
  assert.deepEqual(fit(390,220,224,false,false),{left:0,right:0});
  assert.deepEqual(fit(1000,360,224,true,false),{left:360,right:0});
});
