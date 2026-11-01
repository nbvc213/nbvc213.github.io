<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import Icon from './Icon.vue';
import { codePalette, tokenLabels } from './code-theme';
import { ui, preferences as p, defaults, catalog, page, toast, storageAvailable } from './state';
import type { SearchSection } from './types';
const dialog = ref<HTMLDialogElement>();
const settings = ref<HTMLDialogElement>();
const query = ref('');
const folder = ref('');
const inArticle = ref(false);
const restoredNoteId = ref('');
const restoredFolderId = ref('');
const results = ref<SearchSection[]>([]);
const loading = ref(false);
const error = ref('');
const total = ref(0);
const selected = ref(0);
const input = ref<HTMLInputElement>();
const list = ref<HTMLElement>();
const pendingScroll = ref(0);
const zoom = ref('');
const settingsTab = ref('appearance');
const syntaxPalette = computed(()=>codePalette(p.codeTheme,p.codeColors,p.theme==='dark' || (p.theme==='system' && matchMedia('(prefers-color-scheme: dark)').matches)));
function setSyntaxColor(key:string,event:Event){p.codeColors={...p.codeColors,[key]:(event.target as HTMLInputElement).value};}
let worker: Worker | undefined;
let serial = 0;
let timer: ReturnType<typeof setTimeout>;
let lastSearchFocus: HTMLElement | null = null;
let lastSettingsFocus: HTMLElement | null = null;
const terms = computed(() => query.value.trim().split(/\s+/).filter(Boolean));
function highlighted(s: string) {
  const tokens = terms.value.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!tokens.length) return [{ text: s, mark: false }];
  return s.split(new RegExp(`(${tokens.join('|')})`, 'gi')).filter(Boolean).map(text => ({ text, mark: terms.value.some(t => t.toLowerCase() === text.toLowerCase()) }));
}
function search() {
  clearTimeout(timer);
  serial++;
  if (!query.value.trim()) { results.value = []; total.value = 0; loading.value = false; return; }
  loading.value = true; error.value = '';
  timer = setTimeout(() => {
    worker ||= new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = event => {
      if (event.data.id !== serial) return;
      loading.value = false; error.value = event.data.error || ''; results.value = event.data.results || []; total.value = event.data.total || 0; selected.value = 0;
      if (pendingScroll.value) nextTick(() => { if (list.value) list.value.scrollTop = pendingScroll.value; pendingScroll.value = 0; });
    };
    worker.onerror = () => { loading.value = false; error.value = '搜索暂时不可用，请刷新后重试。'; };
    const scopedId = inArticle.value ? restoredNoteId.value || page.noteId : '';
    worker.postMessage({ id: serial, query: query.value, folder: folder.value || (scopedId ? restoredFolderId.value || catalog.value.notes.find(n => n.id === scopedId)?.folder || '' : ''), noteId: scopedId });
  }, 180);
}
watch([query, folder, inArticle], search);
watch(() => ui.search, async open => {
  if (open) {
    lastSearchFocus = document.activeElement as HTMLElement;
    dialog.value?.showModal();
    await nextTick(); input.value?.focus();
  } else { dialog.value?.close(); lastSearchFocus?.focus(); }
});
watch(() => ui.settings, open => {
  if (open) { lastSettingsFocus = document.activeElement as HTMLElement; settings.value?.showModal(); }
  else { settings.value?.close(); lastSettingsFocus?.focus(); }
});
function settingsTabKey(event: KeyboardEvent) {
  const tabs = ['appearance','typography','code'];
  const current = tabs.indexOf(settingsTab.value);
  let next = current;
  if (event.key === 'ArrowRight') next = (current+1)%tabs.length;
  else if (event.key === 'ArrowLeft') next = (current+tabs.length-1)%tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length-1;
  else return;
  event.preventDefault(); settingsTab.value = tabs[next];
  nextTick(()=>document.getElementById('settings-tab-'+settingsTab.value)?.focus());
}
function saveSearch() {
  const noteId = inArticle.value ? restoredNoteId.value || page.noteId : '';
  try { sessionStorage.setItem('notes.lastSearch', JSON.stringify({ query: query.value, folder: folder.value, inArticle: inArticle.value, noteId, noteFolder: restoredFolderId.value || catalog.value.notes.find(n => n.id === noteId)?.folder || '', scroll: list.value?.scrollTop || 0 })); } catch { /* ephemeral */ }
}
function backdrop(event: MouseEvent) { if (event.target === dialog.value) ui.search = false; }
let settingsPointerOutside = false;
function outsideSettings(event: MouseEvent): boolean {
  const panel = settings.value;
  if (!panel || event.target !== panel) return false;
  const bounds = panel.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
}
function settingsPointerDown(event: PointerEvent) { settingsPointerOutside = outsideSettings(event); }
function settingsBackdropClick(event: MouseEvent) {
  if (settingsPointerOutside && outsideSettings(event)) ui.settings = false;
  settingsPointerOutside = false;
}
function openResult(r: SearchSection) {
  saveSearch();
  try { sessionStorage.setItem('notes.fromSearch', '1'); } catch { /* ephemeral */ }
  const url = new URL(r.url, location.origin); url.searchParams.set('q', query.value);
  location.assign(url);
}
function keys(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault(); selected.value = Math.min(Math.max(0,results.value.length - 1), Math.max(0, selected.value + (event.key === 'ArrowDown' ? 1 : -1)));
    list.value?.querySelectorAll<HTMLElement>('.search-result')[selected.value]?.scrollIntoView({ block: 'nearest' });
  }
  if (event.key === 'Enter' && results.value[selected.value]) { event.preventDefault(); openResult(results.value[selected.value]); }
}
onMounted(() => {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ui.search = !ui.search; }
  });
  document.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-open-search]')) ui.search = true;
    if (target instanceof HTMLImageElement && target.closest('.prose')) { zoom.value = target.currentSrc; nextTick(() => document.querySelector<HTMLDialogElement>('#image-zoom')?.showModal()); }
  });
  try {
    const previous = JSON.parse(sessionStorage.getItem('notes.lastSearch') || '{}');
    query.value = previous.query || ''; folder.value = previous.folder || ''; pendingScroll.value = previous.scroll || 0;
    if (new URL(location.href).searchParams.get('search') === 'restore') {
      restoredNoteId.value = previous.noteId || ''; restoredFolderId.value = previous.noteFolder || '';
      inArticle.value = Boolean(previous.inArticle && previous.noteId); ui.search = true; search();
    }
  } catch { /* ignore invalid transient data */ }
});
const textFonts = [{ value: 'system', label: '系统默认' }, { value: 'sans', label: 'Arial / Helvetica' }, { value: 'serif', label: 'Georgia / Times' }, { value: 'lora', label: 'Lora · 内置' }];
const chineseFonts = [{ value: 'system', label: '系统默认' }, { value: 'hei', label: '微软雅黑 / 苹方' }, { value: 'song', label: '宋体 / 华文宋体' }, { value: 'noto', label: '思源黑体 · 内置' }];
const codeFonts = [{ value: 'jetbrains', label: 'JetBrains Mono · 内置' }];
</script>
<template>
  <dialog ref="dialog" class="search-dialog" @close="ui.search = false" @cancel="ui.search = false" @click="backdrop" aria-label="搜索笔记">
    <header class="search-heading"><h2>搜索笔记</h2><button class="icon-button" @click="ui.search=false" aria-label="关闭搜索"><Icon name="close" :size="19"/></button></header><div class="search-top"><Icon name="search" :size="23"/><input ref="input" v-model="query" placeholder="搜索一个概念、一段代码，或一篇笔记…" aria-label="搜索关键词" @keydown="keys"/><button class="keycap" @click="ui.search = false" aria-label="关闭搜索"><Icon name="close" :size="18"/></button></div>
    <div class="search-filters"><select v-model="folder" aria-label="搜索分类"><option value="">全部分类</option><option v-for="f in catalog.folders" :key="f.id" :value="f.id">{{ f.name }}</option></select><label v-if="page.noteId || restoredNoteId"><input type="checkbox" v-model="inArticle"/> 仅当前笔记</label><span>{{ loading ? '检索中…' : query ? `${total} 个相关章节` : '按章节查找，更快抵达知识点' }}</span></div>
    <div ref="list" class="search-results" role="region" aria-label="搜索结果" aria-live="polite">
      <div v-if="error" class="empty-state"><p>{{ error }}</p><button class="soft-button" @click="search">重新加载</button></div>
      <div v-else-if="!query" class="search-welcome"><span class="search-welcome-symbol">⌕</span><h3>想找些什么？</h3><p>试试“集合”“CLASSPATH”或“MySQL”</p><div class="query-chips"><button v-for="s in ['Java', '集合', 'CLASSPATH', '风险管理']" @click="query = s">{{ s }}</button></div></div>
      <div v-else-if="!loading && !results.length" class="empty-state"><Icon name="search" :size="32"/><h3>没有找到相关章节</h3><p>试试更短的关键词，或者扩大搜索范围。</p></div>
      <button v-for="(r, i) in results" :key="r.url" class="search-result" :class="{ active: selected === i }" @click="openResult(r)" @mouseenter="selected = i" :aria-current="selected === i ? 'true' : undefined"><span class="result-path">{{ r.folderName }} <span>/</span> {{ r.title }}</span><strong><template v-for="(part,j) in highlighted(r.section)" :key="j"><mark v-if="part.mark">{{ part.text }}</mark><span v-else>{{ part.text }}</span></template><span class="result-arrow">↗</span></strong><p><template v-for="(part,j) in highlighted(r.excerpt || '')" :key="j"><mark v-if="part.mark">{{ part.text }}</mark><span v-else>{{ part.text }}</span></template></p></button>
      <p v-if="total > 80" class="search-limit">显示前 80 个相关章节，可缩小范围以获得更准确的结果。</p>
    </div><footer class="search-footer"><span>↑ ↓ 选择 <span>↵ 打开章节</span></span><span>搜索在你的浏览器中完成</span></footer>
  </dialog>

  <dialog ref="settings" class="settings-dialog" @pointerdown="settingsPointerDown" @click="settingsBackdropClick" @close="ui.settings=false" @cancel="ui.settings=false" aria-label="阅读设置"><header class="dialog-heading"><h2>阅读设置</h2><button class="icon-button" @click="ui.settings=false" aria-label="关闭设置"><Icon name="close" :size="20"/></button></header>
    <div class="settings-tabs" role="tablist" aria-label="阅读设置分类"><button v-for="(label,key) in {appearance:'外观',typography:'排版',code:'代码与目录'}" :id="'settings-tab-'+key" :class="{active:settingsTab===key}" role="tab" :tabindex="settingsTab===key ? 0 : -1" @keydown="settingsTabKey" :aria-selected="settingsTab===key" aria-controls="settings-panel" @click="settingsTab=key">{{label}}</button></div>
    <div id="settings-panel" class="settings-body" role="tabpanel" :aria-labelledby="'settings-tab-'+settingsTab">
      <template v-if="settingsTab==='appearance'"><section><h3>主题色</h3><div class="accent-options"><button v-for="(label,key) in {ocean:'蓝色',forest:'绿色',violet:'紫色',amber:'金色',rose:'红色',slate:'灰色'}" :class="{active:p.accent===key}" :aria-pressed="p.accent===key" @click="p.accent=key"><i :class="'swatch-'+key"></i>{{label}}</button></div></section><section><h3>页面模式</h3><div class="segmented"><button v-for="(label,key) in {light:'浅色',dark:'深色',system:'跟随系统'}" :class="{active:p.theme===key}" @click="p.theme=key">{{label}}</button></div></section><div class="appearance-preview"><span>阅读效果预览</span><h3>让阅读更专注</h3><p>清晰的排版，让每一个知识点都容易找到。</p><a href="#" @click.prevent>当前主题色</a></div></template>
      <template v-else-if="settingsTab==='typography'"><section><h3>正文排版</h3><label class="range-setting">正文字号<span>{{p.size}} 像素</span><input type="range" v-model.number="p.size" min="14" max="24" step="1"/></label><label class="range-setting">行距<span>{{p.lineHeight.toFixed(2)}}</span><input type="range" v-model.number="p.lineHeight" min="1.5" max="2.4" step="0.05"/></label><label class="range-setting">标题段前间距<span>{{p.headingSpace}} 像素</span><input type="range" v-model.number="p.headingSpace" min="0" max="80" step="4"/></label><label class="range-setting">正文宽度<span>{{p.width}} 像素</span><input type="range" v-model.number="p.width" min="620" max="1000" step="20"/></label><label class="switch-row">标题自动编号<input type="checkbox" v-model="p.numberedHeadings" role="switch"/></label></section><section><h3>字体组合</h3><div class="font-settings"><label>正文中文<select v-model="p.textZh"><option v-for="f in chineseFonts" :value="f.value">{{f.label}}</option></select></label><label>正文英文<select v-model="p.textEn"><option v-for="f in textFonts" :value="f.value">{{f.label}}</option></select></label><label>代码中文<select v-model="p.codeZh"><option v-for="f in chineseFonts" :value="f.value">{{f.label}}</option></select></label><label>代码英文<select v-model="p.codeEn"><option value="system">系统等宽字体</option><option v-for="f in codeFonts" :value="f.value">{{f.label}}</option></select></label></div><p class="setting-hint">内置字体随网站提供；系统字体使用设备已安装的字体。</p></section></template>
      <template v-else><section><h3>代码显示</h3><label class="range-setting">代码字号比正文小<span>{{p.codeOffset}} 像素</span><input type="range" v-model.number="p.codeOffset" min="1" max="4" step="1"/></label><label class="range-setting">代码行距<span>{{p.codeLineHeight.toFixed(2)}}</span><input type="range" v-model.number="p.codeLineHeight" min="1.2" max="2" step="0.05"/></label><label class="range-setting">收起时可见行数<span>约 {{p.codeCollapsedLines}} 行</span><input type="range" v-model.number="p.codeCollapsedLines" min="10" max="60" step="1"/></label><p class="setting-hint">按当前字号与行距计算高度；代码换行时按可见行计算。收起后仍可上下滚动。</p><label class="switch-row">显示代码行号<input type="checkbox" v-model="p.lines" role="switch"/></label><label class="switch-row">代码自动换行<input type="checkbox" v-model="p.wrap" role="switch"/></label></section><section><h3>代码配色</h3><label class="syntax-theme-select">配色预设<select v-model="p.codeTheme"><option value="auto">跟随页面深浅色</option><option value="light">清晰浅色</option><option value="dark">编辑器深色</option><option value="night">柔和夜色</option></select></label><div class="syntax-colors"><label v-for="(label,key) in tokenLabels"><input type="color" :aria-label="label+'颜色'" :value="syntaxPalette[key]" @input="setSyntaxColor(key,$event)"/>{{label}}</label></div><pre class="syntax-preview"><span class="preview-comment">// 配色即时预览</span>
