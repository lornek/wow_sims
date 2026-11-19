// Reparent the same inputs so layout changes cannot reset values or duplicate handlers.
export function mountCustomStatsLayout(menu) {
  const character = menu.querySelector('#panel-character');
  const custom = menu.querySelector('#panel-custom');
  const customTab = menu.querySelector('#tab-custom');
  const characterTab = menu.querySelector('#tab-character');
  const layout = document.createElement('div');layout.className='character-layout';
  const sheet = character.querySelector('.character-sheet');sheet.before(layout);layout.append(sheet);
  const card = document.createElement('section');card.className='custom-stats-card';card.setAttribute('aria-labelledby','custom-stats-title');
  const header = document.createElement('header');const title=document.createElement('h2');title.id='custom-stats-title';title.textContent='Custom stats';header.append(title);
  const body = document.createElement('div');body.className='custom-stats-body';body.append(...custom.childNodes);card.append(header,body);custom.append(card);
  let inline;
  function update(width) {
    const next = width >= 1160;
    if (next === inline) return;
    inline = next;
    const active = document.activeElement, focused = card.contains(active);
    if (inline) {
      layout.append(card);layout.classList.add('has-custom-stats');
      if (customTab.getAttribute('aria-selected')==='true') characterTab.click();
      customTab.hidden=true;
    } else {
      custom.append(card);layout.classList.remove('has-custom-stats');customTab.hidden=false;
    }
    if (focused) active.focus({preventScroll:true});
  }
  const observer = new ResizeObserver(entries=>update(entries[0].contentRect.width));observer.observe(menu);
  update(menu.getBoundingClientRect().width);
  return ()=>observer.disconnect();
}
