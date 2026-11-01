import { guardedBuild } from './build-guard.mjs';
import { watch } from 'node:fs';
import { createRebuildQueue } from './rebuild-queue.mjs';
await guardedBuild('ui');
const { startServer } = await import('./serve.mjs');
await startServer();
console.log('正在监视笔记、图片、配置、模板和界面文件。重新生成成功后请刷新浏览器。');
const request = createRebuildQueue(async changes => {
  await guardedBuild(changes.has('ui') ? 'ui' : 'content');
  console.log('网站重新生成成功，请刷新浏览器。');
}, error => console.error('重新生成失败，请修正后再次保存：', error.message));
const dirty = new Set(); let timer;
function changed(kind) {
  dirty.add(kind); clearTimeout(timer);
  timer = setTimeout(() => { for (const item of dirty) void request(item); dirty.clear(); }, 400);
}
for (const directory of ['content', 'config', 'src/main', 'public', 'web']) watch(directory, { recursive: true }, () => changed(directory === 'web' ? 'ui' : 'content'));
for (const file of ['vite.config.ts', 'tsconfig.json']) watch(file, () => changed('ui'));
