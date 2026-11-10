export function mountTabs(root) {
  const tabs = [...root.querySelectorAll('[role=tab]')];
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

let activeTooltip;
window.addEventListener('scroll', () => activeTooltip?.hide(), {passive: true});

export function attachGameTooltip(button, render) {
  const tip = document.createElement('div');
  tip.className = 'game-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  const hide = () => {
    tip.hidden = true;
    tip.remove();
    if (activeTooltip === handle) activeTooltip = undefined;
  };
  const show = () => {
    activeTooltip?.hide();
    activeTooltip = handle;
    document.body.append(tip);
    render(tip);
    tip.hidden = false;
    const rect = button.getBoundingClientRect();
    const x = rect.right + 8 + tip.offsetWidth <= window.innerWidth ? rect.right + 8 : rect.left - tip.offsetWidth - 8;
    tip.style.left = Math.max(8, Math.min(x, window.innerWidth - tip.offsetWidth - 8)) + 'px';
    tip.style.top = Math.max(8, Math.min(rect.top, window.innerHeight - tip.offsetHeight - 8)) + 'px';
  };
  button.addEventListener('mouseenter', show);
  button.addEventListener('mouseleave', hide);
  button.addEventListener('focus', show);
  button.addEventListener('blur', hide);
  button.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  const handle = {refresh() { if (!tip.hidden) show(); }, hide};
  return handle;
}

export function tooltipLine(tip, text, style = '') {
  const line = document.createElement('div');
  line.className = style;
  line.textContent = text;
  tip.append(line);
}
