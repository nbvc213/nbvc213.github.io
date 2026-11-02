// Runs before CSS: apply saved appearance before the first paint.
(() => {
const light = {foreground:'#24292e',background:'#f6f8fa',keyword:'#a626a4',string:'#22863a',comment:'#6a737d',number:'#b35c00',function:'#6f42c1',type:'#267f99',variable:'#953800',tag:'#22863a',attribute:'#b35c00',operator:'#a626a4'};
const dark = {foreground:'#d4d4d4',background:'#1e1e1e',keyword:'#c586c0',string:'#ce9178',comment:'#6a9955',number:'#b5cea8',function:'#dcdcaa',type:'#4ec9b0',variable:'#9cdcfe',tag:'#569cd6',attribute:'#9cdcfe',operator:'#d4d4d4'};
const night = {...dark,background:'#282c34',keyword:'#c678dd',string:'#98c379',comment:'#929ba9',number:'#d19a66',function:'#61afef',type:'#e5c07b',tag:'#e06c75'};

  const fonts = {system:'system-ui, -apple-system, BlinkMacSystemFont',serif:'"Gelasio Variable"',times:'"Tinos"',sans:'"Arimo Variable"',arimo:'"Arimo Variable"',tinos:'"Tinos"',gelasio:'"Gelasio Variable"',song:'"Noto Serif SC Variable"',hei:'"Noto Sans SC Variable"',noto:'"Noto Sans SC Variable"',lora:'"Lora Variable"',jetbrains:'"JetBrains Mono Variable"',courier:'"Courier Prime"'};
  window.notesAppearance = p => {
    const h=document.documentElement;
    h.dataset.theme=['light','dark'].includes(p.theme)?p.theme:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    h.dataset.accent=['forest','ocean','violet','amber','rose','slate'].includes(p.accent)?p.accent:'ocean';
    h.dataset.numbered=String(p.numberedHeadings===true);
    h.dataset.lines=String(p.lines===true);h.dataset.wrap=String(p.wrap===true);
    const number=(key,fallback,min,max)=>typeof p[key]==='number'&&Number.isFinite(p[key])?Math.max(min,Math.min(max,p[key])):fallback;
    const size=number('size',18,14,24);
    const viewport=document.documentElement.clientWidth||window.innerWidth||1280;
    let left=viewport>960?number('leftPanelWidth',220,180,360):0;
    let right=viewport>1100?number('rightPanelWidth',224,180,360):0;
    const excess=Math.max(0,left+right-Math.max(0,Math.min(1800,viewport)-480));
    if(excess){if(left&&right){left-=excess/2;right-=excess/2;}else if(left)left-=excess;else right-=excess;}
    if(!document.body){
    h.style.setProperty('--reader-left-width',Math.floor(left)+'px');
    h.style.setProperty('--reader-right-width',Math.floor(right)+'px');
    h.style.setProperty('--floating-right-offset',(right?Math.floor(right)+20:20)+'px');
    }
    for(const [key,value] of Object.entries({
      '--heading-space':number('headingSpace',32,0,80)+'px',
      '--reading-size':size+'px','--reading-leading':number('lineHeight',1.8,1.5,2.4),
      '--reading-width':number('width',760,620,1000)+'px',
      '--code-size':Math.max(10,size-number('codeOffset',2,1,4))+'px',
      '--code-leading':number('codeLineHeight',1.55,1.2,2),
      '--code-collapsed-lines':Math.round(number('codeCollapsedLines',25,10,60))
    })) h.style.setProperty(key,String(value));
    for(const slot of ['textEn','textZh','codeEn','codeZh']) {
      const key=p[slot]||'system';
      const font=key==='system'&&slot.endsWith('En')?(slot==='codeEn'?'Consolas, "Notes Latin System", monospace':'"Notes Latin System"'):fonts[key]||fonts.system;
      h.style.setProperty('--font-'+slot,font);
    }
    const palette={...(p.codeTheme==='dark'?dark:p.codeTheme==='night'?night:p.codeTheme==='light'?light:h.dataset.theme==='dark'?dark:light)};
    for(const key of Object.keys(palette)) {
      const override=p.codeColors?.[key];
      h.style.setProperty('--syntax-'+key,/^#[0-9a-f]{6}$/i.test(override||'')?override:palette[key]);
    }
  };
  try {window.notesAppearance(JSON.parse(localStorage.getItem('notes.preferences')||'{}')||{});} catch {window.notesAppearance({});}
})();
