export function mountTabs(root) {
  const tabList = root.matches('[role=tablist]') ? root : root.querySelector('[role=tablist]');
  const tabs = [...(tabList?.querySelectorAll('[role=tab]') ?? [])]
    .filter(tab => tab.closest('[role=tablist]') === tabList);
  const select = index => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', i === index);
      tab.tabIndex = i === index ? 0 : -1;
      root.querySelector('#' + tab.getAttribute('aria-controls')).hidden = i !== index;
    });
  };
  tabs.forEach((tab, index) => {
    tab.onclick = () => select(index);
    tab.onkeydown = event => {
      const next = {ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length,
        Home: 0, End: tabs.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      tabs[next].focus();
    };
  });
  select(0);
}
