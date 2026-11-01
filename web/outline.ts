import type { Heading } from './types';
export function outlineTree(headings: Heading[]) {
  const labels: string[] = [];
  const stack: number[] = [];
  const counters = new Map<number,number>();
  return headings.map((heading,index) => {
    while (stack.length && headings[stack[stack.length-1]].level >= heading.level) stack.pop();
    const parents = [...stack];
    const parent = stack[stack.length-1] ?? -1;
    counters.set(parent,(counters.get(parent) || 0)+1);
    const numbers = [...parents.map(i => labels[i]), String(counters.get(parent))];
    labels[index] = String(counters.get(parent));
    stack.push(index);
    return { ...heading, parents, number: numbers.join('.') };
  });
}
