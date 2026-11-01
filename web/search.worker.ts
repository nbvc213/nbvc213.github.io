/// <reference lib="webworker" />
import type { SearchSection } from './types';
const indexes = new Map<string,Promise<SearchSection[]>>();
let manifest: Promise<Array<{ folder: string; url: string }>> | undefined;
async function loadIndex(folder: string) {
  manifest ||= fetch('/data/search-manifest.json').then(r => { if (!r.ok) throw new Error('manifest'); return r.json(); });
  const parts = (await manifest).filter(p => !folder || p.folder === folder);
  return (await Promise.all(parts.map(part => {
    if (!indexes.has(part.folder)) indexes.set(part.folder,fetch(part.url).then(r => { if (!r.ok) throw new Error('index'); return r.json(); }).catch(error => { indexes.delete(part.folder); throw error; }));
    return indexes.get(part.folder)!;
  }))).flat();
}
const normalize = (s: string) => s.normalize('NFKC').toLocaleLowerCase();
self.onmessage = async (event: MessageEvent<{ id: number; query: string; folder: string; noteId: string }>) => {
  const { id, query, folder, noteId } = event.data;
  try {
    const index = await loadIndex(folder);
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    if (!terms.length) { self.postMessage({ id, results: [], total: 0 }); return; }
    const hits: SearchSection[] = [];
    for (const section of index) {
      if (folder && section.folder !== folder || noteId && section.noteId !== noteId) continue;
      const title = normalize(section.title), heading = normalize(section.section), body = normalize(section.body), tags = normalize(section.tags.join(' '));
      if (!terms.every(t => title.includes(t) || heading.includes(t) || body.includes(t) || tags.includes(t))) continue;
      const score = terms.reduce((sum, t) => sum + (title.includes(t) ? 24 : 0) + (heading.includes(t) ? 40 : 0) + (tags.includes(t) ? 12 : 0) + (body.includes(t) ? 4 : 0), 0);
      const position = body.indexOf(terms[0]); const start = Math.max(0, position - 45);
      hits.push({ ...section, body: '', score, excerpt: (start > 0 ? '…' : '') + section.body.slice(start, start + 175) + (start + 175 < section.body.length ? '…' : '') });
    }
    hits.sort((a, b) => b.score! - a.score!);
    self.postMessage({ id, results: hits.slice(0, 80), total: hits.length });
  } catch { manifest = undefined; self.postMessage({ id, error: '搜索索引加载失败，请检查网络后重试。' }); }
};
