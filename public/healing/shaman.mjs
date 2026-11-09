import {createPull} from './engine.mjs';
import {catalog, ranks} from './shaman-data.mjs';
import {loadouts, buffs, buildProfile} from './profile.mjs';

const root = document.querySelector('#healing');
const find = selector => root.querySelector(selector);
const byName = name => ranks.filter(row => row.name === name && row.level <= 60);
const whole = number => Math.floor(number).toLocaleString('en-US');
const clamp = number => Math.min(1, Math.max(0, number));
const fill = (element, fraction) => element.style.width = (100 * clamp(fraction)) + '%';
const countdown = seconds => seconds >= 60 ? Math.ceil(seconds / 60) + 'm' : Math.ceil(seconds) + 's';
let profile = buildProfile('Ungeared', new Set(), 0);
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
  ['stream', 'Healing Stream Totem', 'Alt + Left'],
  ['swiftness', "Nature's Swiftness", 'Activate'],
  ['tide', 'Mana Tide Totem', 'Activate'],
  ['potion', 'Major Mana Potion', 'Activate']
];
const utility = {
  swiftness: {offGcd: true, swiftness: true},
  tide: {party: true, waterTotem: true, period: 3, duration: 12, manaTick: 290},
  potion: {offGcd: true, manaRange: [1350, 2250]}
};

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
    falloff: effect?.falloff, party: key === 'stream', waterTotem: key === 'stream', dispel: key === 'poison',
    ...utility[key],
    directChainBonus: key === 'riptide' ? .25 : 0,
    rez: key === 'rez' ? Number(tooltip?.description?.match(/with (\d+) health/)?.[1] ?? 600) : 0};
}

const spellButtons = [];
const selects = [];
const frames = [];
let selected = 0;
let pull;
let currentSpells;
let enabled = new Set();
let last = performance.now();

function icon(name) {
  const image = document.createElement('img');
  const fallback = {"Nature's Swiftness": 'spell_nature_ravenform.jpg', 'Major Mana Potion': 'inv_potion_76.jpg'};
  image.src = new URL('./icons/' + (catalog[name]?.icon ?? fallback[name]), import.meta.url);
  image.alt = '';
  image.width = image.height = 34;
  return image;
}

for (const [index, [key, name, binding]] of slots.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  const art = document.createElement('span');
  art.className = 'spell-art';
  const timer = document.createElement('span');
  timer.className = 'spell-timer';
  art.append(icon(name), timer);
  button.append(art);
  const label = document.createElement('span');
  label.textContent = name;
  const shortcut = document.createElement('small');
  shortcut.textContent = binding;
  const cooldown = document.createElement('small');
  label.append(shortcut, cooldown);
  button.append(label);
  button.onclick = () => {
    if (utility[key]) {
      const previous = pull.state.meters[key]?.casts;
      pull.cast(key, encounter.party.length - 1);
      if (pull.state.meters[key]?.casts !== previous) playHealSound(false, 0);
    } else selected = index;
    render();
  };
  find('.heal-spells').append(button);
  spellButtons.push({button, timer, cooldown, key});

  const rows = key === 'potion' ? [{rank: '', cast: 0, gcd: 0, cooldown: 60, cost: 0, effects: []}] :
    byName(name).sort((a, b) => a.level - b.level || a.id - b.id).filter(row => key !== 'tide' || row.rank === 'Rank 4');
  const select = document.createElement('select');
  for (const row of rows) select.add(new Option(row.rank || 'Default', row.id));
  select.selectedIndex = rows.length - 1;
  const setting = document.createElement('label');
  setting.append(name, select);
  if (!utility[key]) find('[data-ranks]').append(setting);
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
  const auras = [['riptide', 'Riptide'], ['stream', 'Healing Stream Totem'], ['tide', 'Mana Tide Totem'],
    ['swiftness', "Nature's Swiftness"], ['poison', 'Poisoned Blade']]
    .map(([key, name]) => {
      const badge = document.createElement('span');
      badge.className = 'unit-aura ' + key;
      const timer = document.createElement('span');
      badge.append(icon(key === 'poison' ? 'Cure Poison' : name), timer);
      frame.lastElementChild.append(badge);
      return {key, name, badge, timer};
    });
  frames.push({frame, fill: frame.firstElementChild, label: frame.querySelector('strong'),
    health: frame.querySelector('small'), auras});
}

