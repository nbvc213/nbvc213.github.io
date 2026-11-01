import { readdir, lstat, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
export async function checkRelease(root) {
  root=resolve(root); let files=0, bytes=0;
  async function walk(dir) {
    for(const name of await readdir(dir)) {
      const file=resolve(dir,name), rel=relative(root,file).replaceAll('\\','/');
      const info=await lstat(file);
      if(info.isSymbolicLink())throw new Error('发布目录不允许符号链接：'+rel);
      if(['.git','.tools','node_modules','content','config','target'].includes(name) || /^\.env(?:\.|$)/i.test(name) || /\.(?:md|mhtml|zip|log|map|java|ts|vue|bak)$/i.test(name) || /^notes-personal-.*\.json$/i.test(name)) throw new Error('发布目录含原稿、开发文件或备份：'+rel);
      if(info.isDirectory()) await walk(file); else if(info.isFile()){files++;bytes+=info.size;}
    }
  }
  await walk(root);
  for(const file of ['index.html','404.html','.nojekyll','assets/app.js','data/catalog.json','media/icons.svg']) { if(!(await lstat(resolve(root,file))).isFile()) throw new Error('缺少必要发布文件：'+file); }
  const catalog=JSON.parse(await readFile(resolve(root,'data/catalog.json'),'utf8'));
  const url=new URL(catalog.site.url);
  if(url.protocol!=='https:' || url.pathname!=='/' || url.search || url.hash || ['localhost','127.0.0.1','[::1]'].includes(url.hostname)) throw new Error('正式网址须为 HTTPS 根站点地址');
  if(!catalog.notes?.length)throw new Error('发布内容为空');
  const hash=createHash('sha256').update(await readFile(resolve(root,'assets/app.js'))).digest('hex');
  return {site:url.origin,notes:catalog.notes.length,files,bytes,appSha256:hash};
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
  const report=await checkRelease('dist');
  await mkdir('.tools',{recursive:true});
  await writeFile('.tools/release-report.json',JSON.stringify({...report,checkedAt:new Date().toISOString()},null,2));
  console.log(`发布目录检查通过：${report.notes} 篇笔记，${report.files} 个文件，${(report.bytes/1024/1024).toFixed(1)} MiB。`);
  console.log('检查报告位于 .tools/release-report.json；此命令不会发布网站。');
}
