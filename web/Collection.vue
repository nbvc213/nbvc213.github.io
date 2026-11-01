<script setup lang="ts">
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import { catalog, page, library, toggleBookmark, exportPersonalData, importPersonalData, resetPersonalData, storageAvailable, toast } from './state';
import type { ReadingStatus } from './types';
const folder = ref(page.folderId || '');
const tag = ref('');
const query = ref('');
const sort = ref(page.folderId ? 'order' : 'updated');
const allowedTabs = ['bookmarks','chapters','recent','annotations','data'];
const initialTab = new URLSearchParams(location.search).get('tab') || 'bookmarks';
const tab = ref(allowedTabs.includes(initialTab) ? initialTab : 'bookmarks');
const status = ref('');
const file = ref<HTMLInputElement>();
const clearKind = ref<'records' | 'bookmarks' | 'annotations' | 'all'>('records');
const confirmClear = ref(false);
const isLibrary = page.kind === 'library';
const tags = computed(() => [...new Set(catalog.value.notes.filter(n => !folder.value || n.folder === folder.value).flatMap(n => n.tags))]);
const labels: Record<ReadingStatus,string> = { unread: '未阅读', reading: '未读完', finished: '已读完' };
const filtered = computed(() => catalog.value.notes.filter(n => {
  if (folder.value && n.folder !== folder.value || tag.value && !n.tags.includes(tag.value) || query.value && !`${n.title} ${n.description}`.toLowerCase().includes(query.value.toLowerCase())) return false;
  if (status.value && (library.records[n.id]?.status || 'unread') !== status.value) return false;
  if (isLibrary && tab.value === 'bookmarks') return library.bookmarks.some(b => b.noteId === n.id && !b.anchor);
  if (isLibrary && tab.value === 'recent') return Boolean(library.records[n.id]);
  return true;
}).sort((a,b) => {
  if (isLibrary && tab.value === 'recent') return library.records[b.id].at - library.records[a.id].at;
  if (sort.value === 'order') return a.folder.localeCompare(b.folder) || a.order-b.order;
  if (sort.value === 'title') return a.title.localeCompare(b.title,'zh-CN');
  return b.updated.localeCompare(a.updated) || a.order-b.order;
}));
const chapters = computed(() => library.bookmarks.filter(b => b.anchor && (!folder.value || catalog.value.notes.find(n => n.id === b.noteId)?.folder === folder.value)).map(b => ({...b, note: catalog.value.notes.find(n => n.id === b.noteId)})).filter(b => b.note));
async function importFile(event: Event) {
  const selected = (event.target as HTMLInputElement).files?.[0]; if (!selected) return;
  try { await importPersonalData(selected); } catch (e) { toast((e as Error).message); }
  (event.target as HTMLInputElement).value = '';
}
</script>
<template>
  <div v-if="isLibrary" class="library-tabs" aria-label="书架分类"><button v-for="(name,key) in { bookmarks:'收藏笔记', chapters:'收藏章节', recent:'阅读记录', annotations:'批注', data:'数据管理' }" :class="{active:tab===key}" @click="tab=key">{{name}}</button></div>
  <template v-if="!isLibrary || ['bookmarks','recent'].includes(tab)">
    <div class="collection-filters"><div class="filter-search"><Icon name="search" :size="17"/><input v-model="query" :placeholder="page.folderId ? '在此分类中查找' : '查找笔记标题'" aria-label="筛选笔记"/></div><select v-if="!page.folderId" v-model="folder" aria-label="分类"><option value="">全部分类</option><option v-for="f in catalog.folders" :value="f.id">{{f.name}}</option></select><select v-model="status" aria-label="阅读状态"><option value="">全部阅读状态</option><option value="unread">未阅读</option><option value="reading">未读完</option><option value="finished">已读完</option></select><select v-model="sort" aria-label="排序"><option value="updated">最近更新</option><option value="order">按章节排序</option><option value="title">按标题排序</option></select></div>
    <div v-if="tags.length" class="tag-filters" aria-label="标签筛选"><button :class="{active:!tag}" @click="tag=''">全部</button><button v-for="t in tags" :class="{active:tag===t}" @click="tag=t">{{t}}</button></div>
    <div class="list-caption"><span>共 {{filtered.length}} 篇笔记</span></div>
    <div class="notes-table"><div class="note-table-head"><span>标题</span><span>分类</span><span>阅读状态</span><span>更新日期</span><span></span></div><div class="note-table-row" v-for="n in filtered" :key="n.id"><a class="note-table-title" :href="n.url"><Icon name="file" :size="18"/><span>{{n.title}}</span></a><a class="category-label" :href="'/folders/'+n.folder+'/'">{{n.folderName}}</a><span class="reading-badge" :class="library.records[n.id]?.status || 'unread'">{{labels[library.records[n.id]?.status || 'unread']}}</span><span class="note-date">{{n.updated}}</span><button class="icon-button" :class="{saved:library.bookmarks.some(b=>b.key===n.id+'#')}" @click="toggleBookmark(n.id)" :aria-label="(library.bookmarks.some(b=>b.key===n.id+'#')?'取消收藏':'收藏')+n.title"><Icon name="bookmark" :size="17"/></button></div></div>
    <div v-if="!filtered.length" class="empty-state"><Icon :name="isLibrary?'bookmark':'search'" :size="32"/><h3>{{isLibrary?'这里还没有笔记':'没有符合条件的笔记'}}</h3><p>{{isLibrary?'阅读时收藏笔记，就会出现在这里。':'试试调整筛选条件。'}}</p><a v-if="isLibrary" href="/notes/" class="soft-button">浏览全部笔记</a></div>
  </template>
  <section v-else-if="tab==='chapters'" class="chapter-list"><select v-model="folder" aria-label="收藏章节分类"><option value="">全部分类</option><option v-for="f in catalog.folders" :value="f.id">{{f.name}}</option></select><div class="saved-chapter" v-for="b in chapters" :key="b.key"><Icon name="bookmark" :size="21"/><a :href="b.note!.url+'#'+encodeURIComponent(b.anchor)"><strong>{{b.title}}</strong><span>{{b.note!.title}} · {{b.note!.folderName}}</span></a><a class="soft-button" :href="b.note!.url+'#'+encodeURIComponent(b.anchor)">继续阅读</a><button class="icon-button" @click="toggleBookmark(b.noteId,b.anchor)" :aria-label="'取消收藏'+b.title"><Icon name="close" :size="16"/></button></div><div v-if="!chapters.length" class="empty-state"><Icon name="bookmark" :size="32"/><h3>还没有收藏章节</h3><p>阅读时，在本文目录下收藏当前章节。</p></div></section>
  <div v-else-if="tab === 'annotations'" class="annotation-list"><div v-for="a in library.annotations" :key="a.id" class="annotation-card"><span class="category-label">{{ catalog.notes.find(n => n.id === a.noteId)?.title || '原笔记已移除' }}</span><p>{{ a.comment }}</p><div><a :href="`${catalog.notes.find(n => n.id === a.noteId)?.url || '/notes/'}#${encodeURIComponent(a.anchor)}`">返回标注位置 ↗</a><button class="text-button" @click="library.annotations = library.annotations.filter(x => x.id !== a.id)">删除</button></div></div><div v-if="!library.annotations.length" class="empty-state"><Icon name="edit" :size="34"/><h3>留一点自己的思考</h3><p>阅读时点击“添加标注”，选择正文并写下备注。</p></div></div>
  <div v-else class="data-panel"><div class="data-notice"><Icon name="book" :size="25"/><div><h3>你的记录，只留在这里</h3><p>没有账号与云同步。清理浏览器数据或更换设备可能丢失记录，请按需备份。导出只包含个人记录，不包含笔记正文。</p><p v-if="!storageAvailable" class="warning-text">当前浏览器未允许持久保存。</p></div></div><div class="data-actions"><button class="soft-button" @click="exportPersonalData"><Icon name="download" :size="17"/>备份个人记录</button><button class="soft-button" @click="file?.click()"><Icon name="upload" :size="17"/>导入记录备份</button><input ref="file" type="file" accept="application/json,.json" hidden @change="importFile"/></div><div class="data-clear"><h3>清理本机数据</h3><p>只影响当前浏览器，不会删除网站笔记。</p><select v-model="clearKind"><option value="records">阅读历史与进度</option><option value="bookmarks">收藏</option><option value="annotations">标注与备注</option><option value="all">全部个人记录与偏好</option></select><button class="text-button danger" @click="confirmClear = true">清理所选数据</button><div v-if="confirmClear" class="clear-confirm"><span>确定清除？建议先备份。</span><button class="soft-button" @click="resetPersonalData(clearKind); confirmClear = false">确认清除</button><button class="text-button" @click="confirmClear = false">取消</button></div></div></div>
  <div v-if="isLibrary && tab!=='data'" class="library-local-note"><Icon name="book" :size="16"/><span>阅读记录和收藏保存在当前浏览器</span><button @click="tab='data'">数据管理</button></div>
</template>
