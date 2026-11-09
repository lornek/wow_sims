import {createPull} from './engine.mjs';
import {catalog, ranks} from './shaman-data.mjs';

const root = document.querySelector('#healing');
const find = selector => root.querySelector(selector);
const byName = name => ranks.filter(row => row.name === name && row.level <= 60);
const whole = number => Math.floor(number).toLocaleString('en-US');
const clamp = number => Math.min(1, Math.max(0, number));
const fill = (element, fraction) => element.style.width = (100 * clamp(fraction)) + '%';
const profile = {strength: 87, agility: 51, stamina: 98, intellect: 89, spirit: 99,
  health: 2260, baseMana: 1520, mana: 2575, crit: (2.3 + 89 * .0169) / 100,
  regen: 6.25 + 99 / 8, power: 0};
const encounter = {health: 12500, limit: 75, swing: 225, firstFlurry: 17, flurry: 265, poisonTick: 100,
  party: [
    {name: 'Tank', role: 'Warrior', max: 3200, dps: 22, color: '#986946'},
    {name: 'Melee', role: 'Rogue', max: 2450, dps: 92, color: '#918239'},
    {name: 'Ranged', role: 'Hunter', max: 2350, dps: 86, color: '#59763f'},
    {name: 'Caster', role: 'Mage', max: 2200, dps: 86, color: '#356981'},
    {name: 'You', role: 'Shaman', max: profile.health, dps: 0, color: '#34588d'}
  ]};
const slots = [
  ['lesser', 'Lesser Healing Wave', 'Left click'],
  ['wave', 'Healing Wave', 'Right click'],
  ['riptide', 'Riptide', 'Shift + Left'],
  ['poison', 'Cure Poison', 'Shift + Right'],
  ['chain', 'Chain Heal', 'Ctrl + Left'],
  ['rez', 'Ancestral Spirit', 'Ctrl + Right'],
  ['stream', 'Healing Stream Totem', 'Alt + Left']
];

function spellFor(key, name, row) {
  const entries = catalog[name]?.ranks ?? [];
  const tooltip = entries.find(entry => entry.rank === row.rank) ?? entries.at(-1);
  const effect = row.effects.find(e => e.type === 'E_HEAL' || e.aura === 'A_PERIODIC_HEAL');
  const range = tooltip?.description?.match(/for (\d[\d,]*) to (\d[\d,]*)/);
  const percent = tooltip?.details?.match(/(\d+)% of base mana/);
  const parsed = index => Number(range[index].replaceAll(',', ''));
  return {...row, key, name,
    cost: percent ? Math.floor(profile.baseMana * Number(percent[1]) / 100) : row.cost,
    low: range ? parsed(1) : effect?.base ?? 0, high: range ? parsed(2) : effect?.base ?? 0,
    coefficient: effect?.coefficient ?? 0, period: effect?.period, chain: effect?.chain,
    falloff: effect?.falloff, party: key === 'stream', dispel: key === 'poison',
    directChainBonus: key === 'riptide' ? .25 : 0,
    rez: key === 'rez' ? Number(tooltip?.description?.match(/with (\d+) health/)?.[1] ?? 600) : 0};
}

const spellButtons = [];
const selects = [];
const frames = [];
let selected = 0;
let pull;
let last = performance.now();

function icon(name) {
  const image = document.createElement('img');
  image.src = new URL('./icons/' + catalog[name].icon, import.meta.url);
  image.alt = '';
  image.width = image.height = 34;
  return image;
}

for (const [index, [key, name, binding]] of slots.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.append(icon(name));
  const label = document.createElement('span');
  label.textContent = name;
  const shortcut = document.createElement('small');
  shortcut.textContent = binding;
  label.append(shortcut);
  button.append(label);
  button.onclick = () => {
    selected = index;
    render();
  };
  find('.heal-spells').append(button);
  spellButtons.push(button);

  const rows = byName(name).sort((a, b) => a.level - b.level || a.id - b.id);
  const select = document.createElement('select');
  for (const row of rows) select.add(new Option(row.rank || 'Default', row.id));
  select.selectedIndex = rows.length - 1;
  const setting = document.createElement('label');
  setting.append(name, select);
  find('[data-ranks]').append(setting);
  selects.push({select, rows, key, name});
}

for (const [index, unit] of encounter.party.entries()) {
  const frame = document.createElement('button');
  frame.type = 'button';
  frame.className = 'heal-frame';
  frame.style.setProperty('--unit', unit.color);
  frame.innerHTML = '<span class="unit-fill"></span><strong></strong><small></small><span class="unit-status"></span>';
  frame.onclick = event => attempt(event, index, false);
  frame.oncontextmenu = event => {
    event.preventDefault();
    attempt(event, index, true);
  };
  find('.heal-party').append(frame);
  frames.push({frame, fill: frame.firstElementChild, label: frame.querySelector('strong'),
    health: frame.querySelector('small'), status: frame.lastElementChild});
}

