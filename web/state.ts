import { decodePersonalBackup } from './personal-data';
import { reactive, ref, watch } from 'vue';
import type { Catalog, Heading, Library, Page, Position, ReadingStatus } from './types';
import { codePalette, tokenLabels } from './code-theme';

export const page: Page = JSON.parse(document.querySelector('#page-data')?.textContent || '{}');
export const headings: Heading[] = JSON.parse(document.querySelector('#toc-data')?.textContent || '[]');
export const catalog = ref<Catalog>({ notes: [], folders: [] });
export const activeHeading = ref('');
export const requestedHeading = ref('');
export const ui = reactive({ search: false, settings: false, mobileToc: false, focus: false, toast: '', query: '', returnStack: [] as Array<Position & { url: string; title: string }> });
export const defaults = { leftPanelWidth:220, rightPanelWidth:224, codeTheme:'auto', codeColors:{} as Record<string,string>, codeLineHeight:1.55, codeCollapsedLines:25, accent: 'ocean', numberedHeadings: false, headingSpace: 32, codeOffset: 2, theme: 'system', size: 18, lineHeight: 1.8, width: 760, textEn: 'system', textZh: 'system', codeEn: 'system', codeZh: 'system', lines: false, wrap: false, tocDepth: 3, answers: false, examples: true, extras: true, longCode: true };
export type Preferences = typeof defaults;
let initial = {};
try { initial = JSON.parse(localStorage.getItem('notes.preferences') || '{}'); } catch { /* fall back to defaults */ }
export const preferences = reactive<Preferences>({ ...defaults, ...initial });
if (preferences.codeEn === 'mono') preferences.codeEn = 'system';
const cleanLibrary = (): Library => ({ version: 1, records: {}, bookmarks: [], annotations: [] });
export const library = reactive<Library>(cleanLibrary());
let database: IDBDatabase | undefined;
export const storageAvailable = ref(true);
let saveTimer: ReturnType<typeof setTimeout>;
let toastTimer: ReturnType<typeof setTimeout>;
export function toast(message: string) { ui.toast = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => ui.toast = '', 3300); }

export async function loadState() {
  try {
    database = await new Promise<IDBDatabase>((ok, fail) => {
      const req = indexedDB.open('nbvc213-notes', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('personal');
      req.onsuccess = () => ok(req.result); req.onerror = () => fail(req.error);
      req.onblocked = () => fail(new Error('storage blocked'));
    });
    const data = await new Promise<Library | undefined>((ok, fail) => {
      const req = database!.transaction('personal').objectStore('personal').get('library');
      req.onsuccess = () => ok(req.result); req.onerror = () => fail(req.error);
    });
    if (data?.version === 1) Object.assign(library, data);
  } catch { storageAvailable.value = false; }
  // A synchronous journal protects the last interaction during a fast navigation.
  try {
    const pending = JSON.parse(localStorage.getItem('notes.pendingLibrary') || 'null');
    if (pending?.version === 1) Object.assign(library, pending);
  } catch { /* IndexedDB remains the main store */ }
  try { ui.returnStack = JSON.parse(sessionStorage.getItem('notes.returnStack') || '[]'); } catch { /* tab-local history only */ }
  watch(library, () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveLibrary, 250); }, { deep: true });
  applyPreferences();
  watch(preferences, () => {
    applyPreferences();
    try { localStorage.setItem('notes.preferences', JSON.stringify(preferences)); } catch { storageAvailable.value = false; }
  }, { deep: true });
  window.addEventListener('pagehide', saveLibrary);
}

export function saveLibrary() {
  const snapshot = JSON.stringify(library);
  try { localStorage.setItem('notes.pendingLibrary', snapshot); } catch { /* best-effort navigation journal */ }
  if (!database) return;
  try {
    const tx = database.transaction('personal', 'readwrite');
    tx.objectStore('personal').put(JSON.parse(snapshot), 'library');
    tx.oncomplete = () => {
      try { if (localStorage.getItem('notes.pendingLibrary') === snapshot) localStorage.removeItem('notes.pendingLibrary'); } catch {}
    };
    tx.onerror = () => { storageAvailable.value = false; toast('本机存储不可用，请备份阅读记录。'); };
  } catch { storageAvailable.value = false; }
}

