import {mountTabs, attachGameTooltip, tooltipLine} from './game-ui.mjs';
import {encounters, combatants} from './party-combat.mjs';
import {createPull} from './engine.mjs';
import {mountTalentTree} from './talent-tree.mjs';

const damageIcons = {
  'Melee': 'ability_meleedamage',
  'Heroic Strike': 'ability_rogue_ambush',
  'Shield Slam': 'inv_shield_05',
  'Revenge': 'ability_warrior_revenge',
  'Main-hand swing': 'ability_meleedamage',
  'Off-hand swing': 'inv_sword_04',
  'Sinister Strike': 'spell_shadow_ritualofsacrifice',
  'Eviscerate': 'ability_rogue_eviscerate',
  'Auto Shot': 'inv_weapon_bow_07',
  'Aimed Shot': 'inv_spear_07',
  'Multi-Shot': 'ability_upgrademoonglaive',
  'Frostbolt': 'spell_frost_frostbolt02',
  'Fireball': 'spell_fire_flamebolt'
};

export function mountHealing({className, healer, healerColor, catalog, ranks, spellGroups, loadouts, buffs, talents,
  applyTalents, buildProfile, trees, slots, utility, defaultTalents, schools, schoolIcons, unlocks, auras, healingKeys,
  configureSpell = spell => spell, extraMeters = [], presets, hazard = 'poison'}) {
  const settingsKey = 'wow-forever-sims.' + className + '.v1';
  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem(settingsKey)) ?? {};
    } catch {
      return {};
    }
  }
  const saved = readSettings();

  const root = document.querySelector('#healing');
  root.dataset.healerClass = className;
  const find = selector => root.querySelector(selector);
  const byName = name => ranks.filter(row => row.name === name && row.level <= 60);
  const whole = number => Math.floor(number).toLocaleString('en-US');
  const clamp = number => Math.min(1, Math.max(0, number));
  const fill = (element, fraction) => element.style.width = (100 * clamp(fraction)) + '%';
  const countdown = seconds => seconds >= 60 ? Math.ceil(seconds / 60) + 'm' : Math.ceil(seconds) + 's';
  const sweep = (icon, fraction) => icon.style.setProperty('--cooldown-sweep', (100 * clamp(fraction)) + '%');
  let profile = buildProfile('Ungeared', new Set(), 0);
  const encounter = {party: [
      {name: 'Cairne', role: 'Tank', max: 3200, dps: 22, color: '#a97043'},
      {name: 'Illidan', role: 'Damage', max: 2450, dps: 92, color: '#9a50be'},
      {name: 'Sylvanas', role: 'Damage', max: 2350, dps: 86, color: '#548e30'},
      {name: 'Jaina', role: 'Damage', max: 2200, dps: 86, color: '#247fa3'},
      {name: healer, role: 'Healer', max: profile.health, dps: 0, color: healerColor}
    ]};
  let currentEncounter = encounter;
  const difficulty = find('[data-difficulty]');
  const encounterSelect = find('[data-encounter]');
  if (Object.hasOwn(encounters, saved.encounter)) encounterSelect.value = saved.encounter;
  if (Number.isInteger(saved.difficulty) && saved.difficulty >= 0 && saved.difficulty <= 3) difficulty.value = saved.difficulty;
  function spellFor(key, name, row) {
    const entries = catalog[name]?.ranks ?? [];
    const tooltip = entries.find(entry => entry.rank === row.rank) ?? entries.at(-1);
    const effect = row.effects.find(e => e.type === 'E_HEAL' || e.aura === 'A_PERIODIC_HEAL');
    const range = tooltip?.description?.match(/for (\d[\d,]*) to (\d[\d,]*)/);
    const percent = tooltip?.details?.match(/(\d+)% of base mana/);
    const parsed = index => Number(range[index].replaceAll(',', ''));
    return configureSpell({...row, key, name,
      cost: percent || row.costPct ? Math.floor(profile.baseMana * (percent ? Number(percent[1]) : row.costPct) / 100) : row.cost,
      low: range ? parsed(1) : effect?.base ?? 0, high: range ? parsed(2) : effect?.base ?? 0,
      coefficient: effect?.coefficient ?? 0, period: effect?.period, chain: effect?.chain,
      falloff: effect?.falloff, party: key === 'stream', waterTotem: key === 'stream', dispel: key === 'poison',
      ...utility[key],
      directChainBonus: key === 'riptide' ? .25 : 0}, row, tooltip, profile);
  }

  const spellButtons = [];
  const selects = [];
  const frames = [];
  let selected = 0;
  let touchTarget = null;
  const touchInput = event => event.pointerType === 'touch' ||
    (!event.pointerType && matchMedia('(pointer: coarse)').matches);
  let pendingTargetSpell = null;
  let pull;
  let currentSpells;
  let enabled = new Set();
  let inspected = null;
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
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', name);
    const art = document.createElement('span');
    art.className = 'spell-art';
    const timer = document.createElement('span');
    timer.className = 'spell-timer';
    art.append(icon(name), timer);
    button.append(art);
    const label = document.createElement('span');
    label.className = 'spell-label';
    label.textContent = name;
    const shortcut = document.createElement('small');
    shortcut.className = 'spell-shortcut';
    shortcut.textContent = binding;
    const cooldown = document.createElement('small');
    label.append(shortcut, cooldown);
    button.append(label);
    button.onclick = event => {
      if (utility[key]) {
        const previous = pull.state.meters[key]?.casts;
        pull.cast(key, encounter.party.length - 1);
        if (pull.state.meters[key]?.casts !== previous) playHealSound(false, 0);
      } else if (touchInput(event)) {
        if (touchTarget === null || !pull.state.party[touchTarget].hp) {
          pull.state.message = 'Tap a living party member first.';
        } else {
          pull.cast(key, touchTarget);
        }
      } else {
        selected = index;
        pendingTargetSpell = key;
        saveSettings();
      }
      render();
    };
    button.oncontextmenu = event => {
      event.preventDefault();
      openInspector(index);
    };
    button.onkeydown = event => {
      if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
      event.preventDefault();
      openInspector(index);
    };
    find('.heal-spells').append(button);
    spellButtons.push({button, art, timer, cooldown, key});

    const rows = key === 'potion' ? [{rank: '', cast: 0, gcd: 0, cooldown: 60, cost: 0, effects: []}] :
      byName(name).sort((a, b) => a.level - b.level || a.id - b.id).filter(row => key !== 'tide' || row.rank === 'Rank 4');
    const select = document.createElement('select');
    for (const row of rows) select.add(new Option(row.rank || 'Default', row.id));
    select.selectedIndex = rows.length - 1;
    if ([...select.options].some(option => option.value === saved.ranks?.[key])) select.value = saved.ranks[key];
    const setting = document.createElement('label');
    setting.append(name, select);
    selects.push({select, rows, key, name, setting});
  }

  const roleSymbols = {Tank: 'M12 2 3 6v6c0 5 5 9 9 11 4-2 9-6 9-11V6z',
    Damage: 'm21 2-2 7-9 9-2-2 9-9 4-5zM3 17l2-2 6 6-2 2zM2 22l4-4 2 2-4 4z',
    Healer: 'M9 2h6v7h7v6h-7v7H9v-7H2V9h7z'};
  const bossActions = find('[data-boss-actions]');
  let bossAbilityRows = [];
  function mountBossAbilities(id) {
    if (bossActions.dataset.encounter === id) return;
    for (const ability of bossAbilityRows) ability.tooltip.hide();
    bossActions.dataset.encounter = id;
    const attack = ['Melee', 'ability_meleedamage', 'nextSwing', 2,
      boss => whole(boss.swing) + ' physical damage to the first living party member, normally Cairne.'];
    const special = {
      rend: [
        ['Poisoned Blade', 'ability_poisons', 'nextPoison', 11,
          boss => 'Marks a random living party member for 10 sec. Deals ' + whole(boss.poisonTick) +
            ' damage on each boss swing while marked. The effect can be dispelled.'],
        ['Blade Flurry', 'ability_rogue_slicedice', 'nextFlurry', 9,
          boss => whole(boss.flurry) + ' physical damage to every living party member. First used at 17 sec.'],
        ['Enrage', 'spell_shadow_unholyfrenzy', null, 0,
          () => 'At 35% health, Rend attacks and uses abilities 20% faster for the rest of the fight.']
      ],
      patchwerk: [['Hateful Strike', 'ability_warrior_punishingblow', 'nextSpecial', 3,
        boss => whole(boss.strike) + ' physical damage to Illidan. If Illidan is down, it hits the first living party member.']],
      sapphiron: [['Frost Aura', 'spell_frost_frostarmor', 'nextSpecial', 2,
        boss => whole(boss.frost) + ' Frost damage to every living party member on each pulse.']]
    };
    bossAbilityRows = [attack, ...special[id]].map(([name, art, clock, period, description]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', name);
      const graphic = document.createElement('span');
      graphic.className = 'spell-art';
      const image = document.createElement('img');
      image.src = new URL('./icons/' + art + '.jpg', import.meta.url);
      image.alt = '';
      image.width = image.height = 38;
      const timer = document.createElement('small');
      graphic.append(image, timer);
      button.append(graphic);
      const tooltip = attachGameTooltip(button, tip => {
        const boss = currentEncounter;
        tooltipLine(tip, clock === 'nextPoison' && boss.hazard === 'disease' ? 'Infected Blade' : name, 'game-tooltip-title');
        tooltipLine(tip, description(boss), 'game-tooltip-description');
        if (clock) tooltipLine(tip, 'Every ' + period + ' sec before any haste effects');
      });
      return {button, graphic, timer, clock, period, tooltip};
    });
    bossActions.replaceChildren(...bossAbilityRows.map(ability => ability.button));
  }

  const damageMeter = find('[data-damage-meter]');
  const damageRows = [];
  for (const [index, unit] of encounter.party.entries()) {
    const frame = document.createElement('button');
    frame.type = 'button';
    frame.className = 'heal-frame';
    frame.style.setProperty('--unit', unit.color);
    frame.innerHTML = '<span class="unit-fill"></span><span class="unit-incoming" aria-hidden="true"></span>' +
      '<strong><svg class="unit-role" viewBox="0 0 24 24" role="img" aria-label="' + unit.role +
      '"><title>' + unit.role + '</title><path d="' + roleSymbols[unit.role] +
      '"/></svg><span class="unit-name"></span></strong><small></small><span class="unit-status"></span>';
    let resource;
    if (combatants[unit.name]) {
      const track = document.createElement('span');
      track.className = 'party-resource ' + combatants[unit.name].resource.toLowerCase();
      resource = document.createElement('span');
      track.append(resource);
      frame.append(track);
      const row = document.createElement('details');
      row.className = 'meter-row';
      row.style.setProperty('--damage-class', unit.color);
      const summary = document.createElement('summary');
      const breakdown = document.createElement('div');
      breakdown.className = 'damage-breakdown';
      const label = document.createElement('span');
      const value = document.createElement('span');
      summary.append(label, value);
      row.append(summary, breakdown);
      damageMeter.append(row);
      label.textContent = unit.name;
      damageRows[index] = {row, value, breakdown, lines: new Map()};
    } else {
      frame.insertAdjacentHTML('beforeend', '<span class="party-resource mana"><span data-mana-fill></span></span>');
    }
    frame.onclick = event => {
      if (!touchInput(event)) return attempt(event, index, false);
      if (!pull.state.party[index].hp) return;
      touchTarget = index;
      render();
    };
    frame.oncontextmenu = event => {
      event.preventDefault();
      attempt(event, index, true);
    };
    find('.heal-party').append(frame);
    const badges = [...auras,
      ['swiftness', "Nature's Swiftness"], ['poison', hazard === 'disease' ? 'Infected Blade' : 'Poisoned Blade']]
      .map(([key, name]) => {
        const badge = document.createElement('span');
        badge.className = 'unit-aura ' + key;
        const timer = document.createElement('span');
        badge.append(icon(key === 'poison' ? slots[3][1] : name), timer);
        frame.querySelector('.unit-status').append(badge);
        return {key, name, badge, timer};
      });
    frames.push({frame, fill: frame.firstElementChild, incoming: frame.querySelector('.unit-incoming'), label: frame.querySelector('.unit-name'),
      health: frame.querySelector(':scope > small'), resource, auras: badges});
  }

  function attempt(event, index, right) {
    if (!right && pendingTargetSpell && currentSpells[pendingTargetSpell]) {
      const key = pendingTargetSpell;
      pendingTargetSpell = null;
      pull.cast(key, index);
      render();
      return;
    }
    pendingTargetSpell = null;
    const button = right ? 'Right' : 'Left';
    const binding = event.altKey && !right ? 'Alt + Left' : event.ctrlKey ? 'Ctrl + ' + button :
      event.shiftKey ? 'Shift + ' + button : right ? 'Right click' : '';
    const active = slots[selected];
    const key = !binding || (active[2] === binding && currentSpells[active[0]]) ? active[0] :
      slots.find(([key, , shortcut]) => shortcut === binding && currentSpells[key])?.[0];
    if (key) pull.cast(key, index);
    render();
  }

  let talentPoints;
  function configuredSpells() {
    const points = talentPoints = Object.fromEntries(talents.map(([key, name]) => [key, talentTree.build[name] ?? 0]));
    const power = find('[data-power]');
    enabled = new Set([...root.querySelectorAll('[data-buff]:checked')].map(input => input.value));
    profile = buildProfile(gear.value, enabled, power.validity.valid ? Number(power.value) : 0, points);
    currentSpells = Object.fromEntries(selects.map(({select, rows, key, name}) =>
      [key, applyTalents(spellFor(key, name, rows[select.selectedIndex]), points)]));
    if (!enabled.has('potion')) delete currentSpells.potion;
    for (const [key, name] of slots.filter(([key]) => unlocks.includes(key))) {
      if (!talentTree.build[name]) delete currentSpells[key];
    }
    if (!currentSpells[slots[selected][0]]) selected = 0;
  }

  function reset(start = false, persist = true) {
    touchTarget = null;
    root.querySelectorAll('.heal-float, .heal-bounce').forEach(effect => effect.remove());
    configuredSpells();
    const level = Number(difficulty.value);
    const id = encounterSelect.value;
    const boss = encounters[id];
    const damage = 1.1 * (1.15 * 1.1) ** level;
    const health = 1.3 ** level;
    const allyHealth = 1.1 ** level;
    const tankHealth = 1.16 ** level;
    const party = encounter.party.map((unit, index) => ({
      ...unit,
      max: Math.round(index === encounter.party.length - 1 ? profile.health : unit.max * (unit.role === 'Tank' || id === 'patchwerk' && index === 1 ? tankHealth : allyHealth) * (id === 'patchwerk' && index === 1 ? 1.3 : 1))
    }));
    currentEncounter = {...boss, id, party, hazard, startWaterShield: enabled.has('waterShield'),
      health: Math.round(boss.health * health), limit: boss.limit * health};
    for (const key of ['swing', 'flurry', 'poisonTick', 'strike', 'frost']) {
      if (boss[key]) currentEncounter[key] = Math.round(boss[key] * damage);
    }
    find('[data-boss-name]').textContent = boss.name;
    difficulty.dataset.level = difficulty.value;
    mountBossAbilities(id);
    find('.heal-stage').dataset.encounter = id;
    const portrait = find('[data-boss-portrait]');
    const portraitUrl = new URL('./portraits/' + id + '.jpg', import.meta.url).href;
    if (portrait.src !== portraitUrl) portrait.src = portraitUrl;
    pull = createPull(profile, currentSpells, currentEncounter, Math.random, showHeal);
    updateSheet();
    if (start) pull.start();
    render();
    if (persist) saveSettings();
  }

  function render() {
    const s = pull.state;
    const charges = s.waterShield?.expires > s.time ? s.waterShield.charges : 0;
    if (waterBuff) {
      waterBuff.label.classList.toggle('buff-live', !!charges);
      waterBuff.count.textContent = currentSpells.waterShield ? charges : '';
    }
    const active = s.phase === 'active';
    const ended = ['won', 'lost'].includes(s.phase);
    find('[data-start]').textContent = s.phase === 'ready' ? '⚔ PULL! ⚔' : 'Reset';
    find('[data-phase]').textContent = active ? whole(s.time) + ' sec · ' + (s.enraged ? 'Enraged' : 'In combat') :
      s.phase === 'won' ? 'Boss defeated' : s.phase === 'lost' ? 'Wipe' : '';
    fill(find('[data-boss-fill]'), s.boss / currentEncounter.health);
    find('[data-boss]').textContent = whole(s.boss) + ' / ' + whole(currentEncounter.health);
    for (const ability of bossAbilityRows) {
      const remaining = ability.clock ? Math.max(0, s[ability.clock] - s.time) : 0;
      const period = ability.period / (s.enraged ? 1.2 : 1);
      sweep(ability.graphic, active && ability.clock ? 1 - remaining / period : 0);
      ability.timer.textContent = active ? (ability.clock ? countdown(remaining) : s.enraged ? 'Active' : '35%') : '';
      ability.button.classList.toggle('is-enraged', !ability.clock && !!s.enraged);
    }
    find('[data-boss-percent]').textContent = Math.ceil(100 * s.boss / currentEncounter.health) + '%';
    const specialAt = currentEncounter.id === 'patchwerk' ? s.nextSpecial : s.nextFlurry;
    const flurry = active && specialAt - s.time <= 2;
    fill(find('[data-boss-cast-fill]'), flurry ? 1 - (specialAt - s.time) / 2 : 0);
    find('[data-boss-cast]').textContent = flurry ? (currentEncounter.id === 'patchwerk' ? 'Hateful Strike' : 'Blade Flurry') : '';
    const incoming = pull.incomingHealing();
    s.party.forEach((unit, i) => {
      const frame = frames[i];
      fill(frame.fill, unit.hp / unit.max);
      frame.incoming.style.left = (100 * unit.hp / unit.max) + '%';
      fill(frame.incoming, incoming[i] / unit.max);
      frame.label.textContent = unit.name + (currentEncounter.id === 'patchwerk' && i === 1 ? ' · Off-tank' : '');
      if (frame.resource && unit.resource) {
        fill(frame.resource, unit.resource.value / unit.resource.max);
        frame.resource.parentElement.title = unit.resource.type + ' · ' + whole(unit.resource.value) + ' / ' + unit.resource.max;
        const entry = damageRows[i];
        const {row, value, breakdown} = entry;
        const abilities = Object.entries(unit.damage).sort((a,b) => b[1].total - a[1].total);
        const total = abilities.reduce((sum, [, ability]) => sum + ability.total, 0);
        entry.dps = total / (s.endedAt || s.time || 1);
        value.textContent = whole(total) + ' · ' + whole(entry.dps) + ' DPS';
        if (row.open) {
          const damaging = abilities.filter(([, data]) => data.total > 0);
          damaging.forEach(([name, data], index) => {
            let line = entry.lines.get(name);
            if (!line) {
              const element = document.createElement('div');
              const image = document.createElement('img');
              image.src = new URL('./icons/' + (damageIcons[name] ?? damageIcons.Melee) + '.jpg', import.meta.url);
              image.alt = name;
              image.title = name;
              const numbers = document.createElement('span');
              element.append(image, numbers);
              line = {element, numbers};
              entry.lines.set(name, line);
            }
            line.element.style.setProperty('--damage-hue', (index % 5 * (unit.name === 'Jaina' ? -10 : 7)) + 'deg');
            line.element.style.setProperty('--damage-tint', (28 + index % 5 * 7) + '%');
            line.numbers.textContent = whole(data.total) + ' · ' + whole(data.total / (s.endedAt || s.time || 1)) + ' DPS';
            const current = breakdown.children[index];
            if (current !== line.element) breakdown.insertBefore(line.element, current ?? null);
          });
          while (breakdown.children.length > damaging.length) breakdown.lastElementChild.remove();
        }
      }
      frame.frame.classList.toggle('touch-target', i === touchTarget && !!unit.hp);
      frame.health.textContent = unit.hp ? whole(unit.hp) + ' / ' + whole(unit.max) : 'Dead';
      for (const {key, name, badge, timer} of frame.auras) {
        const effect = s.effects.find(effect => effect.key === key && (!effect.target || effect.target === unit));
        const expires = key === 'swiftness' ? (i === frames.length - 1 ? s.swiftness : 0) :
          key === 'poison' ? unit.poison :
          key === 'innervate' && unit === s.party[4] ? s.innervateUntil :
          unit[key]?.expires && (unit[key].amount === undefined || unit[key].amount > 0) ? unit[key].expires :
          key === 'weakened' ? unit.weakened ?? 0 :
          s[key]?.target === unit ? s[key].expires :
          typeof s[key] === 'number' && i === frames.length - 1 ? s[key] :
          effect?.expires ?? 0;
        badge.hidden = !unit.hp || expires <= s.time;
        if (!badge.hidden) {
          const duration = {poison:10, weakened:15, aegis:12, inspiration:15, mending:30,
            innervate:currentSpells.innervate?.duration, powerInfusion:currentSpells.pi?.duration}[key] ??
            s[key]?.spell?.duration ?? currentSpells[key]?.duration ?? (key === 'abolish' ? currentSpells.poison?.duration : 0);
          sweep(badge, Number.isFinite(expires) && duration > 0 ? 1 - (expires - s.time) / duration : 0);
          timer.textContent = Number.isFinite(expires) ? countdown(expires - s.time) : '✓';
          badge.title = name + ' · ' + timer.textContent;
        }
      }
    });
    const ranking = damageRows.slice().sort((a, b) => b.dps - a.dps);
    const leadingDps = ranking[0]?.dps || 1;
    ranking.forEach(({row, dps}, index) => {
      row.style.setProperty('--share', (100 * dps / leadingDps) + '%');
      const current = damageMeter.children[index];
      if (current !== row) damageMeter.insertBefore(row, current);
    });
    for (const field of root.querySelectorAll('[data-mana-fill]')) fill(field, s.mana / profile.mana);
    for (const field of root.querySelectorAll('[data-mana-current]')) field.textContent = whole(s.mana);
    for (const field of root.querySelectorAll('[data-mana-max]')) field.textContent = whole(profile.mana);
    find('[data-mana-rate]').textContent = '+' + pull.manaRegenRate().toFixed(1) + ' mana/sec';
    fill(find('[data-regen]'), (s.time - s.lastSpend) / 5);
    fill(find('[data-cast-fill]'), s.cast ? 1 - (s.cast.end - s.time) / s.cast.duration : 0);
    find('[data-cast]').textContent = s.cast ? s.cast.spell.name + ' → ' + s.cast.unit.name : '';
    spellButtons.forEach(({button, art, timer, cooldown, key}, index) => {
      const {select, rows} = selects[index];
      const base = currentSpells[key]?.cooldown ?? rows[select.selectedIndex].cooldown;
      const remaining = Math.max(0, (s.cooldowns[key] ?? 0) - s.time);
      const spell = currentSpells[key];
      const gcd = active && !spell?.offGcd ? Math.max(0, s.gcd - s.time) : 0;
      button.hidden = !spell;
      sweep(art, remaining && base ? 1 - remaining / base : gcd ? 1 - gcd / s.gcdDuration : 0);
      const needsMana = !!spell && s.mana < spell.cost && !(key !== 'focus' && s.innerFocus > s.time);
      art.classList.toggle('low-mana', needsMana);
      timer.textContent = needsMana ? whole(spell.cost) : remaining ? countdown(remaining) : gcd ? gcd.toFixed(1) : '';
      cooldown.textContent = remaining ? 'Cooldown · ' + countdown(remaining) :
        base ? countdown(base) + ' cooldown' : '';
      button.setAttribute('aria-pressed', selected === index);
    });
    selects.forEach(({select}) => select.disabled = active);
    find('[data-power]').disabled = active;
    find('[data-loadout]').disabled = active;
    encounterSelect.disabled = difficulty.disabled = active;
    for (const input of root.querySelectorAll('[data-buff]')) input.disabled = active;
    talentTree.setLocked(active);
    renderMeters(s);
    if (inspected !== null) updateInspectorMeter(s);
    const result = find('[data-result]');
    const score = ended ? s.survivors + '/5 survived · ' + whole(s.healing) + ' effective healing · ' +
      whole(s.healing / s.endedAt) + ' HPS · ' + whole(s.overheal) + ' overhealing · ' +
      (s.manaSpent ? (s.healing / s.manaSpent).toFixed(2) + ' effective healing per mana · ' : '') +
      whole(s.manaAtEnd) + ' mana left' : '';
    if (result.textContent !== score) result.textContent = score;
    const regenResult = find('[data-regen-result]');
    regenResult.hidden = !ended;
    if (ended) {
      const comparison = 'Mana gained this pull · ' + s.manaPerSpirit.toFixed(2) + ' mana per +1 raw Spirit · ' +
        s.manaPerMp5.toFixed(2) + ' mana per +1 mana / 5 sec';
      if (regenResult.textContent !== comparison) regenResult.textContent = comparison;
      regenResult.title = 'Extra mana usable during the observed pull, after the mana cap. ' +
        'Raw Spirit includes multipliers from talents and buffs, averaged across stat rounding.';
    }
  }

  const equipment = {
    left: ['Head', 'Neck', 'Shoulders', 'Back', 'Chest', 'Shirt', 'Tabard', 'Wrists'],
    right: ['Hands', 'Waist', 'Legs', 'Feet', 'Finger 1', 'Finger 2', 'Trinket 1', 'Trinket 2'],
    weapons: ['Main hand', 'Off hand', 'Relic']
  };
  const gear = find('[data-loadout]');
  for (const name of Object.keys(loadouts)) gear.add(new Option(name));
  gear.value = Object.hasOwn(loadouts, saved.loadout) ? saved.loadout : 'Level 60 dungeon';
  const defaultBuff = {priest:'spirit', paladin:'wisdom', druid:'mark', shaman:'waterShield'}[className];
  const buffList = className === 'shaman' ? [...buffs,
    ['waterShield','Water Shield','Start with three charges. Recast from the action bar.','ability_shaman_watershield']] : buffs;
  let waterBuff;
  for (const [key, name, description, iconFile] of buffList) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = key;
    input.dataset.buff = '';
    input.checked = Array.isArray(saved.buffs) && (key !== defaultBuff || saved.buffDefaults) ? saved.buffs.includes(key) : key === defaultBuff;
    const image = document.createElement('img');
    image.src = new URL('./icons/' + iconFile + '.jpg', import.meta.url);
    image.alt = '';
    image.width = image.height = 24;
    label.title = name + ' · ' + description;
    input.setAttribute('aria-label', name);
    label.append(input, image);
    if (key === 'waterShield') {
      const count = document.createElement('small');
      label.append(count);
      waterBuff = {label, count};
      label.classList.add('water-buff');
    }
    find('[data-buffs]').append(label);
  }
  const talentTree = mountTalentTree(find('[data-talents]'), saved.talents ?? defaultTalents, () => reset(), trees);
  if (presets) {
    const label = document.createElement('label');
    const select = document.createElement('select');
    select.add(new Option('Choose a build', ''));
    for (const name of Object.keys(presets)) select.add(new Option(name, name));
    select.onchange = () => {
      if (presets[select.value]) talentTree.load(presets[select.value]);
      select.value = '';
    };
    label.append('Talent preset ', select);
    find('[data-talents]').before(label);
  }
  if (Number.isInteger(saved.power) && saved.power >= 0 && saved.power <= 5000) find('[data-power]').value = saved.power;
  const savedSlot = typeof saved.selected === 'string' ? slots.findIndex(([key]) => key === saved.selected) :
    Number.isInteger(saved.selected) && saved.selected !== 5 ? saved.selected - Number(saved.selected > 5) : -1;
  if (slots[savedSlot] && !utility[slots[savedSlot][0]]) selected = savedSlot;
  find('[data-sound]').checked = saved.sound !== false;

  function saveSettings() {
    const power = find('[data-power]');
    try {
      localStorage.setItem(settingsKey, JSON.stringify({
        loadout: gear.value,
        encounter: encounterSelect.value,
        difficulty: Number(difficulty.value),
        buffs: [...enabled],
        buffDefaults: true,
        power: power.validity.valid ? Number(power.value) : 0,
        sound: find('[data-sound]').checked,
        selected: slots[selected][0],
        talents: talentTree.build,
        ranks: Object.fromEntries(selects.map(({key, select}) => [key, select.value]))
      }));
    } catch {
      // The simulator can still run when the browser blocks local storage.
    }
  }
  const gearSlots = {};
  for (const [group, names] of Object.entries(equipment)) {
    for (const name of names) {
      const image = document.createElement('img');
      const slot = name.toLowerCase().replace(/ [12]$/, '').replaceAll(' ', '');
      const file = {back: 'empty', chest: 'empty', tabard: 'empty'}[slot] ?? slot;
      const slotButton = document.createElement('button');
      slotButton.type = 'button';
      slotButton.className = 'equipment-slot';
      image.alt = '';
      image.width = image.height = 36;
      const tip = document.createElement('span');
      tip.className = 'equipment-tooltip';
      slotButton.append(image, tip);
      gearSlots[name] = {image, slotButton, tip, file};
      find('[data-equipment="' + group + '"]').append(slotButton);
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
    const kit = loadouts[gear.value];
    const sources = [...new Set(Object.values(kit).map(item => item.source))];
    find('[data-gear-source]').textContent = sources.includes('ForeverDB') ? 'ForeverDB level 60 PvE BiS · Includes selections from later raids and PvP' :
      sources.length ? 'Item data · ' + sources.join(' / ') : '';
    const labels = {strength:'Strength', agility:'Agility', stamina:'Stamina', intellect:'Intellect',
      spirit:'Spirit', power:'Healing power', spellDamage:'Spell damage', mp5:'Mana / 5 sec', crit:'Crit', armor:'Armor'};
    for (const [name, {image, slotButton, tip, file}] of Object.entries(gearSlots)) {
      const item = kit[name];
      image.src = new URL(item ? './icons/' + item.icon + '.jpg' : './slots/' + file + '.jpg', import.meta.url);
      slotButton.dataset.quality = item?.quality ?? '';
      slotButton.setAttribute('aria-label', name + ' · ' + (item?.name ?? 'Empty'));
      tip.replaceChildren();
      const title = document.createElement('strong');
      title.textContent = item?.name ?? name + ' · Empty';
      tip.append(title);
      if (!item) continue;
      const info = document.createElement('span');
      info.textContent = [name, item.ilvl ? 'Item level ' + item.ilvl : '', item.source].filter(Boolean).join(' · ');
      tip.append(info);
      if (item.acquisition) {
        const acquisition = document.createElement('span');
        acquisition.textContent = item.acquisition;
        tip.append(acquisition);
      }
      for (const [key, value] of Object.entries(item.stats)) {
        const line = document.createElement('span');
        line.textContent = '+' + value + (key === 'crit' ? '% ' : ' ') + labels[key];
        tip.append(line);
      }
      const linkText = document.createElement('span');
      linkText.textContent = 'Item ID ' + item.id;
      tip.append(linkText);
    }
    for (const [key, field] of Object.entries(sheet)) {
      field.textContent = key === 'crit' ? (100 * profile.crit).toFixed(2) + '%' :
        key === 'resting' ? (profile.mp5 + 5 * profile.regen).toFixed(1) :
          key === 'mp5' ? (profile.mp5 + 5 * profile.regen * profile.castingRegen).toFixed(1) : whole(profile[key]);
    }
  }
  find('[data-power]').oninput = () => reset();
  gear.onchange = () => reset();
  find('[data-buffs]').onchange = () => reset();
  find('[data-talents]').onchange = () => reset();
  find('[data-start]').onclick = () => reset(pull.state.phase === 'ready');
  difficulty.onchange = encounterSelect.onchange = () => reset();
  for (const {select} of selects) select.onchange = () => {
    if (pull.state.phase === 'active') return;
    if (pull.state.phase === 'ready') reset();
    else {
      configuredSpells();
      saveSettings();
    }
    renderInspector();
  };

  function healingMultiplier(spell) {
    return '+' + Math.round((spell.multiplier - 1) * 100) + '%';
  }

  const healingByName = new Map(slots.filter(([key]) => healingKeys.includes(key))
    .map(([key, name]) => [name, key]));
  function renderHealingBreakdown(tip, name, row) {
    const key = healingByName.get(name);
    if (!key || !row) return;
    const spell = applyTalents(spellFor(key, name, row), talentPoints);
    const unit = spell.period ? ' per tick per target' : spell.chain > 1 ? ' on the primary target' : '';
    const range = (power, multiplier = 1) => {
      const bonus = power * spell.coefficient;
      const low = whole(Math.round((spell.low + bonus) * multiplier));
      const high = whole(Math.round((spell.high + bonus) * multiplier));
      return (low === high ? low : low + '–' + high) + unit;
    };
    tooltipLine(tip, 'Base healing · ' + range(0));
    tooltipLine(tip, 'With gear (+' + whole(profile.gearPower) + ' healing) · ' + range(profile.gearPower));
    const talentPower = profile.talentPower ?? 0;
    if (profile.power !== profile.gearPower + talentPower) {
      tooltipLine(tip, 'With Custom bonus · ' + range(profile.power - talentPower));
    }
    tooltipLine(tip, 'With talents (×' + Number(spell.multiplier.toFixed(3)) + ') · ' +
      range(profile.power, spell.multiplier), 'game-tooltip-good');
    if (spell.hot) {
      const tick = Math.round((spell.hot.low + profile.power * spell.hot.coefficient) * spell.hot.multiplier);
      tooltipLine(tip, 'Periodic healing with gear and talents · ' + whole(tick) + ' every ' + spell.hot.period +
        ' sec for ' + spell.duration + ' sec', 'game-tooltip-good');
    }
    if (key === 'chain') {
      tooltipLine(tip, 'With Riptide (+25% first hit) · ' +
        range(profile.power, spell.multiplier * 1.25), 'game-tooltip-good');
    }
  }
  let selectedSchool = schools[0];
  const allRanks = find('[data-all-ranks]');
  const bookLevel = find('[data-book-level]');
  const bookSearch = find('[data-filter]');
  const schoolButtons = schools.map((school, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.append(icon(schoolIcons[index]), school);
    button.onclick = () => { selectedSchool = school; renderBook(); };
    find('[data-schools]').append(button);
    return button;
  });
  const resurrection = new Set(['Ancestral Spirit', 'Rebirth', 'Redemption', 'Resurrection']);
  const bookRows = Object.entries(catalog).filter(([name]) => !resurrection.has(name)).map(([name, entry]) => {
    const [school, status] = spellGroups[name] ?? ['enhancement', ''];
    return {name, school, status, ranks: entry.ranks.map(rank => {
      const row = byName(name).find(candidate => candidate.rank === rank.rank);
      const effects = row?.effects.filter(effect => effect.coefficient) ?? [];
      const coefficients = effects.map(effect => (effect.coefficient * 100).toFixed(1) + '%' +
        (effect.period ? ' per ' + effect.period + ' sec' : ''));
      return {rank, coefficients, row};
    })};
  });

  function renderBook() {
    const grid = find('[data-catalog]');
    grid.replaceChildren();
    schoolButtons.forEach((button, index) => button.setAttribute('aria-pressed', schools[index] === selectedSchool));
    const level = bookLevel.valueAsNumber || 60;
    const query = bookSearch.value.trim().toLowerCase();
    for (const {name, school, status, ranks: entries} of bookRows) {
      if ((!query && school !== selectedSchool.toLowerCase()) || !name.toLowerCase().includes(query)) continue;
      const available = entries.filter(({rank}) => rank.level <= level);
      const shown = allRanks.checked ? available : available.slice(-1);
      for (const {rank, coefficients, row} of shown) {
        const cell = document.createElement('details');
        cell.className = 'book-spell';
        const button = document.createElement('summary');
        const label = document.createElement('span');
        label.textContent = name + (status === 'changed' ? ' ◆' : status === 'new' ? ' ★' : '');
        const sub = document.createElement('small');
        sub.textContent = [rank.rank, 'Level ' + rank.level].filter(Boolean).join(' · ');
        label.append(sub);
        button.append(icon(name), label);
        const render = tip => {
          tip.replaceChildren();
          tooltipLine(tip, name, 'game-tooltip-title');
          tooltipLine(tip, [rank.rank, 'Level ' + rank.level].filter(Boolean).join(' · '));
          tooltipLine(tip, rank.details || '');
          tooltipLine(tip, rank.description || '', 'game-tooltip-description');
          if (coefficients.length) tooltipLine(tip, 'Coefficient · ' + coefficients.join(' / '));
          renderHealingBreakdown(tip, name, row);
        };
        const detail = document.createElement('div');
        const tooltip = attachGameTooltip(button, render);
        cell.ontoggle = () => {
          if (cell.open) { tooltip.hide(); render(detail); }
        };
        cell.append(button, detail);
        grid.append(cell);
      }
    }
    if (!grid.childElementCount) grid.textContent = 'No spells match your filters.';
  }
  allRanks.onchange = bookLevel.oninput = bookSearch.oninput = renderBook;
  mountTabs(find('.heal-menu'));
  renderBook();

  const inspector = find('.spell-inspector');
  inspector.addEventListener('close', () => { inspected = null; });
  function openInspector(index) {
    if (!currentSpells[slots[index][0]]) return;
    inspected = index;
    renderInspector();
    if (!inspector.open) inspector.showModal();
  }

  function renderInspector() {
    const {key, name, rows, setting} = selects[inspected];
    const spell = currentSpells[key];
    find('#inspect-title').replaceChildren(icon(name), document.createTextNode(name));
    find('[data-inspect-rank]').replaceChildren(...(rows.length > 1 ? [setting] : []));
    const list = document.createElement('dl');
    const add = (label, value) => {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      list.append(term, description);
    };
    add('Mana cost', whole(spell.cost));
    add('Cast time', spell.cast ? spell.cast + ' sec' : 'Instant');
    add('Global cooldown', spell.gcd + ' sec');
    if (spell.cooldown) add('Cooldown', spell.cooldown + ' sec');
    if (spell.low) {
      const bonus = spell.coefficient * profile.power;
      const low = (spell.low + bonus) * spell.multiplier;
      const high = (spell.high + bonus) * spell.multiplier;
      const ticks = spell.period ? Math.floor(spell.duration / spell.period) + Number(!!spell.immediateTick) : 1;
      const crit = spell.period && !spell.periodicCrit ? 0 : Math.min(1, profile.crit + (spell.bonusCrit ?? 0));
      const average = (low + high) / 2 * (1 + (.5 + (profile.critHealingBonus ?? 0)) * crit);
      const range = (factor = 1) => whole(Math.round(low * factor)) + '–' + whole(Math.round(high * factor));
      const hotTick = spell.hot ? (spell.hot.low + spell.hot.coefficient * profile.power) * spell.hot.multiplier : 0;
      const hotTicks = spell.hot ? Math.floor(spell.duration / spell.hot.period) : 0;
      const hpm = factor => spell.cost ? ((average * factor + hotTick * hotTicks * (1 + .5 * crit)) / spell.cost).toFixed(2) : '—';
      add(spell.period ? 'Non-crit healing per tick' : 'Non-crit primary heal', range());
      if (spell.period) add('Ticks per target', ticks + ' × every ' + spell.period + ' sec');
      if (spell.mark === 'vigil') add('Trigger', 'Holy Shock on the marked ally · 30 sec mark · no Holy Shock cooldown');
      add('Base coefficient', (spell.coefficient * 100).toFixed(1) + '%' + (spell.period ? ' per tick' : ''));
      if (spell.hot) {
        add('Non-crit periodic healing', whole(Math.round(hotTick)) + ' × ' + hotTicks + ' ticks');
        add('Periodic coefficient', (spell.hot.coefficient * 100).toFixed(1) + '% per tick');
      }
      if (key === 'stream') {
        add('Restorative Totems', healingMultiplier(spell));
        add('Effective coefficient', (spell.coefficient * spell.multiplier * 100).toFixed(2) + '% per tick');
      }
      add('Healing crit chance', (crit * 100).toFixed(2) + '%');
      add('Expected healing per mana', hpm(ticks) + (spell.party ? ' per party member' : ' on primary'));
      const chain = find('[data-inspect-chain]');
      chain.replaceChildren();
      if (spell.chain > 1) {
        const table = document.createElement('table');
        table.className = 'table table-sm';
        table.innerHTML = '<caption>Chain Heal before overhealing. HPM includes crits. Riptide boosts the primary hit only.</caption><thead><tr><th>Targets hit</th><th>Normal healing</th><th>HPM</th><th>Riptide healing</th><th>HPM</th></tr></thead><tbody></tbody>';
        let total = 0;
        for (let targets = 1; targets <= spell.chain; targets++) {
          total += spell.falloff ** (targets - 1);
          const row = table.tBodies[0].insertRow();
          for (const value of [targets === 1 ? '1 · primary' : targets + ' · ' + (targets - 1) + ' jumps',
            range(total), hpm(total), range(total + .25), hpm(total + .25)]) row.insertCell().textContent = value;
        }
        chain.append(table);
      }
    } else {
      find('[data-inspect-chain]').replaceChildren();
      if (spell.waterShield) add('Effect', '3 charges · 2% maximum mana per proc · 3.5 sec between procs');
      if (spell.dispel) add('Dispel', spell.abolishPoison ? 'Removes one poison now and every 2 sec for 8 sec' : 'Removes one ' + hazard + ' effect');
      if (spell.shield) add('Absorb', whole(Math.round((spell.shield + spell.coefficient * profile.power) * spell.multiplier)) +
        ' damage · ' + spell.duration + ' sec · 15 sec Weakened Soul before talents');
      if (spell.swiftmend) add('Effect', 'Heals for the full value of your active Rejuvenation or Regrowth HoT and leaves it active');
      if (spell.innervate) add('Effect', '500% of normal Spirit mana regeneration for 20 sec, including while casting');
      if (spell.swiftness) add('Effect', 'Makes your next cast-time Nature heal instant');
      if (spell.manaTick) add('Mana restored', spell.manaTick + ' every ' + spell.period + ' sec for ' + spell.duration + ' sec');
      if (spell.manaRange) add('Mana restored', spell.manaRange.map(whole).join('–'));
    }
    find('[data-inspect-stats]').replaceChildren(list);
    updateInspectorMeter(pull.state);
  }

  function updateInspectorMeter(state) {
    const stats = state.meters[slots[inspected][0]];
    const raw = (stats?.effective ?? 0) + (stats?.overheal ?? 0);
    const field = find('[data-inspect-meter]');
    const value = raw ? 'This pull · ' + whole(stats.effective) + ' effective healing · ' +
      (100 * stats.effective / raw).toFixed(1) + '% effective · ' +
      (stats.mana ? (stats.effective / stats.mana).toFixed(2) + ' effective healing per mana' : 'no mana spent') :
      'This pull · No healing recorded for this spell.';
    if (field.textContent !== value) field.textContent = value;
  }

  const meterRows = new Map();
  for (const [key, name] of [...slots, ...extraMeters]) {
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
        ') · ' + whole(stats.overheal) + ' overhealing (' + percent(stats.overheal, raw) + ') · ' +
        (stats.mana ? (stats.effective / stats.mana).toFixed(2) + ' effective healing per mana' : 'no mana spent');
      summary.title = breakdown.textContent;
    }
  }

  let audio;
  function enableAudio() {
    if (!find('[data-sound]').checked) return;
    if (!window.AudioContext) {
      find('[data-sound]').checked = false;
      return;
    }
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
  }
  find('[data-sound]').onchange = () => {
    enableAudio();
    saveSettings();
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
  find('[data-start]').addEventListener('click', () => { visualPull++; enableAudio(); });
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

  reset(false, false);
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
}