function attempt(event, index, right) {
  const slot = event.altKey && !right ? 6 : event.ctrlKey ? (right ? 5 : 4) :
    event.shiftKey ? (right ? 3 : 2) : right ? 1 : selected;
  pull.cast(slots[slot][0], index);
  render();
}

function reset(start = false) {
  currentSpells = Object.fromEntries(selects.map(({select, rows, key, name}) =>
    [key, spellFor(key, name, rows[select.selectedIndex])]));
  const power = find('[data-power]');
  enabled = new Set([...root.querySelectorAll('[data-buff]:checked')].map(input => input.value));
  profile = buildProfile(find('[data-loadout]').value, enabled, power.validity.valid ? Number(power.value) : 0);
  if (!enabled.has('potion')) delete currentSpells.potion;
  const party = encounter.party.map((unit, index) => index === encounter.party.length - 1 ? {...unit, max: profile.health} : unit);
  pull = createPull(profile, currentSpells, {...encounter, party}, Math.random, showHeal);
  updateSheet();
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
    for (const {key, name, badge, timer} of frame.auras) {
      const expires = key === 'swiftness' ? (i === frames.length - 1 ? s.swiftness : 0) :
        key === 'poison' ? unit.poison :
        s.effects.find(effect => effect.key === key && (!effect.target || effect.target === unit))?.expires ?? 0;
      badge.hidden = !unit.hp || expires <= s.time;
      if (!badge.hidden) {
        timer.textContent = Number.isFinite(expires) ? countdown(expires - s.time) : '✓';
        badge.title = name + ' · ' + timer.textContent;
      }
    }
  });
  fill(find('[data-mana-fill]'), s.mana / profile.mana);
  find('[data-mana]').textContent = whole(s.mana) + ' / ' + whole(profile.mana) + ' mana';
  fill(find('[data-regen]'), (s.time - s.lastSpend) / 5);
  fill(find('[data-cast-fill]'), s.cast ? 1 - (s.cast.end - s.time) / s.cast.spell.cast : 0);
  find('[data-cast]').textContent = s.cast ? s.cast.spell.name + ' → ' + s.cast.unit.name : '';
  const message = find('[data-message]');
  if (message.textContent !== s.message) message.textContent = s.message;
  spellButtons.forEach(({button, timer, cooldown, key}, index) => {
    const {select, rows} = selects[index];
    const base = rows[select.selectedIndex].cooldown;
    const remaining = Math.max(0, (s.cooldowns[key] ?? 0) - s.time);
    const spell = currentSpells[key];
    const gcd = active && !spell?.offGcd ? Math.max(0, s.gcd - s.time) : 0;
    button.hidden = !spell;
    timer.textContent = remaining ? countdown(remaining) : gcd ? gcd.toFixed(1) : '';
    cooldown.textContent = remaining ? 'Cooldown · ' + countdown(remaining) :
      base ? countdown(base) + ' cooldown' : '';
    button.setAttribute('aria-pressed', selected === index);
    if (spell) button.title = describeSpell(spell);
  });
  selects.forEach(({select}) => select.disabled = active);
  find('[data-power]').disabled = active;
  find('[data-loadout]').disabled = active;
  for (const input of root.querySelectorAll('[data-buff]')) input.disabled = active;
  renderMeters(s);
  const result = find('[data-result]');
  const score = ended ? s.survivors + '/5 survived · ' + whole(s.healing) + ' effective healing · ' +
    whole(s.healing / s.endedAt) + ' HPS · ' + whole(s.overheal) + ' overhealing · ' +
    whole(s.manaAtEnd) + ' mana left' : '';
  if (result.textContent !== score) result.textContent = score;
}

