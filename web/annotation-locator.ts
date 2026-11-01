/** Location checksum only; stores no article text and is not a security hash. */
export function blockFingerprint(text:string) {
  let a=2166136261,b=0x9e3779b9;
  for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822519);}
  return `${text.length}-${(a>>>0).toString(16).padStart(8,'0')}${(b>>>0).toString(16).padStart(8,'0')}`;
}
export interface AnnotationLocator {version:2;blockHash:string;start:number;end:number}
export function resolveAnnotationBlock(blocks:Array<{text:string;anchor:string}>, anchor:string, locator:AnnotationLocator) {
  const matches=blocks.flatMap((block,i)=>block.anchor===anchor && blockFingerprint(block.text)===locator.blockHash && locator.start>=0 && locator.end>locator.start && locator.end<=block.text.length?[i]:[]);
  // Repeated paragraphs are ambiguous; never silently attach to the first match.
  return matches.length===1?matches[0]:-1;
}