const appliedDetails = new WeakMap<HTMLDetailsElement, boolean>();
const appliedCode = new WeakMap<HTMLElement, {lines:boolean;wrap:boolean;longCode:boolean;limit:number}>();
export function applyPreferences() {
  const html = document.documentElement;
  html.dataset.theme = preferences.theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : preferences.theme;
  html.dataset.accent = preferences.accent;
  html.dataset.numbered = String(preferences.numberedHeadings);
  html.style.setProperty('--heading-space', `${preferences.headingSpace}px`);
  html.style.setProperty('--code-size', `${Math.max(10,preferences.size-preferences.codeOffset)}px`);
  html.style.setProperty('--code-leading', String(preferences.codeLineHeight));
  html.style.setProperty('--code-collapsed-lines', String(preferences.codeCollapsedLines));
  for (const [key,value] of Object.entries(codePalette(preferences.codeTheme,preferences.codeColors,html.dataset.theme==='dark'))) html.style.setProperty(`--syntax-${key}`,value);
  html.dataset.lines = String(preferences.lines); html.dataset.wrap = String(preferences.wrap);
  html.style.setProperty('--reading-size', `${preferences.size}px`);
  html.style.setProperty('--reading-leading', String(preferences.lineHeight));
  html.style.setProperty('--reading-width', `${preferences.width}px`);
  const fontMap: Record<string, string> = {
    system: 'system-ui, -apple-system, BlinkMacSystemFont', serif: 'Georgia, "Times New Roman"',
    sans: 'Arial, Helvetica', song: '"Songti SC", SimSun', hei: '"Microsoft YaHei", "PingFang SC"',
    mono: 'Consolas, "SFMono-Regular", monospace', noto: '"Noto Sans SC"',
    lora: '"Lora"', jetbrains: '"JetBrains Mono"'
  };
  for (const slot of ['textEn', 'textZh', 'codeEn', 'codeZh'] as const) {
    const font = preferences[slot] === 'system' && slot.endsWith('En') ? (slot === 'codeEn' ? 'Consolas, "Notes Latin System", monospace' : '"Notes Latin System"') : fontMap[preferences[slot]] || fontMap.system;
    html.style.setProperty(`--font-${slot}`, font);
  }
  document.querySelectorAll<HTMLDetailsElement>('details[data-kind]').forEach(d => {
    const kind = d.dataset.kind;
    const open = kind === 'answer' ? preferences.answers : kind === 'example' ? preferences.examples : preferences.extras;
    if (!appliedDetails.has(d) || appliedDetails.get(d) !== open) d.open = open;
    appliedDetails.set(d, open);
  });
  document.querySelectorAll<HTMLElement>('.code-block').forEach(p => {
    const previous = appliedCode.get(p);
    if (!previous || previous.lines !== preferences.lines) p.dataset.lines = String(preferences.lines);
    if (!previous || previous.wrap !== preferences.wrap) p.dataset.wrap = String(preferences.wrap);
    if (!previous || previous.longCode !== preferences.longCode || (!preferences.longCode && previous.limit !== preferences.codeCollapsedLines)) p.classList.toggle('code-collapsed', !preferences.longCode && Number(p.dataset.length) > preferences.codeCollapsedLines);
    appliedCode.set(p,{lines:preferences.lines,wrap:preferences.wrap,longCode:preferences.longCode,limit:preferences.codeCollapsedLines});
  });
}

