import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file='config/content-index.json';
const index=existsSync(file)?JSON.parse(await readFile(file,'utf8')):{folders:{},notes:{}};
const before=JSON.stringify(index);const update=process.argv.includes('--update');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const hash=text=>createHash('sha256').update(text).digest('hex');
for(const folder of await readdir('content',{withFileTypes:true}))if(folder.isDirectory()){
 index.folders[folder.name]||='folder-'+hash(folder.name).slice(0,20);
 for(const name of await readdir('content/'+folder.name))if(name.endsWith('.md')){
  const path='content/'+folder.name+'/'+name;const text=(await readFile(path,'utf8')).replaceAll('\r\n','\n');const digest=hash(text);
  if(!index.notes[path])index.notes[path]={id:'note-'+hash(path).slice(0,24),date:today,updated:today,hash:digest};
  const entry=index.notes[path];
  if(update&&entry.hash!==digest){entry.updated=today;entry.hash=digest;console.log('更新时间：'+path);}
 }
}
if(before!==JSON.stringify(index)){await mkdir('config',{recursive:true});await writeFile(file,JSON.stringify(index,null,2)+'\n');}
