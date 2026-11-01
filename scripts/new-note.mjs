import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
const args = process.argv.slice(2);
const option = key => { const i = args.indexOf(`--${key}`); return i < 0 ? undefined : args[i+1]; };
const folder = option('folder'), title = option('title');
if (!folder || !/^[a-z][a-z0-9-]*$/.test(folder) || !title?.trim()) {
  console.error('Usage: npm run new-note -- --folder java --title "新笔记标题"'); process.exit(1);
}
const directory = resolve('content', folder);
try { if (!(await stat(directory)).isDirectory()) throw new Error(); } catch { throw new Error('Folder not found. Define it in config/site.yml and create content/<folder> first.'); }
let order = 0;
for (const name of await readdir(directory)) if (name.endsWith('.md')) order = Math.max(order,Number((await readFile(resolve(directory,name),'utf8')).match(/^order:\s*(\d+)/m)?.[1] || 0));
const id = `${folder}-${randomUUID().slice(0,8)}`;
const date = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const body = `---\nid: ${id}\ntitle: ${JSON.stringify(title.trim())}\nfolder: ${folder}\norder: ${order+1}\ndate: ${date}\nupdated: ${date}\ntags: []\npinned: false\ndraft: true\n---\n\n## 开始记录\n\n`;
await writeFile(resolve(directory,`${id}.md`),body,{flag:'wx'});
console.log(`Created draft: content/${folder}/${id}.md\nChange draft to false when ready to publish.`);
