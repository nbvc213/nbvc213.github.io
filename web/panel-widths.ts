export function fitPanelWidths(total:number,left:number,right:number,leftVisible:boolean,rightVisible:boolean){
  const clamp=(value:number)=>Math.max(180,Math.min(360,Number.isFinite(value)?value:220));
  let l=leftVisible?clamp(left):0,r=rightVisible?clamp(right):0;
  const excess=Math.max(0,l+r-Math.max(0,total-480));
  if(excess){if(l&&r){l-=excess/2;r-=excess/2;}else if(l)l-=excess;else r-=excess;}
  // Round down so two half-pixels cannot consume the article's final pixel.
  return {left:Math.floor(l),right:Math.floor(r)};
}