const equipment = {
  left: ['Head', 'Neck', 'Shoulders', 'Back', 'Chest', 'Shirt', 'Tabard', 'Wrists'],
  right: ['Hands', 'Waist', 'Legs', 'Feet', 'Finger 1', 'Finger 2', 'Trinket 1', 'Trinket 2'],
  weapons: ['Main hand', 'Off hand', 'Relic']
};
const gear = find('[data-loadout]');
for (const name of Object.keys(loadouts)) gear.add(new Option(name));
for (const [key, name, description] of buffs) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.value = key;
  input.dataset.buff = '';
  label.append(input, name + ' · ' + description);
  find('[data-buffs]').append(label);
}
for (const [group, names] of Object.entries(equipment)) {
  for (const name of names) {
    const image = document.createElement('img');
    const slot = name.toLowerCase().replace(/ [12]$/, '').replaceAll(' ', '');
    const file = {back: 'empty', chest: 'empty', tabard: 'empty'}[slot] ?? slot;
    image.src = new URL('./slots/' + file + '.jpg', import.meta.url);
    image.alt = image.title = name + ' · Empty';
    image.width = image.height = 36;
    find('[data-equipment="' + group + '"]').append(image);
  }
}
const statGroups = {
  Resources: {Health: 'health', Mana: 'mana', 'Base mana': 'baseMana'},
  Attributes: {Strength: 'strength', Agility: 'agility', Stamina: 'stamina',
    Intellect: 'intellect', Spirit: 'spirit'},
  Spell: {'Bonus healing': 'power', 'Spell crit': 'crit',
    'Mana / 5 sec while casting': 'mp5', 'Mana / 5 sec outside five-second rule': 'resting'}
};
const sheet = {};
for (const [name, stats] of Object.entries(statGroups)) {
  const heading = document.createElement('h3');
  heading.textContent = name;
  const list = document.createElement('dl');
  for (const [label, value] of Object.entries(stats)) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    sheet[value] = description;
    list.append(term, description);
  }
  find('[data-profile]').append(heading, list);
}
function updateSheet() {
  find('[data-loadout-label]').textContent = gear.value;
  for (const [key, field] of Object.entries(sheet)) {
    field.textContent = key === 'crit' ? (100 * profile.crit).toFixed(2) + '%' :
      key === 'resting' ? (profile.mp5 + 5 * profile.regen).toFixed(1) : whole(profile[key]);
  }
}
find('[data-power]').oninput = () => reset();
gear.onchange = () => reset();
find('[data-buffs]').onchange = () => reset();
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

function describeSpell(spell) {
  const line = [spell.name + (spell.rank ? ' · ' + spell.rank : ''), spell.cost + ' mana',
    spell.cast ? spell.cast + ' sec cast' : 'Instant'];
  if (spell.cooldown) line.push(spell.cooldown + ' sec cooldown');
  if (spell.low) {
    const bonus = spell.coefficient * profile.power;
    const range = (factor = 1) => whole(Math.round((spell.low + bonus) * factor)) + '–' +
      whole(Math.round((spell.high + bonus) * factor));
    line.push(range() + (spell.period ? ' healing per tick (' + Math.floor(spell.duration / spell.period) + ' ticks)' : ' healing on primary'));
    if (spell.chain > 1) line.push('Jumps: ' + range(spell.falloff) + ' / ' + range(spell.falloff ** 2));
    line.push((100 * spell.coefficient).toFixed(1) + '% bonus-healing coefficient' + (spell.period ? ' per tick' : ''));
  }
  if (spell.rez) line.push('Restores ' + spell.rez + ' health after combat');
  if (spell.dispel) line.push('Removes one poison');
  if (spell.swiftness) line.push('Makes your next cast-time Nature heal instant');
  if (spell.manaTick) line.push(spell.manaTick + ' mana every ' + spell.period + ' sec for ' + spell.duration + ' sec');
  if (spell.manaRange) line.push(spell.manaRange.map(whole).join('–') + ' mana restored');
  return line.join('\n');
}

