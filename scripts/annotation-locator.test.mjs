import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
await mkdir('.tools',{recursive:true});
const source=ts.transpileModule(await readFile('web/annotation-locator.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}});
await writeFile('.tools/annotation-locator-test.mjs',source.outputText);
const {blockFingerprint:hash,resolveAnnotationBlock:find}=await import(pathToFileURL(resolve('.tools/annotation-locator-test.mjs')));
const block={text:'数组长度固定，不能改变。',anchor:'数组'};
const locator={version:2,blockHash:hash(block.text),start:2,end:6};
test('locates the unchanged paragraph after earlier content is inserted or reordered',()=>{
  assert.equal(find([{text:'新增内容',anchor:'数组'},block],'数组',locator),1);
  assert.equal(find([block,{text:'其他内容',anchor:'数组'}],'数组',locator),0);
});
test('does not attach to modified text, renamed chapters or ambiguous repeats',()=>{
  assert.equal(find([{...block,text:'数组长度不固定。'}],'数组',locator),-1);
  assert.equal(find([block],'改名的章节',locator),-1);
  assert.equal(find([block,block],'数组',locator),-1);
});
test('chapter scope disambiguates identical paragraphs in separate chapters',()=>{
  assert.equal(find([{...block,anchor:'其他章节'},block],'数组',locator),1);
});
test('invalid ranges are rejected and serialized locators contain no source excerpt',()=>{
  assert.equal(find([block],'数组',{...locator,end:999}),-1);
  assert.equal(find([block],'数组',{...locator,start:-1}),-1);
  assert.ok(!JSON.stringify(locator).includes(block.text));
});
