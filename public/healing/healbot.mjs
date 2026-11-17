import {mountHealing} from './healing-ui.mjs';

const loaders = {
  shaman: () => import('./shaman.mjs'),
  druid: () => import('./druid.mjs'),
  paladin: () => import('./paladin.mjs'),
  priest: () => import('./priest.mjs')
};
const labels = {
  shaman: ['Dwarf Shaman', 'Mindfulness'],
  druid: ['Night Elf Druid', 'Reflection'],
  paladin: ['Human Paladin', 'Reverence'],
  priest: ['Human Priest', 'Meditation']
};
const modules = new Map();
function load(healer) {
  if (!modules.has(healer)) {
    modules.set(healer, loaders[healer]().catch(error => {
      modules.delete(healer);
      throw error;
    }));
  }
  return modules.get(healer);
}

const header = document.querySelector('.healbot-header');
const root = document.querySelector('#healing');
const links = [...header.querySelectorAll('[data-healbot-class]')];
const dynamicAreas = [
  '.heal-menu', '.spell-inspector', '.heal-spells', '[data-buffs]', '.healing-score'
].map(selector => [selector, root.querySelector(selector).cloneNode(true)]);
const encounter = root.querySelector('[data-encounter]');
const difficulty = root.querySelector('[data-difficulty]');
let unmount;
let navigation = 0;

function mount(healer, config) {
  if (unmount) {
    unmount();
    for (const [selector, template] of dynamicAreas) {
      root.querySelector(selector).replaceWith(template.cloneNode(true));
    }
  }
  document.body.dataset.healer = healer;
  const [title, regenTalent] = labels[healer];
  root.querySelector('#character-title').textContent = title;
  root.querySelector('[data-regen-talent]').textContent = regenTalent;
  root.querySelector('[data-character-icon]').src = new URL('../assets/' + healer + '.jpg', import.meta.url);
  root.querySelector('[data-spellbook-source]').href = 'https://wowforevertalents.com/abilities/' + healer + '/';
  const spec = new URLSearchParams(location.search).get('spec') === 'holy' ? 'holy' : 'discipline';
  for (const link of links) {
    const active = link.dataset.healbotClass === healer &&
      (!link.dataset.healbotSpec || link.dataset.healbotSpec === spec);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.title = 'Healbot · ' + (healer === 'priest' ? (spec === 'holy' ? 'Holy Priest' : 'Discipline Priest') : title.split(' ').at(-1));
  unmount = mountHealing(config);
}

async function navigate(healer, destination) {
  const request = ++navigation;
  header.setAttribute('aria-busy', 'true');
  try {
    const {default: config} = await load(healer);
    if (request !== navigation) return;
    if (destination) {
      destination.searchParams.set('encounter', encounter.value);
      destination.searchParams.set('difficulty', difficulty.value);
      history.pushState(null, '', destination);
    }
    mount(healer, config);
  } catch {
    if (request === navigation) location.assign(destination ?? location.href);
  } finally {
    if (request === navigation) header.removeAttribute('aria-busy');
  }
}

header.addEventListener('click', event => {
  const link = event.target.closest('[data-healbot-class]');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (link.hasAttribute('aria-current')) {
    navigation++;
    header.removeAttribute('aria-busy');
    return;
  }
  navigate(link.dataset.healbotClass, new URL(link.href));
});
window.addEventListener('popstate', () => {
  const link = links.find(link => new URL(link.href).pathname === location.pathname);
  if (link) navigate(link.dataset.healbotClass);
});

const initial = document.body.dataset.healer;
mount(initial, (await load(initial)).default);
const connection = navigator.connection;
if (!connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType)) {
  const queue = Object.keys(loaders).filter(healer => healer !== initial);
  const preload = () => {
    if (!queue.length) return;
    const next = async () => {
      await load(queue.shift()).catch(() => {});
      preload();
    };
    if ('requestIdleCallback' in window) requestIdleCallback(next);
    else setTimeout(next, 1500);
  };
  preload();
}
