import type { Library, ReadingStatus } from './types';
const object = (value:unknown): value is Record<string,any> => Boolean(value) && typeof value==='object' && !Array.isArray(value);
const id = (value:unknown): value is string => typeof value==='string' && /^[a-z][a-z0-9-]*$/.test(value) && !['constructor','prototype','__proto__'].includes(value);
const finite = (value:unknown, fallback=0) => typeof value==='number' && Number.isFinite(value) ? value : fallback;
const text = (value:unknown, max=500) => typeof value==='string' ? value.slice(0,max) : '';
export function decodePersonalBackup(data:unknown) {
  if(!object(data) || data.format!=='nbvc213-personal-data' || data.version!==1 || !object(data.library) || !object(data.library.records) || !Array.isArray(data.library.bookmarks) || !Array.isArray(data.library.annotations)) throw new Error('这不是有效的阅读记录备份');
  const result:Library={version:1,records:Object.create(null),bookmarks:[],annotations:[]};
  let skipped=0;
  for(const item of data.library.bookmarks){
    if(!object(item) || !id(item.noteId) || typeof item.anchor!=='string' || typeof item.title!=='string'){skipped++;continue;}
    const anchor=text(item.anchor);const key=`${item.noteId}#${anchor}`;
    if(!result.bookmarks.some(b=>b.key===key)) result.bookmarks.push({key,noteId:item.noteId,anchor,title:text(item.title,300),at:Math.max(0,finite(item.at))});
  }
  for(const [key,item] of Object.entries(data.library.records)){
    if(!id(key) || !object(item) || !['unread','reading','finished'].includes(item.status)){skipped++;continue;}
    result.records[key]={id:key,anchor:text(item.anchor),offset:finite(item.offset),y:Math.max(0,finite(item.y)),at:Math.max(0,finite(item.at)),progress:Math.max(0,Math.min(1,finite(item.progress))),status:item.status as ReadingStatus,manual:item.manual===true,visits:Math.max(1,Math.floor(finite(item.visits,1)))};
  }
  for(const item of data.library.annotations){
    if(!object(item) || !id(item.noteId) || typeof item.id!=='string' || !item.id || typeof item.comment!=='string' || typeof item.start!=='number' || typeof item.end!=='number' || !Number.isFinite(item.start) || !Number.isFinite(item.end) || item.start<0 || item.end<=item.start){skipped++;continue;}
    let locator;
    if(item.locator!==undefined){const l=item.locator;if(!object(l)||l.version!==2||typeof l.blockHash!=='string'||!/^\d+-[0-9a-f]{16}$/.test(l.blockHash)||!Number.isInteger(l.start)||!Number.isInteger(l.end)||l.start<0||l.end<=l.start){skipped++;continue;}locator={version:2 as const,blockHash:l.blockHash,start:l.start,end:l.end};}
    if(!result.annotations.some(a=>a.id===item.id))result.annotations.push({id:text(item.id,100),noteId:item.noteId,anchor:text(item.anchor),start:Math.floor(item.start),end:Math.floor(item.end),comment:text(item.comment,5000),at:Math.max(0,finite(item.at)),...(locator?{locator}:{})});
  }
  return {library:result,preferences:object(data.preferences)?data.preferences:{},skipped};
}
