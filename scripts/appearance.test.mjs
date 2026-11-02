import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script=readFileSync(new URL('../public/media/reading-preferences.js',import.meta.url),'utf8');
function boot(saved){const props={};const html={dataset:{},style:{setProperty:(k,v)=>props[k]=v}};const context={window:{},document:{documentElement:html},localStorage:{getItem:()=>saved},matchMedia:()=>({matches:false})};vm.runInNewContext(script,context);return {context,props,html};}
test('saved typography and syntax apply before the application starts, using the same runtime function',()=>{
 const {context,props,html}=boot(JSON.stringify({size:23,lineHeight:2,textEn:'times',numberedHeadings:true,theme:'dark',codeColors:{keyword:'#112233'}}));
 assert.equal(props['--reading-size'],'23px');assert.equal(props['--font-textEn'],'"Tinos"');assert.equal(props['--syntax-keyword'],'#112233');assert.equal(html.dataset.numbered,'true');
 context.window.notesAppearance({size:18});assert.equal(props['--reading-size'],'18px');assert.equal(html.dataset.theme,'light');
});
test('corrupt saved settings fall back to a readable page',()=>{for(const saved of ['{broken','null']){const {props,html}=boot(saved);assert.equal(props['--reading-size'],'18px');assert.equal(html.dataset.accent,'ocean');}});

test('saved sidebar widths apply before application startup and fit narrow desktops',()=>{
 const {props}=boot(JSON.stringify({leftPanelWidth:310,rightPanelWidth:270}));
 assert.equal(props['--reader-left-width'],'310px');assert.equal(props['--reader-right-width'],'270px');
});

test('selected font families and legacy names resolve to the bundled replacements',()=>{
 const choices={noto:'Noto Sans SC Variable',song:'Noto Serif SC Variable',arimo:'Arimo Variable',tinos:'Tinos',gelasio:'Gelasio Variable',lora:'Lora Variable',courier:'Courier Prime',jetbrains:'JetBrains Mono Variable',sans:'Arimo Variable',times:'Tinos',serif:'Gelasio Variable'};
 for(const [key,family] of Object.entries(choices)) {
  const {props}=boot(JSON.stringify({textEn:key,codeEn:key}));
  assert.equal(props['--font-textEn'],'"'+family+'"');assert.equal(props['--font-codeEn'],'"'+family+'"');
 }
});