<span class="preview-keyword">const</span> message = <span class="preview-string">'你好，世界'</span>;</pre><button class="soft-button" @click="p.codeColors={}">重置自定义代码颜色</button><p class="setting-hint">按语法类型自定义颜色，保存在当前浏览器。预设独立于网站主题色；更换预设后仍保留自定义颜色。此处为语法高亮，不是编辑器的语义分析。</p></section><section><h3>本文目录</h3><label class="switch-row">默认展开层级<select v-model.number="p.tocDepth"><option :value="2">二级标题</option><option :value="3">三级标题</option><option :value="4">四级标题</option><option :value="6">全部层级</option></select></label></section><section><h3>内容展开</h3><label class="switch-row">展开全部答案<input type="checkbox" v-model="p.answers" role="switch"/></label><label class="switch-row">展开全部示例<input type="checkbox" v-model="p.examples" role="switch"/></label><label class="switch-row">展开全部补充<input type="checkbox" v-model="p.extras" role="switch"/></label><label class="switch-row">展开全部长代码<input type="checkbox" v-model="p.longCode" role="switch"/></label></section></template>
      <p v-if="!storageAvailable" class="warning-text">当前浏览器未允许保存设置。</p>
    </div><footer class="settings-footer"><span>设置自动保存在当前浏览器</span><button class="soft-button" @click="Object.assign(p,defaults);toast('已恢复默认阅读设置')">恢复默认</button></footer>
  </dialog>

  <dialog id="image-zoom" class="image-dialog" aria-label="查看大图" @click="($event.target as HTMLElement).closest('button') || ($event.currentTarget as HTMLDialogElement).close()"><button class="icon-button" @click="($event.currentTarget as HTMLElement).closest('dialog')?.close()" aria-label="关闭图片"><Icon name="close"/></button><img :src="zoom" alt="放大查看图片"/></dialog>
  <div v-if="ui.toast" class="toast" role="status"><Icon name="check" :size="17"/>{{ ui.toast }}</div>
</template>
