import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import vm from 'node:vm';
const root = resolve('dist');
const catalog = JSON.parse(await readFile(resolve(root, 'data/catalog.json'), 'utf8'));
const parts = JSON.parse(await readFile(resolve(root, 'data/search-manifest.json'), 'utf8'));
const search = (await Promise.all(parts.map(async p => JSON.parse(await readFile(resolve(root, '.' + p.url), 'utf8'))))).flat();
assert.ok(catalog.notes.length > 0, 'site must contain published notes');
assert.ok(catalog.folders.length > 0, 'site must define folders');
for (const folder of catalog.folders) assert.equal(folder.count, catalog.notes.filter(n => n.folder === folder.id).length, `incorrect count for ${folder.id}`);
assert.equal(catalog.folders.reduce((sum, f) => sum + f.count, 0), catalog.notes.length, 'every note must belong to a configured folder');
const idSet = new Set(catalog.notes.map(x => x.id));
assert.equal(idSet.size, catalog.notes.length, 'note IDs must be unique');
const pages = [];
async function walk(dir) { for (const item of await readdir(dir, { withFileTypes: true })) { const p = resolve(dir,item.name); if (item.isDirectory()) await walk(p); else if (item.name.endsWith('.html')) pages.push(p); } }
await walk(root);
const invalid = [], badAnchors = [], unsafe = [];
const htmlCache = new Map();
for (const file of pages) htmlCache.set(file, await readFile(file, 'utf8'));
const decode = s => { try { return decodeURIComponent(s); } catch { return s; } };
for (const [file, html] of htmlCache) {
  const elements = [];
  function visit(node) { if (node.tagName) elements.push(node); for (const child of node.childNodes || []) visit(child); }
  visit(parse(html));
  const attribute = (el, name) => el.attrs?.find(a => a.name === name)?.value;
  const localIds = elements.map(el => attribute(el,'id')).filter(Boolean);
  assert.equal(new Set(localIds).size, localIds.length, `duplicate DOM id in ${file}`);
  if (elements.some(el => el.attrs?.some(a => /^on[a-z]+$/i.test(a.name)) || el.tagName === 'script' && !attribute(el, 'src') && attribute(el, 'type') !== 'application/json' && /alert\(|eval\(/.test((el.childNodes || []).map(n => n.value || '').join('')))) unsafe.push(file);
  const urls = elements.flatMap(el => [attribute(el,'href'), attribute(el,'src')].filter(Boolean));
  for (let url of urls) {
    if (/^(?:https?:|mailto:|data:)/.test(url)) continue;
    // UI links can include a selected bookshelf tab; queries are not file names.
    const parsed = new URL(url, 'https://notes.local' + file.slice(root.length).replaceAll('\\', '/'));
    const pathname = parsed.pathname;
    const hash = parsed.hash.slice(1);
    let target = pathname ? resolve(pathname.startsWith('/') ? root : dirname(file), '.' + (pathname.startsWith('/') ? decode(pathname) : '/' + decode(pathname))) : file;
    if (pathname.endsWith('/') || target === root) target = resolve(target,'index.html');
    try { await stat(target); } catch { invalid.push({ file: file.slice(root.length), url }); continue; }
    if (hash && htmlCache.has(target) && !htmlCache.get(target).includes(`id="${decode(hash)}"`)) badAnchors.push({ file: file.slice(root.length), url });
  }
}
assert.equal(unsafe.length, 0, 'unsafe inline event handlers/scripts');
assert.equal(invalid.length,0,JSON.stringify(invalid.slice(0,20)));
assert.equal(badAnchors.length,0,JSON.stringify(badAnchors.slice(0,20)));
for (const item of search) {
  assert.ok(idSet.has(item.noteId));
  const file = resolve(root, '.' + item.url.split('#')[0], 'index.html');
  assert.ok(htmlCache.has(file));
  assert.ok(!item.anchor || htmlCache.get(file).includes(`id="${item.anchor}"`));
}
assert.ok(search.some(s => s.noteId === 'java-02' && s.section.includes('CLASSPATH')), 'inline code in heading must be searchable');
for (const item of JSON.parse(await readFile('config/migration.json','utf8'))) {
  const file = resolve(root,'.'+item.legacyUrl);
  assert.ok((await readFile(file,'utf8')).includes(`/read/${item.id}/`));
}
const reader = await readFile(resolve(root,'read/java-10/index.html'),'utf8');
const neighbors = reader.match(/<nav class="neighbor-notes"[\s\S]*?<\/nav>/)?.[0] || '';
assert.ok(neighbors.includes('/read/java-09/') && neighbors.includes('/read/java-11/'), 'next and previous chapters must stay in the same topic');
for (const name of await readdir(resolve(root,'assets'))) {
  if (!name.endsWith('.css')) continue;
  const css = await readFile(resolve(root,'assets',name),'utf8');
  for (const m of css.matchAll(/url\((?:"([^"]+)"|'([^']+)'|([^)]*))\)/g)) {
    const url = m[1] || m[2] || m[3];
    if (/^(data:|https?:|#)/.test(url)) continue;
    await stat(resolve(url.startsWith('/') ? root : resolve(root,'assets'), '.' + (url.startsWith('/') ? url : '/' + url)));
  }
}
const app = await readFile(resolve(root,'assets/app.js'),'utf8');
const workerUrl = app.match(/\/assets\/assets\/search\.worker-[\w-]+\.js/)?.[0];
assert.ok(workerUrl,'built app must reference a search worker');
let workerResult;
const self = { onmessage: null, postMessage: result => { workerResult = result; } };
const context = vm.createContext({ self, fetch: async url => ({ ok: true, json: async () => JSON.parse(await readFile(resolve(root,'.'+url),'utf8')) }) });
vm.runInContext(await readFile(resolve(root,'.'+workerUrl),'utf8'),context);
await self.onmessage({ data: { id: 1, query: 'CLASSPATH', folder: 'java', noteId: 'java-02' } });
assert.ok(workerResult.results.length > 0 && workerResult.results.every(r => r.noteId === 'java-02'));
assert.ok(workerResult.results.some(r => r.section.includes('CLASSPATH')));
await self.onmessage({ data: { id: 2, query: '风险管理', folder: 'banking', noteId: '' } });
assert.ok(workerResult.results.length > 0 && workerResult.results.every(r => r.folder === 'banking'));
console.log(`Verified ${catalog.notes.length} notes, ${search.length} searchable sections, ${pages.length} pages; local links, assets and anchors resolve.`);
console.log('Built search worker verified for Chinese queries, code identifiers and note/topic scopes.');

const callouts = await readFile(resolve(root,'read/syntax-callouts/index.html'),'utf8');
for (const type of ['note','supplement','warning','conclusion','exercise','example']) assert.ok(callouts.includes('callout-'+type),type);
assert.equal((callouts.match(/class="answer-block"/g)||[]).length,3);
assert.ok(callouts.includes('href="/read/syntax-code/#关联返回测试"'));
const basics = await readFile(resolve(root,'read/syntax-basics/index.html'),'utf8');
assert.ok(basics.includes('<strong>数组长度一旦确定，就不能改变。</strong>'));
console.log('Syntax fixtures: six callout types, isolated answers, Chinese bold and relative links verified.');

const nestedChapter = search.find(s => s.noteId === 'syntax-basics' && s.anchor === '折叠区域里的章节');
assert.ok(nestedChapter?.body.includes('层叠定位样例'), 'nested headings need their own searchable section');
await self.onmessage({ data: { id: 3, query: '层叠定位样例', folder: 'examples', noteId: 'syntax-basics' } });
assert.ok(workerResult.results.some(r => r.anchor === '折叠区域里的章节'), 'worker must return the nested chapter anchor');
console.log('Nested details chapter index and search destination verified.');

assert.ok(callouts.includes('class="content-details-heading"'));
assert.ok(callouts.includes('class="when-closed">展开</span>'));
assert.ok(callouts.includes('class="when-open">收起</span>'));
console.log('Supplement/example header toggles verified.');

assert.ok(callouts.includes('class="content-details-arrow"'));

assert.ok(callouts.includes('class="callout-title">内层练习</span>'));
assert.ok(callouts.includes('外层结尾不应被移入内层答案'));
