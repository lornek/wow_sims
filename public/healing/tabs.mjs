export function mountTabs(root) {
  const tabList = root.matches('[role=tablist]') ? root : root.querySelector('[role=tablist]');
  const tabs = [...(tabList?.querySelectorAll('[role=tab]') ?? [])]
    .filter(tab => tab.closest('[role=tablist]') === tabList);
  const select = index => {
    if (tabs[index]?.hidden) return;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', i === index);
      tab.tabIndex = i === index ? 0 : -1;
      root.querySelector('#' + tab.getAttribute('aria-controls')).hidden = i !== index;
    });
  };
  tabs.forEach((tab, index) => {
    tab.onclick = () => select(index);
    tab.onkeydown = event => {
      const visible = tabs.filter(tab=>!tab.hidden);
      const position = visible.indexOf(tab);
      const next = {ArrowRight: (position + 1) % visible.length, ArrowLeft: (position + visible.length - 1) % visible.length,
        Home: 0, End: visible.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(tabs.indexOf(visible[next]));
      visible[next].focus();
    };
  });
  select(0);
}
