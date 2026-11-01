import { enhanceTables } from './table-viewer';
import { setupResizablePanels } from './resizable-panels';
import { blockFingerprint, resolveAnnotationBlock, type AnnotationLocator } from './annotation-locator';
import { addCodeToolbar } from './code-toolbar';
import { outlineTree } from './outline';
import { createApp, computed, h, reactive, watch } from 'vue';
import GlobalUi from './GlobalUi.vue';
import Widgets from './Widgets.vue';
import Collection from './Collection.vue';
import Icon from './Icon.vue';
import { catalog, loadState, ui, page, library, activeHeading, requestedHeading, headings, currentPosition, restorePosition, revealAncestors, toast, saveLibrary, applyPreferences, preferences } from './state';
import type { Position } from './types';
import hljs from './highlight';
import './style.css';
import './layout.css';
import './theme.css';
import './code.css';
import './panels.css';
import './tables.css';

await loadState();
setupResizablePanels();
createApp(GlobalUi).mount('#global-ui');
for (const [id, mode] of [['header-tools', 'header'], ['article-actions', 'actions'], ['table-of-contents', 'toc'], ['continue-reading', 'continue']] as const) {
  if (document.getElementById(id)) createApp(Widgets, { mode }).mount(`#${id}`);
}
if (document.getElementById('collection')) createApp(Collection).mount('#collection');
fetch('/data/catalog.json').then(r => { if (!r.ok) throw new Error('catalog'); return r.json(); }).then(data => catalog.value = data).catch(() => toast('笔记列表加载失败，请刷新页面重试。'));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (preferences.theme === 'system') applyPreferences(); });

document.addEventListener('click', event => {
  const target = event.target as HTMLElement;
  if (target.closest('[data-toggle-sidebar]')) {
    if (matchMedia('(max-width: 960px)').matches) document.body.classList.remove('show-sidebar');
    else document.body.classList.toggle('sidebar-collapsed');
  }
  if (target.closest('[data-workspace-menu]')) document.body.classList.toggle('show-workspace');
  if (target.closest('[data-toggle-toc]')) {
    if (matchMedia('(max-width: 1100px)').matches) document.body.classList.remove('show-toc');
    else document.body.classList.toggle('toc-collapsed');
  }
  if (target.closest('.navigation-scrim')) document.body.classList.remove('show-sidebar','show-toc','show-workspace');
});
const scrim = document.createElement('button'); scrim.className='navigation-scrim'; scrim.setAttribute('aria-label','关闭目录'); document.body.append(scrim);
if (document.querySelector('.workspace-sidebar')) {
  const menu = document.createElement('button'); menu.className='workspace-menu icon-button'; menu.dataset.workspaceMenu=''; menu.setAttribute('aria-label','打开分类目录'); menu.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><use href="/media/icons.svg#menu"/></svg>'; document.querySelector('.site-header')?.prepend(menu);
}

document.addEventListener('copy', event => {
  const target = event.target as HTMLElement;
  const selection = getSelection();
  const element = selection?.anchorNode?.parentElement;
  const pre = element?.closest('pre');
  if (target.closest('input,textarea') || pre && selection?.focusNode && pre.contains(selection.focusNode)) return;
  event.preventDefault(); toast('正文不开放复制，代码请使用代码块的复制按钮。');
});

