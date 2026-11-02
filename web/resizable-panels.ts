import {watch} from 'vue';
import {preferences} from './state';
import {fitPanelWidths} from './panel-widths';
export function setupResizablePanels(){
  const shell=document.querySelector<HTMLElement>('.reader-shell');if(!shell)return;
  let preview:{side:'left'|'right';width:number}|undefined;
  const handles=Object.fromEntries((['left','right'] as const).map(side=>{
    const handle=document.createElement('div');handle.className=`panel-resizer panel-resizer-${side}`;
    handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');
    handle.setAttribute('aria-label',side==='left'?'调整笔记列表宽度':'调整本文目录宽度');
    handle.title='拖动调整宽度；双击恢复默认；方向键微调';document.body.append(handle);
    return [side,handle];
  })) as Record<'left'|'right',HTMLDivElement>;
  function layout(){
    const focus=document.body.classList.contains('focus-mode');
    const leftVisible=innerWidth>960&&!focus&&!document.body.classList.contains('sidebar-collapsed');
    const rightVisible=innerWidth>1100&&!focus&&!document.body.classList.contains('toc-collapsed');
    const fitted=fitPanelWidths(shell!.clientWidth,preview?.side==='left'?preview.width:preferences.leftPanelWidth,preview?.side==='right'?preview.width:preferences.rightPanelWidth,leftVisible,rightVisible);
    document.documentElement.style.setProperty('--floating-right-offset', `${rightVisible?fitted.right+20:20}px`);
    shell!.style.setProperty('--reader-left-width',`${fitted.left}px`);shell!.style.setProperty('--reader-right-width',`${fitted.right}px`);
    for(const side of ['left','right'] as const){
      const panel=shell!.querySelector<HTMLElement>(side==='left'?'.reader-sidebar':'.reader-toc');const visible=side==='left'?leftVisible:rightVisible;const handle=handles[side];handle.hidden=!visible;
      if(!visible||!panel)continue;
      const rect=panel.getBoundingClientRect();handle.style.left=`${(side==='left'?rect.right:rect.left)-4}px`;
      handle.setAttribute('aria-valuemin','180');handle.setAttribute('aria-valuemax',String(Math.min(360,shell!.clientWidth-480-(side==='left'?fitted.right:fitted.left))));handle.setAttribute('aria-valuenow',String(fitted[side]));
    }
  }
  for(const side of ['left','right'] as const){
    const handle=handles[side];const key=side==='left'?'leftPanelWidth':'rightPanelWidth';
    let startX=0,startWidth=0;
    handle.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();startX=event.clientX;startWidth=Number(handle.getAttribute('aria-valuenow'));preview={side,width:startWidth};handle.setPointerCapture(event.pointerId);document.body.classList.add('panel-dragging');});
    handle.addEventListener('pointermove',event=>{if(!preview||preview.side!==side)return;preview.width=Math.max(180,Math.min(Number(handle.getAttribute('aria-valuemax')),startWidth+(event.clientX-startX)*(side==='left'?1:-1)));layout();});
    const finish=(commit:boolean)=>{if(!preview||preview.side!==side)return;const width=Number(handle.getAttribute('aria-valuenow'));preview=undefined;document.body.classList.remove('panel-dragging');if(commit)preferences[key]=width;layout();};
    handle.addEventListener('pointerup',()=>finish(true));handle.addEventListener('pointercancel',()=>finish(false));handle.addEventListener('lostpointercapture',()=>finish(false));
    handle.addEventListener('dblclick',()=>{preferences[key]=side==='left'?220:224;layout();});
    handle.addEventListener('keydown',event=>{const current=Number(handle.getAttribute('aria-valuenow')),max=Number(handle.getAttribute('aria-valuemax'));let value;
      if(event.key==='Home')value=180;else if(event.key==='End')value=max;else if(event.key==='ArrowRight')value=current+(side==='left'?10:-10);else if(event.key==='ArrowLeft')value=current+(side==='left'?-10:10);else return;
      event.preventDefault();preferences[key]=Math.max(180,Math.min(max,value));layout();});
  }
  watch(()=>[preferences.leftPanelWidth,preferences.rightPanelWidth],layout,{flush:'post'});
  const resize=new ResizeObserver(layout);resize.observe(shell);
  new MutationObserver(layout).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',layout);layout();
}
