<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { outlineTree } from './outline';
import Icon from './Icon.vue';
import { ui, preferences, page, catalog, headings, activeHeading, requestedHeading, library, toggleBookmark, setReadingStatus, toast, restorePosition } from './state';
const props = defineProps<{ mode: 'header' | 'actions' | 'toc' | 'continue' }>();
const tocList = ref<HTMLElement>();
const extra = ref(new Set<string>());
const saved = computed(() => library.bookmarks.some(b => b.key === `${page.noteId}#`));
const status = computed(() => library.records[page.noteId]?.status || 'unread');
const recent = computed(() => Object.values(library.records).sort((a,b) => b.at-a.at).slice(0,1).map(r => ({ record: r, note: catalog.value.notes.find(n => n.id === r.id) })).filter(x => x.note));
const tree = outlineTree(headings);
const modeOverride = ref<'default'|'all'|'none'>('default');
const overrides = ref(new Map<string,boolean>());
function expanded(id: string): boolean {
  if (overrides.value.has(id)) return overrides.value.get(id)!;
  if (modeOverride.value !== 'default') return modeOverride.value === 'all';
  const i = tree.findIndex(h => h.id === id);
  const active = tree.find(h => h.id === activeHeading.value);
  return (tree[i+1]?.level <= preferences.tocDepth) || Boolean(active?.parents.includes(i));
}
const visible = computed(() => tree.filter(h => h.parents.every(i => expanded(tree[i].id))));
function followActiveHeading() {
  const list=tocList.value; const item=list?.querySelector<HTMLElement>('.toc-item.active');
  if(!list || !item || !list.clientHeight)return;
  const bounds=list.getBoundingClientRect(); const target=item.getBoundingClientRect();
  const padding=Math.min(20,list.clientHeight/4);
  // Scroll only the TOC container. scrollIntoView would also move the article.
  if(target.top<bounds.top+padding || target.bottom>bounds.bottom-padding) {
    list.scrollTop=Math.max(0,list.scrollTop+target.top-bounds.top-(list.clientHeight-Math.min(target.height,list.clientHeight))/2);
  }
}
watch(activeHeading, async id=>{
  if(props.mode!=='toc' || !id)return;
  const active=tree.find(h=>h.id===id);
  if(active){const next=new Map(overrides.value);for(const parent of active.parents)next.set(tree[parent].id,true);overrides.value=next;}
  await nextTick();followActiveHeading();
},{immediate:true,flush:'post'});
let tocResize:ResizeObserver|undefined;
onMounted(()=>{if(tocList.value){tocResize=new ResizeObserver(()=>followActiveHeading());tocResize.observe(tocList.value);followActiveHeading();}});
onUnmounted(()=>tocResize?.disconnect());
function toggle(id: string) { const next = new Map(overrides.value); next.set(id,!expanded(id)); overrides.value = next; }
function setOutlineMode(mode: 'all'|'none') { modeOverride.value = mode; overrides.value = new Map(); }
watch(() => preferences.tocDepth, () => { modeOverride.value = 'default'; overrides.value = new Map(); });
function chooseHeading(id: string) {
  requestedHeading.value = id; activeHeading.value = id; closeToc();
}
function returnSearch() { location.href = '/notes/?search=restore'; }
function cycleTheme() { preferences.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; }
function toggleFocus() { ui.focus = !ui.focus; document.body.classList.toggle('focus-mode', ui.focus); }
function closeToc() { ui.mobileToc = false; document.body.classList.remove('show-toc'); }
function resume(id: string) { try { sessionStorage.setItem('notes.resume', id); } catch {} location.href = catalog.value.notes.find(n => n.id === id)?.url || '/notes/'; }
const fromSearch = new URL(location.href).searchParams.has('q');
</script>
<template>
  <template v-if="mode === 'header'"><button aria-label="搜索笔记" class="search-trigger" @click="ui.search = true"><Icon name="search" :size="17"/><span>搜索笔记</span></button><button class="icon-button" @click="cycleTheme" aria-label="切换深浅色"><Icon :name="preferences.theme === 'dark' ? 'sun' : 'moon'" :size="19"/></button><button class="icon-button" @click="ui.settings = true" aria-label="阅读设置"><Icon name="settings" :size="19"/></button></template>
  <template v-else-if="mode === 'actions'"><div class="article-action-row"><button class="soft-button" :class="{ 'is-saved': saved }" @click="toggleBookmark(page.noteId)"><Icon name="bookmark" :size="16"/>{{ saved ? '已收藏' : '收藏笔记' }}</button><label class="status-select"><span class="status-dot" :class="status"></span><select :value="status" @change="setReadingStatus(page.noteId, ($event.target as HTMLSelectElement).value as any)"><option value="unread">未阅读</option><option value="reading">未读完</option><option value="finished">已读完</option></select></label><button class="text-button" @click="ui.settings = true"><Icon name="settings" :size="16"/>阅读设置</button><button class="text-button focus-toggle" @click="toggleFocus"><Icon name="expand" :size="16"/>{{ ui.focus ? '退出专注' : '专注阅读' }}</button></div><div v-if="fromSearch" class="search-return"><button @click="returnSearch"><Icon name="back" :size="15"/>返回搜索结果</button></div><div v-if="library.records[page.noteId]?.manual" class="manual-hint">阅读状态由你手动设置 · <button @click="library.records[page.noteId].manual = false; toast('已恢复自动判定')">恢复自动</button></div></template>
  <template v-else-if="mode === 'toc'"><div class="toc-top"><h2>本文目录</h2><span>{{ headings.length }} 节</span><button class="toc-collapse" data-toggle-toc aria-label="收起本文目录">»</button></div><div class="toc-controls"><button @click="setOutlineMode('all')">展开全部</button><button @click="setOutlineMode('none')">收起</button></div><nav ref="tocList" class="toc-list" aria-label="本文目录"><div v-for="h in visible" :key="h.id" class="toc-item" :class="{ active: h.id === activeHeading }" :style="{ '--indent': Math.max(0,h.level-2) }"><a :href="`#${h.id}`" :aria-current="h.id === activeHeading ? 'location' : undefined" @click="chooseHeading(h.id)"><span v-if="preferences.numberedHeadings" class="toc-number">{{ h.number }}</span>{{ h.title }}</a><button v-if="tree[tree.indexOf(h)+1]?.level > h.level" @click="toggle(h.id)" :aria-expanded="expanded(h.id)" :aria-label="`${expanded(h.id) ? '收起' : '展开'}${h.title}子目录`">{{ expanded(h.id) ? '−' : '+' }}</button></div></nav><div class="toc-bottom"><button class="text-button" @click="toggleBookmark(page.noteId, activeHeading, headings.find(h => h.id === activeHeading)?.title)" :disabled="!activeHeading"><Icon name="bookmark" :size="14"/>收藏当前章节</button><a href="#main">回到顶部 ↑</a></div><div class="reading-progress"><span :style="{ width: `${(library.records[page.noteId]?.progress || 0) * 100}%` }"></span></div><span class="reading-progress-label">阅读进度 {{ Math.round((library.records[page.noteId]?.progress || 0)*100) }}%</span></template>
  <section v-else-if="mode === 'continue'" class="continue-section"><template v-if="recent.length"><div class="resume-card" v-for="item in recent" :key="item.note!.id"><div class="resume-icon"><Icon name="book" :size="26"/></div><div class="resume-copy"><h2>{{ item.note!.title }}</h2><p>{{ item.note!.folderName }} · 已读 {{ Math.round(item.record.progress*100) }}%</p></div><div class="resume-progress"><span :style="{width: Math.round(item.record.progress*100)+'%'}"></span></div><button class="primary-button" @click="resume(item.note!.id)">继续阅读<Icon name="arrow" :size="16"/></button></div></template><div v-else class="resume-card"><div class="resume-icon"><Icon name="book" :size="26"/></div><div class="resume-copy"><h2>从一篇笔记开始</h2><p>阅读后，这里会保留你上次的位置。</p></div><a class="primary-button" href="/notes/">浏览笔记<Icon name="arrow" :size="16"/></a></div></section>
</template>
