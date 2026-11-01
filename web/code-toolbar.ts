import { toast } from './state';

function icon(name: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key,value] of Object.entries({width:'18',height:'18',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'})) svg.setAttribute(key,value);
  const use = document.createElementNS('http://www.w3.org/2000/svg','use');
  use.setAttribute('href',`/media/icons.svg#${name}`); svg.append(use); return svg;
}

export function addCodeToolbar(pre: HTMLPreElement, language: string, raw: string) {
  pre.style.setProperty('--code-number-digits', String(Math.max(2,raw.trimEnd().split('\n').length.toString().length)));
  const toolbar = document.createElement('div'); toolbar.className='code-toolbar';
  const label = document.createElement('span'); label.className='code-language';
  const names: Record<string,string>={text:'代码',vue:'Vue',vue3:'Vue',vuejs:'Vue',typescript:'TypeScript',ts:'TypeScript',javascript:'JavaScript',js:'JavaScript',java:'Java',html:'HTML',css:'CSS',sql:'SQL',json:'JSON',xml:'XML',bash:'Bash',powershell:'PowerShell',markdown:'Markdown'};
  label.append(icon('code'),document.createTextNode(names[language] || language));
  const controls=document.createElement('div'); controls.className='code-actions';
  function button(name:string, title:string, action:()=>void) {
    const el=document.createElement('button'); el.type='button'; el.append(icon(name));
    el.setAttribute('aria-label',title); el.title=title; el.addEventListener('click',action); controls.append(el); return el;
  }
  const lines=button('line-numbers','显示行号',()=>{pre.dataset.lines=String(pre.dataset.lines!=='true');});
  const wrap=button('wrap','代码换行',()=>{pre.dataset.wrap=String(pre.dataset.wrap!=='true');});
  const fold=button('code-collapse','收起代码',()=>{pre.classList.toggle('code-collapsed');});
  let timer: ReturnType<typeof setTimeout> | undefined;
  const copy=button('copy','复制代码',async()=>{
    copy.disabled=true;
    try {
      await navigator.clipboard.writeText(raw);
      clearTimeout(timer); copy.replaceChildren(icon('check')); copy.classList.add('copied');
      copy.title='已复制'; copy.setAttribute('aria-label','已复制'); toast('代码已复制');
      timer=setTimeout(()=>{copy.replaceChildren(icon('copy'));copy.classList.remove('copied');copy.title='复制代码';copy.setAttribute('aria-label','复制代码');},2000);
    } catch { toast('复制失败，请允许浏览器访问剪贴板后重试。'); }
    finally {copy.disabled=false;}
  });
  function sync() {
    for(const [el,on,text] of [[lines,pre.dataset.lines==='true','行号'],[wrap,pre.dataset.wrap==='true','代码换行']] as const){el.setAttribute('aria-pressed',String(on));el.title=`${on?'关闭':'开启'}${text}`;el.setAttribute('aria-label',el.title);}
    const collapsed=pre.classList.contains('code-collapsed');
    fold.replaceChildren(icon(collapsed?'code-expand':'code-collapse')); fold.title=collapsed?'展开代码':'收起代码';fold.setAttribute('aria-label',fold.title);fold.setAttribute('aria-expanded',String(!collapsed));
  }
  new MutationObserver(sync).observe(pre,{attributes:true,attributeFilter:['data-lines','data-wrap','class']});
  sync();toolbar.append(label,controls);pre.prepend(toolbar);
}