function attempt(event, index, right) {
  const slot = event.altKey && !right ? 6 : event.ctrlKey ? (right ? 5 : 4) :
    event.shiftKey ? (right ? 3 : 2) : right ? 1 : selected;
  pull.cast(slots[slot][0], index);
  render();
}

function reset(start = false) {
  const spells = Object.fromEntries(selects.map(({select, rows, key, name}) =>
    [key, spellFor(key, name, rows[select.selectedIndex])]));
  const power = find('[data-power]');
  profile.power = power.validity.valid ? Number(power.value) : 0;
  pull = createPull({...profile}, spells, encounter);
  if (start) pull.start();
  render();
}

function render() {
  const s = pull.state;
  const active = s.phase === 'active';
  const ended = ['won', 'lost'].includes(s.phase);
  find('[data-start]').textContent = active ? 'Restart pull' : ended ? 'Pull again' : 'Start pull';
  find('[data-phase]').textContent = active ? whole(s.time) + ' sec · In combat' :
    s.phase === 'won' ? 'Boss defeated' : s.phase === 'lost' ? 'Wipe' : 'Ready to pull';
  fill(find('[data-boss-fill]'), s.boss / encounter.health);
  find('[data-boss]').textContent = Math.ceil(s.boss / encounter.health * 100) + '%';
  const flurry = active && s.nextFlurry - s.time <= 2;
  fill(find('[data-boss-cast-fill]'), flurry ? 1 - (s.nextFlurry - s.time) / 2 : 0);
  find('[data-boss-cast]').textContent = flurry ? 'Blade Flurry' : '';
  s.party.forEach((unit, i) => {
    const frame = frames[i];
    fill(frame.fill, unit.hp / unit.max);
    frame.label.textContent = unit.name + ' · ' + unit.role;
    frame.health.textContent = unit.hp ? whole(unit.hp) + ' / ' + whole(unit.max) : 'Dead';
    const hot = s.effects.some(effect => effect.target === unit);
    frame.status.textContent = [unit.poison > s.time ? 'Poison' : '', hot ? 'Riptide' : ''].filter(Boolean).join(' · ');
  });
  fill(find('[data-mana-fill]'), s.mana / profile.mana);
  find('[data-mana]').textContent = whole(s.mana) + ' / ' + whole(profile.mana) + ' mana';
  fill(find('[data-regen]'), (s.time - s.lastSpend) / 5);
  fill(find('[data-cast-fill]'), s.cast ? 1 - (s.cast.end - s.time) / s.cast.spell.cast : 0);
  find('[data-cast]').textContent = s.cast ? s.cast.spell.name + ' → ' + s.cast.unit.name : '';
  const message = find('[data-message]');
  if (message.textContent !== s.message) message.textContent = s.message;
  spellButtons.forEach((button, index) => button.setAttribute('aria-pressed', selected === index));
  selects.forEach(({select}) => select.disabled = active);
  find('[data-power]').disabled = active;
  const result = find('[data-result]');
  const score = ended ? s.survivors + '/5 survived · ' + whole(s.healing) + ' effective healing · ' +
    whole(s.healing / s.endedAt) + ' HPS · ' + whole(s.overheal) + ' overhealing · ' +
    whole(s.manaAtEnd) + ' mana left' : '';
  if (result.textContent !== score) result.textContent = score;
}

find('[data-profile]').textContent = 'Level 60 · Dwarf Shaman · ' + profile.health + ' health · ' +
  profile.mana + ' mana (' + profile.baseMana + ' base) · ' + profile.strength + ' Str · ' +
  profile.agility + ' Agi · ' + profile.stamina + ' Sta · ' + profile.intellect + ' Int · ' +
  profile.spirit + ' Spi · ' + (100 * profile.crit).toFixed(2) + '% spell crit';
find('[data-start]').onclick = () => reset(true);
for (const {select} of selects) select.onchange = () => { if (pull.state.phase === 'ready') reset(); };

const cards = Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b)).map(([name, entry]) => {
  const card = document.createElement('details');
  const title = document.createElement('summary');
  title.append(icon(name), name);
  card.append(title);
  for (const rank of entry.ranks) {
    const line = document.createElement('p');
    const row = byName(name).find(candidate => candidate.rank === rank.rank);
    const effects = row?.effects.filter(effect => effect.coefficient) ?? [];
    const coefficients = effects.map(effect => (effect.coefficient * 100).toFixed(1) + '%' +
      (effect.period ? ' per ' + effect.period + ' sec' : ''));
    line.textContent = [rank.rank, rank.details, rank.description,
      coefficients.length ? 'Coefficient ' + coefficients.join(' / ') : ''].filter(Boolean).join(' · ');
    card.append(line);
  }
  find('[data-catalog]').append(card);
  return {card, name};
});
find('[data-filter]').oninput = event => {
  const query = event.target.value.trim().toLowerCase();
  for (const {card, name} of cards) card.hidden = !name.toLowerCase().includes(query);
};

reset();
function frame(now) {
  const delta = Math.min(.1, (now - last) / 1000);
  last = now;
  if (pull.state.phase !== 'ready') {
    pull.step(delta);
    render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
