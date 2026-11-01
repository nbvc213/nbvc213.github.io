import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
await mkdir('.tools',{recursive:true});
const compiled=ts.transpileModule(await readFile('web/personal-data.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}});
await writeFile('.tools/personal-data-test.mjs',compiled.outputText);
const {decodePersonalBackup:decode}=await import(pathToFileURL(resolve('.tools/personal-data-test.mjs')));
const backup=()=>({format:'nbvc213-personal-data',version:1,library:{records:{},bookmarks:[],annotations:[]}});
test('rejects invalid structure before producing importable data',()=>{
  for(const value of [null,[],{}, {...backup(),library:{records:null,bookmarks:[],annotations:[]}}]) assert.throws(()=>decode(value),/有效/);
});
test('skips corrupt entries without losing valid records or mutating the input',()=>{
  const data=backup();data.library.bookmarks=[null,{noteId:'java-02',anchor:'硬件',title:'硬件',body:'must not import'},17];
  data.library.records={'java-02':{status:'reading',progress:4,y:-20,offset:Infinity,manual:'false',at:100},bad:null};
  data.library.annotations=[null,{noteId:'java-02',id:'a',start:8,end:3,comment:'invalid'}];
  const result=decode(data);assert.equal(result.skipped,5);assert.equal(result.library.bookmarks.length,1);
  assert.equal(result.library.records['java-02'].progress,1);assert.equal(result.library.records['java-02'].y,0);assert.equal(result.library.records['java-02'].offset,0);assert.equal(result.library.records['java-02'].manual,false);
  assert.equal(result.library.bookmarks[0].body,undefined);assert.equal(data.library.bookmarks[1].body,'must not import');
});
test('deduplicates bookmarks and annotations and rejects reserved record keys',()=>{
  const data=backup();const bookmark={noteId:'java-02',anchor:'',title:'Java'};data.library.bookmarks=[bookmark,bookmark];
  const annotation={noteId:'java-02',id:'note-a',start:1,end:3,comment:'备注'};data.library.annotations=[annotation,annotation];
  data.library.records=JSON.parse('{"__proto__":{"status":"reading"},"constructor":{"status":"reading"}}');
  const result=decode(data);assert.equal(result.library.bookmarks.length,1);assert.equal(result.library.annotations.length,1);assert.equal(Object.keys(result.library.records).length,0);
});
test('keeps new location metadata in backups and rejects malformed locators',()=>{
  const data=backup();const locator={version:2,blockHash:'12-0123456789abcdef',start:1,end:3};
  data.library.annotations=[{noteId:'java-02',id:'new',start:1,end:3,comment:'备注',locator},{noteId:'java-02',id:'bad',start:1,end:3,comment:'备注',locator:{...locator,version:99}}];
  const result=decode(data);assert.equal(result.skipped,1);assert.deepEqual(result.library.annotations[0].locator,locator);
});