const meterRows = new Map();
for (const [key, name] of slots) {
  const row = document.createElement('details');
  row.className = 'meter-row';
  const summary = document.createElement('summary');
  const label = document.createElement('span');
  label.append(icon(name), name);
  const total = document.createElement('strong');
  const breakdown = document.createElement('p');
  summary.append(label, total);
  row.append(summary, breakdown);
  find('[data-meter]').append(row);
  meterRows.set(key, {row, summary, total, breakdown});
}
function renderMeters(state) {
  find('[data-meter-empty]').hidden = !Object.values(state.meters).every(stats => !stats.hits);
  for (const [key, {row, summary, total, breakdown}] of meterRows) {
    const stats = state.meters[key];
    row.hidden = !stats?.hits;
    if (row.hidden) continue;
    const raw = stats.effective + stats.overheal;
    const percent = (part, all) => (all ? 100 * part / all : 0).toFixed(1) + '%';
    const share = percent(stats.effective, state.healing);
    total.textContent = whole(stats.effective) + ' · ' + share;
    summary.style.setProperty('--share', share);
    breakdown.textContent = stats.casts + ' casts · ' + stats.hits + ' healing events · ' +
      (stats.hits - stats.crits) + ' normal · ' + stats.crits + ' crits (' + percent(stats.crits, stats.hits) +
      ') · ' + whole(stats.overheal) + ' overhealing (' + percent(stats.overheal, raw) + ')';
    summary.title = breakdown.textContent;
  }
}

let audio;
find('[data-sound]').onchange = event => {
  if (!event.target.checked) return;
  if (!window.AudioContext) {
    event.target.checked = false;
    return;
  }
  audio ??= new AudioContext();
  audio.resume().catch(() => {});
};
function playHealSound(crit, bounce) {
  if (audio?.state !== 'running' || !find('[data-sound]').checked) return;
  const start = audio.currentTime;
  const tone = audio.createOscillator();
  const volume = audio.createGain();
  tone.type = 'sine';
  tone.frequency.setValueAtTime(crit ? 740 : 465 + bounce * 110, start);
  tone.frequency.exponentialRampToValueAtTime(crit ? 1250 : 700 + bounce * 100, start + .13);
  volume.gain.setValueAtTime(.045, start);
  volume.gain.exponentialRampToValueAtTime(.001, start + .22);
  tone.connect(volume).connect(audio.destination);
  tone.start(start);
  tone.stop(start + .23);
}

let visualPull = 0;
find('[data-start]').addEventListener('click', () => { visualPull++; });
function showHeal(event) {
  const pullId = visualPull;
  const draw = () => {
    if (pullId !== visualPull) return;
    const stage = find('.heal-stage');
    const bounds = stage.getBoundingClientRect();
    const target = frames[event.target].frame.getBoundingClientRect();
    const x = target.left + target.width / 2 - bounds.left;
    const y = target.top - bounds.top;
    const float = document.createElement('span');
    float.className = 'heal-float' + (event.crit ? ' is-crit' : '');
    float.setAttribute('aria-hidden', 'true');
    float.textContent = '+' + whole(event.effective) + (event.crit ? '!' : '');
    float.style.left = x + 'px';
    float.style.top = y + 'px';
    stage.append(float);
    setTimeout(() => float.remove(), 1000);
    if (event.from !== null) {
      const source = frames[event.from].frame.getBoundingClientRect();
      const fromX = source.left + source.width / 2 - bounds.left;
      const fromY = source.top - bounds.top + source.height / 2;
      const toY = y + target.height / 2;
      const beam = document.createElement('span');
      beam.className = 'heal-bounce';
      beam.setAttribute('aria-hidden', 'true');
      beam.style.left = fromX + 'px';
      beam.style.top = fromY + 'px';
      beam.style.width = Math.hypot(x - fromX, toY - fromY) + 'px';
      beam.style.transform = 'rotate(' + Math.atan2(toY - fromY, x - fromX) + 'rad)';
      stage.append(beam);
      setTimeout(() => beam.remove(), 500);
    }
    if (event.key !== 'stream' || event.target === frames.length - 1) playHealSound(event.crit, event.bounce);
  };
  if (event.bounce) setTimeout(draw, event.bounce * 145);
  else draw();
}

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