document.addEventListener('click', async event => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || link.target === '_blank') return;
  if (link.dataset.copyAnchor) {
    event.preventDefault();
    try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${encodeURIComponent(link.dataset.copyAnchor)}`); toast('章节链接已复制'); } catch { toast('浏览器未允许复制链接'); }
    return;
  }
  const target = new URL(link.href, location.href);
  if (target.origin !== location.origin) return;
  if (page.noteId && (link.closest('#note-content') || link.closest('.chapter-bookmarks')) && (target.pathname.startsWith('/read/') || target.pathname === location.pathname && target.hash)) {
    const entry = { ...currentPosition(), url: location.href, title: page.title };
    ui.returnStack.push(entry); if (ui.returnStack.length > 40) ui.returnStack.shift();
    try { sessionStorage.setItem('notes.returnStack', JSON.stringify(ui.returnStack)); } catch {}
  }
  if (target.pathname === location.pathname && target.hash) {
    const el = document.getElementById(decodeURIComponent(target.hash.slice(1)));
    revealAncestors(el);
  }
});

const floating = document.createElement('div'); floating.id = 'floating-tools'; document.body.append(floating);
const floatingState = reactive({ annotate: false, comment: '', selectionReady: false, locator: undefined as AnnotationLocator | undefined, anchor: '', start: 0, end: 0, highlightCount: 0, highlightAt: 0, stale: 0 });
createApp({
  setup() {
    const back = computed(() => ui.returnStack.at(-1));
    function goBack() {
      const item = ui.returnStack.pop(); if (!item) return;
      try { sessionStorage.setItem('notes.returnStack', JSON.stringify(ui.returnStack)); } catch {}
      if (new URL(item.url).pathname === location.pathname) {
        history.replaceState(history.state, '', item.url);
        requestedHeading.value = '';
        restorePosition(item);
      }
      else { try { sessionStorage.setItem('notes.restore', JSON.stringify(item)); } catch {} location.assign(item.url); }
    }
    function beginAnnotation() { floatingState.annotate = !floatingState.annotate; document.body.classList.toggle('annotating', floatingState.annotate); floatingState.selectionReady = false; }
    function saveAnnotation() {
      if (!floatingState.selectionReady || !floatingState.comment.trim()) { toast('请选择正文，并写下你的备注。'); return; }
      library.annotations.unshift({ id: crypto.randomUUID(), noteId: page.noteId, anchor: floatingState.anchor, start: floatingState.start, end: floatingState.end, locator: floatingState.locator, comment: floatingState.comment.trim(), at: Date.now() });
      floatingState.comment = ''; beginAnnotation(); renderAnnotations(); toast('已保存本机标注');
    }
    return () => h('div', { class: 'floating-wrap' }, [
      back.value ? h('button', { class: 'return-pill', onClick: goBack }, [h(Icon, { name: 'back', size: 16 }), '返回上一处']) : null,
      page.noteId ? h('div', { class: 'reader-floating' }, [
        h('button', { class: 'icon-button mobile-directory', 'aria-label': '打开知识目录', onClick: () => { document.body.classList.remove('show-toc'); document.body.classList.toggle('show-sidebar'); } }, [h(Icon, { name: 'folder' }),h('span','笔记列表')]),
        h('button', { class: 'icon-button mobile-directory', 'aria-label': '打开本文目录', onClick: () => { document.body.classList.remove('show-sidebar'); document.body.classList.toggle('show-toc'); } }, [h(Icon, { name: 'list' }),h('span','本文目录')]),
        h('button', { class: 'icon-button', 'aria-label': '添加标注', title: '添加标注', onClick: beginAnnotation }, h(Icon, { name: 'edit' })),
        h('button', { class: 'icon-button', 'aria-label': '返回顶部', onClick: () => scrollTo({ top: 0, behavior: 'smooth' }) }, '↑')
      ]) : null,
      floatingState.annotate ? h('div', { class: 'annotation-editor' }, [h('strong', '选择正文，留下你的想法'), h('p', floatingState.selectionReady ? '已选择内容，只保存位置和你的备注，不保存原文。' : '现在可以拖动选择需要标记的正文。'), h('textarea', { value: floatingState.comment, placeholder: '写一点自己的理解或疑问…', maxlength: 5000, onInput: (e: Event) => floatingState.comment = (e.target as HTMLTextAreaElement).value }), h('div', [h('button', { class: 'soft-button', onClick: saveAnnotation, disabled: !floatingState.selectionReady }, '保存标注'), h('button', { class: 'text-button', onClick: beginAnnotation }, '取消')])]) : null,
      floatingState.highlightCount ? h('div', { class: 'matches-toolbar' }, [h('span', `${floatingState.highlightAt + 1} / ${floatingState.highlightCount} 处匹配`), h('button', { onClick: () => jumpMatch(-1), 'aria-label': '上一个匹配' }, '↑'), h('button', { onClick: () => jumpMatch(1), 'aria-label': '下一个匹配' }, '↓'), h('button', { onClick: clearMatches, 'aria-label': '清除搜索高亮' }, '×')]) : null,
      floatingState.stale ? h('div', { class: 'stale-notice' }, `${floatingState.stale} 条批注的位置无法确认，已保留备注但未高亮。请在书架核对并重新标注。`) : null
    ]);
  }
}).mount(floating);

function splitHighlightedLines(code: HTMLElement) {
  const original = Array.from(code.childNodes);
  const lines: HTMLElement[] = [document.createElement('span')];
  lines[0].className = 'code-line';
  const visit = (node: Node, ancestors: HTMLElement[]) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const chunks = (node.textContent || '').split('\n');
      chunks.forEach((text, index) => {
        if (index) { const line = document.createElement('span'); line.className = 'code-line'; lines.push(line); }
        let parent = lines.at(-1)!;
        for (const element of ancestors) { const span = element.cloneNode(false) as HTMLElement; parent.append(span); parent = span; }
        if (text) parent.append(document.createTextNode(text));
      });
    } else if (node instanceof HTMLElement) for (const child of Array.from(node.childNodes)) visit(child, [...ancestors, node]);
  };
  original.forEach(n => visit(n, []));
  if (!lines.at(-1)!.textContent && lines.length > 1) lines.pop();
  code.replaceChildren(...lines);
}

async function enhanceContent() {
  const content = document.querySelector<HTMLElement>('#note-content'); if (!content) return;
  for (const heading of outlineTree(headings)) { const el = document.getElementById(heading.id); if (el) el.dataset.number = heading.number; }
  for (const pre of content.querySelectorAll<HTMLPreElement>('pre')) {
    const code = pre.querySelector<HTMLElement>('code'); if (!code) continue;
    const language = (code.className.match(/language-([^\s]+)/)?.[1] || 'text').toLowerCase();
    if (language === 'mermaid') {
      const figure = document.createElement('div'); figure.className = 'diagram'; figure.dataset.source = code.textContent || ''; pre.replaceWith(figure);
      const source = code.textContent || '';
      const observer = new IntersectionObserver(async entries => {
        if (!entries.some(x => x.isIntersecting)) return; observer.disconnect();
        try {
          const { default: mermaid } = await import('mermaid'); mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'neutral', suppressErrorRendering: true });
          const result = await mermaid.render(`mermaid-${crypto.randomUUID()}`, source); figure.innerHTML = result.svg;
        } catch { figure.textContent = '图表暂时无法渲染。原始定义：\n' + source; figure.classList.add('diagram-error'); }
      }, { rootMargin: '400px' }); observer.observe(figure); continue;
    }
    const raw = code.textContent || '';
    pre.classList.add('code-block'); pre.dataset.length = String(raw.trimEnd().split('\n').length);
    if (hljs.getLanguage(language)) hljs.highlightElement(code);
    else { code.classList.add('hljs'); }
    splitHighlightedLines(code);
    addCodeToolbar(pre, language, raw);
  }
  applyPreferences();
  const plain = content.textContent || '';
  if (plain.includes('$') || plain.includes('\\(') || plain.includes('\\[')) {
    try {
      const { default: renderMath } = await import('katex/contrib/auto-render');
      await import('katex/dist/katex.min.css');
      renderMath(content, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }, { left: '$', right: '$', display: false }], throwOnError: false, strict: false, trust: false });
    } catch { toast('部分公式未能渲染，已保留原文。'); }
  }
  enhanceTables(content);
  renderAnnotations();
}

function trackReading() {
  if (!page.noteId) return;
  const original = library.records[page.noteId];
  const previous = original ? { ...original } : null;
  library.records[page.noteId] = { id: page.noteId, anchor: original?.anchor || '', offset: original?.offset || 0, y: original?.y || 0, at: Date.now(), status: original?.status === 'finished' ? 'finished' : original?.manual ? original.status : 'reading', manual: original?.manual || false, progress: original?.progress || 0, visits: (original?.visits || 0) + 1 };
  const elements = headings.map(x => document.getElementById(x.id)).filter((x): x is HTMLElement => Boolean(x));
  for (const event of ['wheel','touchmove','keydown','pointerdown']) addEventListener(event, () => requestedHeading.value = '', { passive: true });
  let ticking = false;
  const update = () => {
    ticking = false;
    const content = document.getElementById('note-content'); if (!content) return;
    let current = '';
    for (const el of elements) { if (el.closest('details:not([open])') || !el.getClientRects().length) continue; if (el.getBoundingClientRect().top <= (document.querySelector('.site-header')?.getBoundingClientRect().bottom || 72) + 34) current = el.id; else break; }
    activeHeading.value = requestedHeading.value || current;
    const rect = content.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / Math.max(1, rect.height)));
    const record = library.records[page.noteId]; if (!record) return;
    Object.assign(record, currentPosition(), { progress });
    // Reading state is a heuristic. A manual choice is never overwritten.
    if (!record.manual && progress >= .98 && performance.now() > 15000 && document.visibilityState === 'visible') record.status = 'finished';
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  setInterval(() => { if (document.visibilityState === 'visible') update(); }, 5000);
  let restore: Position | undefined;
  try {
    const item = sessionStorage.getItem('notes.restore');
    if (item) { restore = JSON.parse(item); sessionStorage.removeItem('notes.restore'); }
    if (sessionStorage.getItem('notes.resume') === page.noteId) { restore = previous || undefined; sessionStorage.removeItem('notes.resume'); }
  } catch {}
  if (restore) requestAnimationFrame(() => requestAnimationFrame(() => restorePosition(restore!)));
  else if (location.hash) requestAnimationFrame(() => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    revealAncestors(target); target?.scrollIntoView();
  });
  else if (previous && previous.y > 300) {
    const notice = document.createElement('div'); notice.className = 'resume-notice';
    const text = document.createElement('span'); text.textContent = '上次读到这里，还要接着看吗？';
    const button = document.createElement('button'); button.textContent = '继续阅读 →'; button.onclick = () => { restorePosition(previous); notice.remove(); };
    const close = document.createElement('button'); close.textContent = '×'; close.setAttribute('aria-label','关闭继续阅读提示'); close.onclick = () => notice.remove();
    notice.append(text, button, close); document.querySelector('.article-heading')?.append(notice);
  }
  update();
  const sidebar = document.getElementById('reader-sidebar');
  if (sidebar) {
    try {
      const saved = JSON.parse(sessionStorage.getItem('notes.sidebar') || '{}');
      sidebar.scrollTop = saved.scroll || 0;
      sidebar.querySelectorAll<HTMLDetailsElement>('details').forEach((d,i) => { if (!d.querySelector('.current') && saved.open) d.open = Boolean(saved.open[i]); });
    } catch {}
    window.addEventListener('pagehide', () => { try { sessionStorage.setItem('notes.sidebar', JSON.stringify({ scroll: sidebar.scrollTop, open: Array.from(sidebar.querySelectorAll('details')).map(d => d.open) })); } catch {} });
  }
}

function annotationBlocks(content:HTMLElement) {
  return Array.from(content.querySelectorAll<HTMLElement>('p,li,h2,h3,h4,h5,h6')).filter(el=>!el.closest('pre,.katex,.diagram,.code-toolbar') && !(el.tagName==='LI' && el.querySelector('p,li')));
}
function annotationAnchor(block:HTMLElement) {
  let anchor='';
  for(const heading of document.querySelectorAll<HTMLElement>('#note-content h1,#note-content h2,#note-content h3,#note-content h4,#note-content h5,#note-content h6')) {
    if(heading===block || heading.compareDocumentPosition(block)&Node.DOCUMENT_POSITION_FOLLOWING)anchor=heading.id;
  }
  return anchor;
}
function blockTextNodes(block:HTMLElement) {
  const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.parentElement?.closest('.heading-link,.katex,.diagram,.code-toolbar')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes:Text[]=[];while(walker.nextNode())nodes.push(walker.currentNode as Text);return nodes;
}
document.addEventListener('selectionchange',()=>{
  if(!floatingState.annotate)return;
  const selection=getSelection();if(!selection?.rangeCount||selection.isCollapsed)return;
  const range=selection.getRangeAt(0);const content=document.getElementById('note-content');if(!content)return;
  if(!content.contains(range.startContainer)||!content.contains(range.endContainer))return;
  floatingState.selectionReady=false;floatingState.locator=undefined;
  const block=annotationBlocks(content).find(el=>el.contains(range.startContainer)&&el.contains(range.endContainer));
  if(!block || range.startContainer.parentElement?.closest('.katex,pre,.heading-link') || range.endContainer.parentElement?.closest('.katex,pre,.heading-link'))return;
  const nodes=blockTextNodes(block);if(!nodes.includes(range.startContainer as Text)||!nodes.includes(range.endContainer as Text))return;
  let at=0,start=-1,end=-1;
  for(const node of nodes){if(node===range.startContainer)start=at+range.startOffset;if(node===range.endContainer)end=at+range.endOffset;at+=node.length;}
  if(start<0||end<=start)return;
  floatingState.anchor=annotationAnchor(block);floatingState.start=start;floatingState.end=end;
  floatingState.locator={version:2,blockHash:blockFingerprint(nodes.map(n=>n.data).join('')),start,end};floatingState.selectionReady=true;
});
function renderAnnotations(){
  const content=document.getElementById('note-content');if(!content)return;
  content.querySelectorAll('mark.personal-highlight').forEach(m=>m.replaceWith(...Array.from(m.childNodes)));content.normalize();
  const blocks=annotationBlocks(content);const descriptors=blocks.map(block=>({text:blockTextNodes(block).map(n=>n.data).join(''),anchor:annotationAnchor(block)}));
  let stale=0;
  for(const annotation of library.annotations.filter(a=>a.noteId===page.noteId)){
    if(!annotation.locator){stale++;continue;}
    const index=resolveAnnotationBlock(descriptors,annotation.anchor,annotation.locator);if(index<0){stale++;continue;}
    const nodes=blockTextNodes(blocks[index]);const pieces:Array<{node:Text;start:number;end:number}>=[];let at=0;
    for(const node of nodes){const start=Math.max(0,annotation.locator.start-at);const end=Math.min(node.length,annotation.locator.end-at);if(end>start)pieces.push({node,start,end});at+=node.length;}
    // Wrap individual text fragments so partial bold / code selections remain valid HTML.
    for(const piece of pieces.reverse()){
      const selected=piece.node.splitText(piece.start);selected.splitText(piece.end-piece.start);
      const mark=document.createElement('mark');mark.className='personal-highlight';mark.title=annotation.comment;
      selected.replaceWith(mark);mark.append(selected);
    }
  }
  floatingState.stale=stale;
}

let matches: HTMLElement[] = [];
function clearMatches() {
  document.querySelectorAll('mark.search-match').forEach(mark => mark.replaceWith(...Array.from(mark.childNodes)));
  document.getElementById('note-content')?.normalize(); matches = []; floatingState.highlightCount = 0;
}
function jumpMatch(delta: number) {
  if (!matches.length) return;
  matches[floatingState.highlightAt]?.classList.remove('current-match');
  floatingState.highlightAt = (floatingState.highlightAt + delta + matches.length) % matches.length;
  const mark = matches[floatingState.highlightAt]; mark.classList.add('current-match');
  for (let p = mark.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true;
  mark.scrollIntoView({ block: 'center' });
}
function highlightQuery() {
  const query = new URL(location.href).searchParams.get('q'); const content = document.getElementById('note-content');
  if (!query || !content) return;
  const words = query.trim().split(/\s+/).filter(Boolean).map(x => x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')); if (!words.length) return;
  const regex = new RegExp(`(${words.join('|')})`,'gi');
  const walker = document.createTreeWalker(content,NodeFilter.SHOW_TEXT,{acceptNode: node => node.parentElement?.closest('.katex,.diagram,.code-toolbar,.heading-link,mark') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
  const nodes: Text[] = []; while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const text = node.textContent || ''; regex.lastIndex = 0; if (!regex.test(text)) continue;
    const fragment = document.createDocumentFragment();
    text.split(regex).forEach((part,i) => { if (i % 2) { const mark = document.createElement('mark'); mark.className = 'search-match'; mark.textContent = part; fragment.append(mark); } else fragment.append(document.createTextNode(part)); });
    node.replaceWith(fragment);
  }
  matches = Array.from(content.querySelectorAll<HTMLElement>('mark.search-match')); floatingState.highlightCount = matches.length;
  const anchor = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (anchor) {
    const first = matches.findIndex(m => Boolean(anchor.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING));
    floatingState.highlightAt = Math.max(0,first);
  }
  if (matches.length) jumpMatch(0);
}

if (page.noteId) {
  await enhanceContent(); trackReading(); highlightQuery();
  document.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (document.body.classList.contains('show-sidebar') && !target.closest('#reader-sidebar,.reader-floating')) document.body.classList.remove('show-sidebar');
    if (document.body.classList.contains('show-toc') && !target.closest('.reader-toc,.reader-floating')) document.body.classList.remove('show-toc');
  });
}
