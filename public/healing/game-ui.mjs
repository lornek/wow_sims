import {tooltipPosition} from './tooltip-layout.mjs';
export {mountTabs} from './tabs.mjs';

let activeTooltip;
let tooltipId = 0;
const textTooltips = new WeakMap();
export function hideGameTooltip() { activeTooltip?.hide(); }
export function hideGameTooltipWithin(container) {
  if (activeTooltip && container.contains(activeTooltip.trigger)) activeTooltip.hide();
}
window.addEventListener('scroll', event => {
  if (!event.target?.nodeType || !activeTooltip?.element.contains(event.target)) hideGameTooltip();
}, {passive:true,capture:true});
window.addEventListener('resize', hideGameTooltip);
window.addEventListener('keydown', event => { if (event.key === 'Escape') hideGameTooltip(); });
window.addEventListener('pointerdown', event => {
  if (activeTooltip && !activeTooltip.element.contains(event.target) && !activeTooltip.trigger.contains(event.target)) hideGameTooltip();
});

export function attachGameTooltip(button, render, {immediateLeave = false, followPointer = false} = {}) {
  const tip = document.createElement('div');
  tip.id = 'healbot-tooltip-' + ++tooltipId;
  tip.className = 'game-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  let timer;
  const cancelHide = () => clearTimeout(timer);
  const hide = () => {
    cancelHide();
    tip.hidden = true;
    tip.remove();
    const descriptions = (button.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== tip.id);
    if (descriptions.length) button.setAttribute('aria-describedby', descriptions.join(' '));
    else button.removeAttribute('aria-describedby');
    if (activeTooltip === handle) activeTooltip = undefined;
  };
  let pointer;
  const positionTip = () => {
    const anchor = button.querySelector('.spell-art') ?? button;
    const rect = followPointer && pointer ? {left:pointer.x,right:pointer.x,top:pointer.y,bottom:pointer.y,width:0,height:0} : anchor.getBoundingClientRect();
    const position = tooltipPosition(rect, tip.offsetWidth, tip.offsetHeight, window.innerWidth, window.innerHeight);
    tip.style.left = position.left + 'px'; tip.style.top = position.top + 'px';
  };
  const move = event => {pointer = {x:event.clientX,y:event.clientY}; if (!tip.hidden && followPointer) positionTip();};
  const show = event => {
    if (event?.type === 'focusin') pointer = null;
    if (event?.clientX !== undefined) pointer = {x:event.clientX,y:event.clientY};
    cancelHide();
    if (!button.isConnected) return hide();
    if (activeTooltip !== handle) activeTooltip?.hide();
    activeTooltip = handle;
    document.body.append(tip);
    tip.replaceChildren();
    render(tip);
    tip.hidden = false;
    const descriptions = new Set((button.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
    descriptions.add(tip.id);
    button.setAttribute('aria-describedby', [...descriptions].join(' '));
    positionTip();
  };
  const delayedHide = () => { cancelHide(); timer = setTimeout(hide, 120); };
  const escape = event => { if (event.key === 'Escape') hide(); };
  button.addEventListener('mouseenter', show);
  if (followPointer) button.addEventListener('mousemove', move);
  button.addEventListener('mouseleave', immediateLeave ? hide : delayedHide);
  button.addEventListener('focusin', show);
  button.addEventListener('focusout', delayedHide);
  button.addEventListener('keydown', escape);
  tip.addEventListener('mouseenter', cancelHide);
  tip.addEventListener('mouseleave', delayedHide);
  const handle = {element:tip,trigger:button,show,refresh() { if (!tip.hidden) show(); },hide,
    destroy() {
      hide();
      button.removeEventListener('mouseenter', show);
      button.removeEventListener('mousemove', move);
      button.removeEventListener('mouseleave', immediateLeave ? hide : delayedHide);
      button.removeEventListener('focusin', show);
      button.removeEventListener('focusout', delayedHide);
      button.removeEventListener('keydown', escape);
    }};
  return handle;
}

export function setGameTooltip(element, title, lines = []) {
  element.removeAttribute('title');
  element.setAttribute('data-tooltip-trigger', '');
  if (element.tabIndex < 0 && !element.matches('button,input,select,textarea,a[href],summary,label') && !element.querySelector('button,input,select,textarea,a[href],summary')) element.tabIndex = 0;
  let entry = textTooltips.get(element);
  const signature = JSON.stringify([title, lines]);
  if (entry?.signature === signature) return entry.handle;
  if (!entry) {
    entry = {title,lines};
    entry.handle = attachGameTooltip(element, tip => {
      tooltipLine(tip, entry.title, 'game-tooltip-title');
      for (const line of entry.lines) tooltipLine(tip, typeof line === 'string' ? line : line.text,
        typeof line === 'string' ? 'game-tooltip-description' : line.style);
    }, {followPointer:!!element.closest('.healing-breakdown, .healing-event-bars')});
    textTooltips.set(element, entry);
  }
  Object.assign(entry,{title,lines,signature});
  entry.handle.refresh();
  return entry.handle;
}

export function tooltipLine(tip, text, style = '') {
  if (!text) return;
  const line = document.createElement('div');
  line.className = style;
  line.textContent = text;
  tip.append(line);
}

export function tooltipValue(tip, label, value, style = '') {
  const row = document.createElement('div');
  row.className = 'game-tooltip-stat' + (style ? ' ' + style : '');
  const term = document.createElement('span');
  term.textContent = label;
  const amount = document.createElement('strong');
  amount.textContent = value;
  row.append(term, amount);
  tip.append(row);
}