export function currentPosition(): Position {
  const anchor = activeHeading.value;
  const target = anchor ? document.getElementById(anchor) : null;
  return { id: page.noteId, anchor, offset: target ? -target.getBoundingClientRect().top + 95 : 0, y: scrollY, at: Date.now() };
}
export function toggleBookmark(noteId: string, anchor = '', title?: string) {
  const key = `${noteId}#${anchor}`;
  const at = library.bookmarks.findIndex(b => b.key === key);
  if (at >= 0) { library.bookmarks.splice(at, 1); toast('已移出收藏'); }
  else {
    library.bookmarks.unshift({ key, noteId, anchor, title: title || catalog.value.notes.find(n => n.id === noteId)?.title || '', at: Date.now() });
    toast(anchor ? '已收藏这一节' : '已收藏这篇笔记');
  }
  saveLibrary();
}
export function setReadingStatus(id: string, status: ReadingStatus, manual = true) {
  const record = library.records[id];
  if (record) { record.status = status; record.manual = manual; saveLibrary(); }
}
export function revealAncestors(target: HTMLElement | null) {
  for (let parent = target; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) parent.open = true;
  }
}
export function restorePosition(position: Position) {
  const target = position.anchor ? document.getElementById(position.anchor) : null;
  revealAncestors(target);
  const top = target ? scrollY + target.getBoundingClientRect().top - 95 + position.offset : position.y;
  scrollTo({ top: Math.max(0, top), behavior: 'instant' });
}
export function resetPersonalData(kind: 'records' | 'bookmarks' | 'annotations' | 'all') {
  if (kind === 'all') { Object.assign(library, cleanLibrary()); Object.assign(preferences, defaults); }
  else if (kind === 'records') library.records = {};
  else library[kind] = [];
  saveLibrary(); toast('已清除所选本机记录');
}
export function exportPersonalData() {
  const value = JSON.stringify({ format: 'nbvc213-personal-data', version: 1, preferences, library }, null, 2);
  const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `notes-personal-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
}
export async function importPersonalData(file: File) {
  if (file.size > 8 * 1024 * 1024) throw new Error('备份文件过大');
  let parsed:unknown;
  try { parsed=JSON.parse(await file.text()); } catch { throw new Error('备份文件不是有效的 JSON，请选择原始备份文件。'); }
  // Decode and normalize all entries before mutating current browser records.
  const data=decodePersonalBackup(parsed);
  const next:Library=JSON.parse(JSON.stringify(library));
  for(const b of data.library.bookmarks) if(!next.bookmarks.some(x=>x.key===b.key))next.bookmarks.push(b);
  for(const [id,item] of Object.entries(data.library.records)) if(!Object.hasOwn(next.records,id) || item.at>next.records[id].at)next.records[id]=item;
  for(const a of data.library.annotations) if(!next.annotations.some(x=>x.id===a.id))next.annotations.push(a);
  Object.assign(library,next);
  const incoming = data.preferences;
  if (incoming && typeof incoming === 'object') {
    if (['forest','ocean','violet','amber','rose','slate'].includes(incoming.accent)) preferences.accent = incoming.accent;
    if (['light','dark','system'].includes(incoming.theme)) preferences.theme = incoming.theme;
    if (['auto','light','dark','night'].includes(incoming.codeTheme)) preferences.codeTheme=incoming.codeTheme;
    if (incoming.codeColors && typeof incoming.codeColors==='object') {const colors:Record<string,string>={};for(const key of Object.keys(tokenLabels)) if(typeof incoming.codeColors[key]==='string' && /^#[0-9a-f]{6}$/i.test(incoming.codeColors[key])) colors[key]=incoming.codeColors[key];preferences.codeColors=colors;}
    for (const [key,min,max] of [['leftPanelWidth',180,360],['rightPanelWidth',180,360],['codeCollapsedLines',10,60],['codeLineHeight',1.2,2],['headingSpace',0,80],['codeOffset',1,4],['size',14,24],['lineHeight',1.5,2.4],['width',620,1000],['tocDepth',2,6]] as const) {
      if (typeof incoming[key] === 'number' && Number.isFinite(incoming[key])) preferences[key] = Math.max(min,Math.min(max,incoming[key]));
    }
    for (const key of ['numberedHeadings','lines','wrap','answers','examples','extras','longCode'] as const) if (typeof incoming[key] === 'boolean') preferences[key] = incoming[key];
    for (const key of ['textEn','textZh','codeEn','codeZh'] as const) if (['system','serif','sans','song','hei','mono','noto','lora','jetbrains'].includes(incoming[key])) preferences[key] = key === 'codeEn' && incoming[key] === 'mono' ? 'system' : incoming[key];
  }
  preferences.codeCollapsedLines = Math.round(preferences.codeCollapsedLines);
  saveLibrary(); toast(data.skipped ? `已合并有效记录，跳过 ${data.skipped} 条无效记录` : '已合并导入阅读记录');
}
