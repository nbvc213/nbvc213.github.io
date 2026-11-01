/** Enlarge a rendered table without changing its source or duplicating DOM IDs. */
export function enhanceTables(content: HTMLElement) {
  let viewer: HTMLDialogElement | undefined;
  for (const region of content.querySelectorAll<HTMLElement>('.table-scroll')) {
    const table = region.querySelector('table');
    if (!table || region.parentElement?.classList.contains('table-frame')) continue;
    const frame = document.createElement('div'); frame.className = 'table-frame';
    region.before(frame); frame.append(region);
    const tools = document.createElement('div'); tools.className = 'table-tools';
    const open = document.createElement('button'); open.type = 'button'; open.className = 'table-expand-icon';
    open.setAttribute('aria-label', '放大表格'); open.title = '放大表格'; open.setAttribute('aria-haspopup', 'dialog');
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    for (const [key,value] of Object.entries({width:'16',height:'16',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'})) svg.setAttribute(key,value);
    const use = document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttribute('href','/media/icons.svg#expand'); svg.append(use); open.append(svg);
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    frame.addEventListener('pointerenter', () => { clearTimeout(hideTimer); frame.classList.add('table-hover'); });
    frame.addEventListener('pointerleave', () => { clearTimeout(hideTimer); hideTimer = setTimeout(() => frame.classList.remove('table-hover'), 1000); });
    tools.append(open); frame.prepend(tools);
    open.addEventListener('click', () => {
      viewer?.remove();
      viewer = document.createElement('dialog'); viewer.className = 'table-viewer'; viewer.setAttribute('aria-label', '放大查看表格');
      const header = document.createElement('header'); header.className = 'table-viewer-header';
      const title = document.createElement('strong'); title.textContent = '表格阅读';
      const close = document.createElement('button'); close.type = 'button'; close.className = 'soft-button'; close.textContent = '关闭'; close.setAttribute('aria-label', '关闭表格');
      header.append(title, close);
      const scroll = document.createElement('div'); scroll.className = 'table-viewer-scroll prose'; scroll.tabIndex = 0; scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', '可横向和纵向滚动的放大表格');
      const copy = table.cloneNode(true) as HTMLTableElement;
      for (const node of [copy, ...copy.querySelectorAll('[id]')]) node.removeAttribute('id');
      scroll.append(copy); viewer.append(header, scroll); document.body.append(viewer);
      const modal = viewer;
      close.addEventListener('click', () => modal.close());
      let backdropDown = false;
      modal.addEventListener('pointerdown', event => { backdropDown = event.target === modal; });
      modal.addEventListener('click', event => { if (backdropDown && event.target === modal) modal.close(); backdropDown = false; });
      modal.addEventListener('close', () => { modal.remove(); open.focus({preventScroll:true}); });
      modal.showModal();
    });
  }
}
