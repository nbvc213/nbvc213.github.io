export const tokenLabels: Record<string,string> = {foreground:'普通文字',background:'代码背景',keyword:'关键字',string:'字符串',comment:'注释',number:'数字与常量',function:'函数名称',type:'类型名称',variable:'变量',tag:'标签',attribute:'属性',operator:'运算符'};
const light = {foreground:'#24292e',background:'#f6f8fa',keyword:'#a626a4',string:'#22863a',comment:'#6a737d',number:'#b35c00',function:'#6f42c1',type:'#267f99',variable:'#953800',tag:'#22863a',attribute:'#b35c00',operator:'#a626a4'};
const dark = {foreground:'#d4d4d4',background:'#1e1e1e',keyword:'#c586c0',string:'#ce9178',comment:'#6a9955',number:'#b5cea8',function:'#dcdcaa',type:'#4ec9b0',variable:'#9cdcfe',tag:'#569cd6',attribute:'#9cdcfe',operator:'#d4d4d4'};
const night = {...dark,background:'#282c34',keyword:'#c678dd',string:'#98c379',comment:'#929ba9',number:'#d19a66',function:'#61afef',type:'#e5c07b',tag:'#e06c75'};
export function codePalette(theme:string, overrides:Record<string,string>, isDark:boolean) {
  const palette:Record<string,string>={...(theme==='dark'?dark:theme==='night'?night:theme==='light'?light:isDark?dark:light)};
  for(const key of Object.keys(tokenLabels)) if(/^#[0-9a-f]{6}$/i.test(overrides?.[key] || '')) palette[key]=overrides[key];
  return palette;
}
