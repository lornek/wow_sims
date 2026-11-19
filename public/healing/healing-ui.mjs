import {mountDamageText} from './damage-text.mjs';
import {mountCustomStatsLayout} from './custom-stats-layout.mjs';
import {enchantIconPath} from './enchant-icons.mjs';
import {manaConsumables} from './consumables.mjs';
import {mountHotkeys} from './hotkeys.mjs';
import {setEquipmentImage} from './gear-images.mjs';
import {purposeIconPath} from './purpose-icons.mjs';
import {foreverSpellbook} from './forever-spellbook.mjs';
import {spellbookEntries, spellbookPage} from './spellbook-layout.mjs';
import {mountGearEditor} from './gear-editor.mjs';
import {watchScoreFormula} from './score-layout.mjs';
import {normalizeAdditionalStats} from './additional-stats.mjs';
import {setBarNumbers} from './bar-numbers.mjs';
import {healingEventRows, healingMeterEntries} from './healing-events.mjs';
import {resetHealingReport} from './report-reset.mjs';
import {healingRange, swiftmendRange, periodicHealingPreview, periodicHealingScaling, expectedHealingPerMana} from './healing-preview.mjs';
import {manaReportSources, spiritContribution} from './mana-report.mjs';
import {reportManaVisual, contributionIcons, contributionColor, healingColors} from './report-style.mjs';
import {healingScore} from './healing-score.mjs';
import {mountTabs, attachGameTooltip, tooltipLine, tooltipValue, setGameTooltip, hideGameTooltip, hideGameTooltipWithin} from './game-ui.mjs';
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
  'Fireball': 'spell_fire_flamebolt',
  'Fire Blast': 'spell_fire_fireball',
  'Scorch': 'spell_fire_soulburn',
  'Ignite': 'spell_fire_incinerate',
  'Ice Lance': 'spell_frost_frostblast',
  'Arcane Shot': 'ability_impalingbolt',
  'Serpent Sting': 'ability_hunter_quickshot',
  'Pet': 'ability_druid_rake',
  'Pet: Claw': 'ability_druid_rake',
  'Pet: Melee': 'ability_hunter_pet_cat'
};

export function mountHealing({className, healer, healerColor, catalog, ranks, spellGroups, loadouts, buffs, talents,
  applyTalents, buildProfile, trees, slots, utility, defaultTalents, schools, schoolIcons, unlocks, auras, healingKeys,
  configureSpell = spell => spell, extraMeters = [], presets, hazard = 'poison'}) {
  slots = [...slots, ['darkRune', 'Dark Rune', 'Activate']];
  extraMeters = [...extraMeters, ['enchantAbsorb','Enchant: Absorption']];
  utility = {...utility, ...manaConsumables};
  catalog = {...catalog, ...Object.fromEntries(Object.values(manaConsumables).map(item => [item.name, {icon:item.icon, ranks:[{rank:'',level:1,details:'Instant · 2 min cooldown',description:item.healthCost ? 'Restores 900–1,500 mana at the cost of 600–1,000 life. Separate cooldown from mana potions.' : 'Restores 1,350–2,250 mana.'}]}]))};
  catalog['Enchant: Absorption'] = {icon:'inv_misc_note_01.jpg',iconPath:purposeIconPath('enchant-absorption'),ranks:[]};
  const params = new URLSearchParams(location.search);
  const priestSpec = params.get('spec') === 'holy' ? 'holy' : 'discipline';
  const settingsKey = 'wow-forever-sims.' + className + '.v1' +
    (presets && priestSpec === 'holy' ? '.holy' : '');
  const classLinks = [...document.querySelectorAll('.healbot-header .class-pick')];
  if (presets) {
    for (const link of classLinks.filter(link => link.dataset.healbotSpec)) {
      if (link.dataset.healbotSpec === priestSpec) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }
  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem(settingsKey)) ?? {};
    } catch {
      return {};
    }
  }
  const saved = readSettings();
  let soundEnabled = saved.sound !== false;

  const root = document.querySelector('#healing');
  root.dataset.healerClass = className;
  for (const image of root.querySelectorAll('[data-purpose-icon]')) image.src = new URL('./' + purposeIconPath(image.dataset.purposeIcon), import.meta.url);
  const find = selector => root.querySelector(selector);
  const customInputs = [...root.querySelectorAll('[data-custom-stat]')];
  const readAdditionalStats = () => normalizeAdditionalStats(Object.fromEntries(customInputs.map(input =>
    [input.dataset.customStat, input.validity.valid ? Number(input.value) : 0])));
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
  if (Object.hasOwn(encounters, params.get('encounter'))) encounterSelect.value = params.get('encounter');
  const linkedDifficulty = params.get('difficulty');
  if (linkedDifficulty !== null && /^[0-3]$/.test(linkedDifficulty)) difficulty.value = linkedDifficulty;

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
      ...(key === 'spring' ? {manaTick: Number(tooltip?.description.match(/restores (\d+) mana/)?.[1] ?? 0)} : {}),
      directChainBonus: key === 'riptide' ? .25 : 0}, row, tooltip, profile);
  }

  const spellButtons = [];
  const spellEntries = [];
  const frames = [];
  let hotkeys;
  let selected = 0;
  let touchTarget = null;
  const touchInput = event => event.pointerType === 'touch' ||
    (!event.pointerType && matchMedia('(pointer: coarse)').matches);
  let pendingTargetSpell = null;
  let pull;
  let damageText;
  let visualPull = 0;
  let currentSpells;
  let enabled = new Set();
  let last = performance.now();

  function icon(name, entry = catalog[name]) {
    const image = document.createElement('img');
    const fallback = {"Nature's Swiftness": 'spell_nature_ravenform.jpg', 'Major Mana Potion': 'inv_potion_76.jpg'};
    image.src = new URL('./' + (entry?.iconPath ?? ('icons/' + (entry?.icon ?? fallback[name]))), import.meta.url);
    image.alt = '';
    image.width = image.height = 34;
    return image;
  }

  for (const [index, [key, name, binding]] of slots.entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', name);
    const art = document.createElement('span');
    art.className = 'spell-art';
    const timer = document.createElement('span');
    timer.className = 'spell-timer';
    const chargesLabel = document.createElement('b');
    chargesLabel.className = 'spell-charges';chargesLabel.hidden = true;chargesLabel.setAttribute('aria-hidden','true');
    art.append(icon(name), timer);
    if (key === 'waterShield') art.append(chargesLabel);
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
    const tooltip = attachGameTooltip(button, tip => {
      const {row} = spellEntries[index];
      const spell = currentSpells[key];
      tooltipLine(tip, name + (row.rank ? ' · ' + row.rank : ''), 'game-tooltip-title');
      tooltipLine(tip, whole(spell.cost) + ' mana · ' + (spell.channel ? spell.duration + ' sec channel' : spell.cast ? Number((spell.cast / (1 + (profile.haste ?? 0))).toFixed(2)) + ' sec cast' : 'Instant'));
      if (profile.omen && spell.omenEligible && pull?.state.clearcastingUntil > pull?.state.time) tooltipLine(tip, 'Clearcasting · this cast costs no mana.', 'game-tooltip-mana');
      if (spell.cooldown) tooltipLine(tip, spell.cooldown + ' sec cooldown');
      const description = catalog[name]?.ranks?.find(entry => entry.rank === row.rank)?.description;
      const healing = renderHealingBreakdown(tip, name, row);
      if (description && !healing) tooltipLine(tip, description, 'game-tooltip-description');
    });
    button.onclick = event => {
      if (hotkeys?.choose(key)) { tooltip.hide(); pendingTargetSpell = null; return; }
      if (pull.state.phase === 'ready' && touchInput(event)) {
        tooltip.show();
        return;
      }
      tooltip.hide();
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
    button.oncontextmenu = event => event.preventDefault();
    find('.heal-spells').append(button);
    spellButtons.push({button, art, timer, cooldown, key, name, binding, tooltip, chargesLabel});

    const rows = manaConsumables[key] ? [{...manaConsumables[key],rank:''}] :
      byName(name).sort((a, b) => a.level - b.level || a.id - b.id).filter(row => key !== 'tide' || row.rank === 'Rank 4');
    spellEntries.push({row:rows.at(-1), key, name});
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
  damageMeter.replaceChildren();
  const damageRows = [];
  for (const [index, unit] of encounter.party.entries()) {
    const frame = find('.heal-party').querySelector('[data-party-index="'+index+'"]') ?? document.createElement('button');
    frame.dataset.partyIndex = String(index);
    frame.type = 'button';
    frame.className = 'heal-frame';
    frame.style.setProperty('--unit', unit.color);
    if (!frame.firstElementChild) frame.innerHTML = '<span class="unit-fill"></span><span class="unit-incoming" aria-hidden="true"></span>' +
      '<strong><svg class="unit-role" viewBox="0 0 24 24" role="img" aria-label="' + unit.role +
      '"><title>' + unit.role + '</title><path d="' + roleSymbols[unit.role] +
      '"/></svg><span class="unit-name"></span></strong><small></small><span class="unit-status"></span>';
    let resource;
    if (combatants[unit.name]) {
      const track = document.createElement('span');
      track.className = 'party-resource ' + combatants[unit.name].resource.toLowerCase();
      resource = frame.querySelector('.party-resource > span') ?? document.createElement('span');
      if (!resource.parentElement) {
        track.append(resource);
        frame.append(track);
      }
      const row = document.createElement('details');
      row.className = 'meter-row';
      row.name = 'healbot-damage-breakdown';
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
    } else if (!frame.querySelector('.party-resource')) {
      frame.insertAdjacentHTML('beforeend', '<span class="party-resource mana"><span data-mana-fill></span></span>');
    }
    frame.onclick = event => {
      if (!touchInput(event)) return attempt(event, index, false);
      if (!pull.state.party[index].hp) return;
      touchTarget = index;
      render();
    };
    frame.onauxclick = event => { if (event.button !== 2) hotkeys?.mouse(event, index); };
    frame.oncontextmenu = event => {
      event.preventDefault();
      attempt(event, index, true);
    };
    if (!frame.parentElement) find('.heal-party').append(frame);
    const status = frame.querySelector('.unit-status');
    status.replaceChildren();
    let auraOrder = 0;
    const badges = [...auras,
      ['swiftness', "Nature's Swiftness"], ['poison', hazard === 'disease' ? 'Infected Blade' : 'Poisoned Blade']]
      .map(([key, name]) => {
        const badge = document.createElement('span');
        badge.className = 'unit-aura ' + key;
        const timer = document.createElement('span');
        badge.append(icon(key === 'poison' ? slots[3][1] : name), timer);
        status.append(badge);
        return {key, name, badge, timer};
      });
    frames.push({frame, fill: frame.firstElementChild, incoming: frame.querySelector('.unit-incoming'), label: frame.querySelector('.unit-name'),
      health: frame.querySelector(':scope > small'), resource, status, nextAuraOrder: () => ++auraOrder, auras: badges});
  }

  find('.heal-party').replaceChildren(...[0,1,4,2,3].map(index=>frames[index].frame));

  function attempt(event, index, right) {
    if (hotkeys?.mouse(event, index)) return;
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
    const key = !binding || (active[2] === binding && currentSpells[active[0]]) ?
      (hotkeys?.has(active[0]) ? null : active[0]) :
      slots.find(([key, , shortcut]) => shortcut === binding && currentSpells[key] && !hotkeys?.has(key))?.[0];
    if (key) pull.cast(key, index);
    render();
  }

  let talentPoints;
  function configuredSpells() {
    const points = talentPoints = Object.fromEntries(talents.map(([key, name]) => [key, talentTree.build[name] ?? 0]));
    enabled = new Set([...root.querySelectorAll('[data-buff]:checked')].map(input => input.value));
    profile = buildProfile(gearEditor.kit, enabled, readAdditionalStats(), points);
    currentSpells = Object.fromEntries(spellEntries.map(({row, key, name}) =>
      [key, applyTalents(spellFor(key, name, row), points)]));
    for (const [key, name] of slots.filter(([key]) => unlocks.includes(key))) {
      if (!talentTree.build[name]) delete currentSpells[key];
    }
    if (!currentSpells[slots[selected][0]]) selected = 0;
  }

  function reset(start = false, persist = true) {
    visualPull++;
    damageText?.clear();
    hideGameTooltip();
    touchTarget = null;
    root.querySelectorAll('.heal-float, .heal-bounce').forEach(effect => effect.remove());
    configuredSpells();
    resetHealingReport(root, meterRows, manaRows);
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
    for (const link of classLinks) {
      const destination = new URL(link.href);
      destination.searchParams.set('encounter', id);
      destination.searchParams.set('difficulty', level);
      link.href = destination;
    }
    const mobilePortrait = find('[data-boss-portrait-mobile]');
    const mobileUrl = new URL('./portraits/' + id + '-mobile.jpg', import.meta.url).href;
    if (mobilePortrait.srcset !== mobileUrl) mobilePortrait.srcset = mobileUrl;
    const portrait = find('[data-boss-portrait]');
    const portraitUrl = new URL('./portraits/' + id + '.jpg', import.meta.url).href;
    if (portrait.src !== portraitUrl) portrait.src = portraitUrl;
    pull = createPull(profile, currentSpells, currentEncounter, Math.random, showHeal, event=>damageText?.show(event));
    updateSheet();
    if (start) pull.start();
    render();
    if (persist) saveSettings();
  }

  function addMetric(list, art, label) {
    const metric = document.createElement('div');
    const image = document.createElement('img');
    image.src = new URL('./' + purposeIconPath(art), import.meta.url);
    image.alt = '';
    image.width = image.height = 40;
    const term = document.createElement('dt');
    term.textContent = label;
    const detail = document.createElement('dd');
    metric.append(image, term, detail);
    list.append(metric);
    return detail;
  }

  function render() {
    const s = pull.state;
    const charges = s.waterShield?.expires > s.time ? s.waterShield.charges : 0;
    for (const row of enchantBuffRows.values()) row.label.hidden = true;
    for (const effect of profile.enchantEffects ?? []) {
      const aura = s.enchantAuras[effect.id];
      const shield = effect.kind==='absorb' ? s.party.at(-1).enchantAbsorb : null;
      if (!(aura?.expires>s.time || shield?.amount>0)) continue;
      if (!enchantBuffRows.has(effect.id)) {
        const label=document.createElement('span');label.className='enchant-buff';label.tabIndex=0;
        const image=document.createElement('img');image.src=new URL('./'+(enchantIconPath(effect) ?? ('icons/'+effect.icon+'.jpg')),import.meta.url);image.alt='';
        const count=document.createElement('small');label.append(image,count);find('[data-buffs]').append(label);
        enchantBuffRows.set(effect.id,{label,count});
      }
      const row=enchantBuffRows.get(effect.id);row.label.hidden=false;
      row.count.textContent=shield?whole(shield.amount):countdown(aura.expires-s.time);
      setGameTooltip(row.label,effect.name,[effect.description]);
    }
    if (omenBuff) {
      const remaining = Math.max(0, s.clearcastingUntil - s.time);
      omenBuff.label.classList.toggle('buff-live', remaining > 0);
      omenBuff.count.textContent = remaining ? countdown(remaining) : '';
      setGameTooltip(omenBuff.label, remaining ? 'Clearcasting · next spell is free' : 'Omen of Clarity',
        ['Log-based estimate: 5% per completed cast; Regrowth 8%. 10 sec internal cooldown.',
         remaining ? countdown(remaining) + ' remaining. Next eligible spell costs no mana.' : '15 sec Clearcasting duration. HoT ticks do not proc it.',
         s.omenProcs + ' procs · ' + s.clearcastingUses + ' free casts this fight.']);
    }
    if (waterBuff) {
      waterBuff.label.classList.toggle('buff-live', !!charges);
      waterBuff.count.textContent = currentSpells.waterShield ? charges : '';
    }
    const active = s.phase === 'active';
    const ended = ['won', 'lost'].includes(s.phase);
    find('[data-start]').textContent = s.phase === 'ready' ? '⚔ PULL! ⚔' : 'Reset';
    find('[data-phase]').textContent = String(Math.floor(s.time / 60)).padStart(2,'0') + ':' + String(Math.floor(s.time % 60)).padStart(2,'0');
    find('[data-phase]').setAttribute('aria-label', 'Fight time');
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
        setGameTooltip(frame.resource.parentElement, unit.resource.type, [whole(unit.resource.value) + ' / ' + unit.resource.max]);
        const entry = damageRows[i];
        const {row, value, breakdown} = entry;
        const abilities = Object.entries(unit.damage);
        const total = abilities.reduce((sum, [, ability]) => sum + ability.total, 0);
        entry.dps = total / (s.endedAt || s.time || 1);
        setBarNumbers(value, whole(total), whole(entry.dps) + ' DPS');
        if (row.open) {
          const damageByAbility = new Map();
          for (const [name, data] of abilities) {
            if (data.total <= 0) continue;
            const label = name.startsWith('Pet: ') ? 'Pet' : name;
            damageByAbility.set(label, (damageByAbility.get(label) ?? 0) + data.total);
          }
          const damaging = [...damageByAbility].sort((a, b) => b[1] - a[1]);
          damaging.forEach(([name, damage], index) => {
            let line = entry.lines.get(name);
            if (!line) {
              const element = document.createElement('div');
              const image = document.createElement('img');
              image.src = new URL('./icons/' + (damageIcons[name] ?? damageIcons.Melee) + '.jpg', import.meta.url);
              image.alt = name;
              setGameTooltip(element, name, ['Damage and DPS for this ability.']);
              const numbers = document.createElement('span');
              element.append(image, numbers);
              line = {element, numbers};
              entry.lines.set(name, line);
            }
            line.element.style.setProperty('--damage-hue', (index % 5 * (unit.name === 'Jaina' ? -10 : 7)) + 'deg');
            line.element.style.setProperty('--ability-share', (100 * damage / damaging[0][1]) + '%');
            line.element.style.setProperty('--damage-tint', (28 + index % 5 * 7) + '%');
            setBarNumbers(line.numbers, whole(damage), whole(damage / (s.endedAt || s.time || 1)) + ' DPS');
            const current = breakdown.children[index];
            if (current !== line.element) breakdown.insertBefore(line.element, current ?? null);
          });
          while (breakdown.children.length > damaging.length) breakdown.lastElementChild.remove();
        }
      }
      frame.frame.classList.toggle('touch-target', i === touchTarget && !!unit.hp);
      frame.health.textContent = unit.hp ? whole(unit.hp) + ' / ' + whole(unit.max) : 'Dead';
      for (const aura of frame.auras) {
        const {key, name, badge, timer} = aura;
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
          if (aura.expires !== expires) aura.order = frame.nextAuraOrder();
          const duration = {poison:10, weakened:15, aegis:12, inspiration:15, mending:30,
            innervate:currentSpells.innervate?.duration, powerInfusion:currentSpells.pi?.duration}[key] ??
            s[key]?.spell?.duration ?? currentSpells[key]?.duration ?? (key === 'abolish' ? currentSpells.poison?.duration : 0);
          sweep(badge, Number.isFinite(expires) && duration > 0 ? 1 - (expires - s.time) / duration : 0);
          timer.textContent = Number.isFinite(expires) ? countdown(expires - s.time) : '✓';
          setGameTooltip(badge, name, [timer.textContent + ' remaining']);
        }
        aura.expires = badge.hidden ? null : expires;
      }
      const visibleAuras = frame.auras.filter(({badge}) => !badge.hidden).sort((a, b) => b.order - a.order);
      frame.status.style.setProperty('--aura-gaps', Math.max(1, visibleAuras.length - 1));
      visibleAuras.forEach(({badge}, index) => {
        badge.style.setProperty('--aura-index', index);
        badge.style.zIndex = visibleAuras.length - index;
      });
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
    const gcdRemaining = active ? Math.max(0, s.gcd - s.time) : 0;
    fill(find('[data-cast-fill]'), s.cast ? 1 - (s.cast.end - s.time) / s.cast.duration : gcdRemaining ? 1 - gcdRemaining / s.gcdDuration : 0);
    find('[data-cast]').textContent = s.cast ? s.cast.spell.name + ' → ' + s.cast.unit.name : gcdRemaining ? 'Global cooldown · ' + gcdRemaining.toFixed(2) + ' sec' : active ? 'Ready to cast' : 'Cast bar';
    spellButtons.forEach(({button, art, timer, cooldown, key, tooltip, chargesLabel}, index) => {
      const {row} = spellEntries[index];
      const base = currentSpells[key]?.cooldown ?? row.cooldown;
      const remaining = Math.max(0, (s.cooldowns[key] ?? 0) - s.time);
      const spell = currentSpells[key];
      const gcd = active && !spell?.offGcd ? Math.max(0, s.gcd - s.time) : 0;
      button.hidden = !spell;
      if (!spell) tooltip.hide();
      sweep(art, remaining && base ? 1 - remaining / base : gcd ? 1 - gcd / s.gcdDuration : 0);
      const needsMana = !!spell && s.mana < spell.cost && !(key !== 'focus' && s.innerFocus > s.time) && !(profile.omen && spell.omenEligible && s.clearcastingUntil > s.time);
      if (key === 'waterShield') {
        chargesLabel.hidden = s.phase === 'ready';
        chargesLabel.textContent = String(charges);
        button.classList.toggle('water-shield-empty', active && charges === 0);
      }
      button.classList.toggle('clearcasting-free', !!(profile.omen && spell?.omenEligible && spell.cost > 0 && s.clearcastingUntil > s.time));
      art.classList.toggle('low-mana', needsMana);
      timer.textContent = needsMana ? whole(Math.ceil(spell.cost - s.mana)) : remaining ? countdown(remaining) : gcd ? gcd.toFixed(1) : '';
      cooldown.textContent = remaining ? 'Cooldown · ' + countdown(remaining) :
        base ? countdown(base) + ' cooldown' : '';
      button.setAttribute('aria-pressed', selected === index);
    });
    for (const input of customInputs) input.disabled = active;
    find('[data-loadout]').disabled = active;
    find('[data-reset-character]').disabled = active;
    gearEditor.lock(active || gearEditor.loading);
    find('[data-start]').disabled = gearEditor.loading;
    encounterSelect.disabled = difficulty.disabled = active;
    for (const input of root.querySelectorAll('[data-buff]')) input.disabled = active;
    talentTree.setLocked(active);
    renderMeters(s);
    renderManaMeters(s);
    const result = find('[data-result]');
    if (ended && result.hidden) {
      const reportGroup = (title, metrics) => {
        const heading = document.createElement('h3');
        heading.textContent = title;
        const list = document.createElement('dl');
        for (const [art, label, value] of metrics) addMetric(list, art, label).textContent = value;
        result.append(heading, list);
      };
      reportGroup('Fight totals', [
        ['survived', 'Players kept alive', s.survivors + ' / ' + s.party.length],
        ['healing', 'Effective healing', whole(s.healing)],
        ['hps', 'Healing per second', whole(s.healing / s.endedAt)],
        ['overheal', 'Overhealing', whole(s.overheal)],
        ['hpm', 'Healing per mana', s.manaSpent ? (s.healing / s.manaSpent).toFixed(2) : '—'],
        ['remaining', 'Mana remaining', whole(s.manaAtEnd)],
        ['gained', 'Total mana gained', whole(s.manaGained)],
        ['mana-spent', 'Mana spent', whole(s.manaSpent)]
      ]);

    } else if (!ended && !result.hidden) {
      result.replaceChildren();
    }
    result.hidden = !ended;
    const regenResult = find('[data-regen-result]');
    const won = s.phase === 'won';
    regenResult.hidden = !won;
    find('[data-score-heading]').hidden = !won;
    if (won && !regenResult.childElementCount) {
      const score = healingScore(s);
      find('[data-score-total]').textContent = whole(score.total);
      regenResult.replaceChildren();
      const terms = [
        ['score-healing', '(' + whole(s.healing) + ')', 'Effective healing'],
        ['score-mana', '(' + whole(score.manaGained) + ')', 'Mana gained excluding mana potions and Dark Rune'],
        ['score-efficiency', '(' + (100 * score.efficiency).toFixed(1) + '% efficiency)', 'Effective healing / total healing'],
        ['score-survival', '(' + score.survivors + '/' + s.party.length + ' survived)', 'Party members alive at victory']
      ];
      for (const [index, [style, text, title]] of terms.entries()) {
        if (index) {
          const times = document.createElement('span');
          times.className = 'score-times'; times.textContent = '×';
          regenResult.append(times);
        }
        const term = document.createElement('strong');
        term.className = style; term.textContent = text; term.tabIndex = 0;
        const image = document.createElement('img');
        image.src = new URL('./' + purposeIconPath(({'score-healing':'healing','score-mana':'gained','score-efficiency':'efficiency-percent','score-survival':'survived'})[style]), import.meta.url);
        image.alt = ''; term.prepend(image);
        setGameTooltip(term, title, [text]);
        regenResult.append(term);
      }
      const divisor = document.createElement('strong');
      divisor.className = 'score-times'; divisor.textContent = '/ 1000';
      regenResult.append(divisor);

    } else if (!won) {
      find('[data-score-total]').textContent = '';
      regenResult.replaceChildren();
      regenResult.removeAttribute('title');
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
    ['waterShield','Water Shield','Start with three charges. Recast from the action bar.','ability_shaman_watershield']] : className === 'druid' ? [...buffs,
    ['omen','Omen of Clarity','Estimated from pooled Forever logs: 5% per cast, 8% Regrowth; 10 sec internal cooldown. Clearcasting makes your next spell free for up to 15 sec.','inv_misc_orb_01']] : buffs;
  let waterBuff;
  let omenBuff;
  const enchantBuffRows = new Map();
  for (const [key, name, description, iconFile] of buffList) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = key;
    input.dataset.buff = '';
    input.checked = key === 'omen' && !saved.omenConfigured ? true : Array.isArray(saved.buffs) && (key !== defaultBuff || saved.buffDefaults) ? saved.buffs.includes(key) : key === defaultBuff;
    const image = document.createElement('img');
    image.src = new URL('./icons/' + iconFile + '.jpg', import.meta.url);
    image.alt = '';
    image.width = image.height = 24;
    setGameTooltip(label, name, [description]);
    input.setAttribute('aria-label', name);
    label.append(input, image);
    if (key === 'omen') {
      const count = document.createElement('small');label.append(count);
      omenBuff = {label,count};label.classList.add('omen-buff');
    }
    if (key === 'waterShield') {
      const count = document.createElement('small');
      label.append(count);
      waterBuff = {label, count};
      label.classList.add('water-buff');
    }
    find('[data-buffs]').append(label);
  }
  const talentTree = mountTalentTree(find('[data-talents]'), saved.talents ?? (presets && priestSpec === 'holy' ? presets.Holy : defaultTalents), () => reset(), trees);
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
  const savedAdditionalStats = normalizeAdditionalStats(saved.additionalStats ?? saved.power ?? 0);
  for (const input of customInputs) input.value = savedAdditionalStats[input.dataset.customStat];
  const savedSlot = typeof saved.selected === 'string' ? slots.findIndex(([key]) => key === saved.selected) :
    Number.isInteger(saved.selected) && saved.selected !== 5 ? saved.selected - Number(saved.selected > 5) : -1;
  if (slots[savedSlot] && !utility[slots[savedSlot][0]]) selected = savedSlot;
  renderSoundToggle();
  const resetCharacterButton = find('[data-reset-character]');
  setGameTooltip(resetCharacterButton, 'Reset character', [
    'Restore this healer’s default gear, talents, buffs, and Additional stats.',
    'Keeps your boss, difficulty, and sound preference. Other healers are unchanged.'
  ]);
  resetCharacterButton.onclick = () => {
    try {
      const gearKey = 'wow-forever-sims.gear.' + className + '.v1';
      const library = JSON.parse(localStorage.getItem(gearKey) ?? '{}');
      localStorage.setItem(gearKey, JSON.stringify({sets:library.sets ?? {}}));
      localStorage.setItem(settingsKey, JSON.stringify({sound:soundEnabled,
        encounter:encounterSelect.value, difficulty:Number(difficulty.value)}));
    } catch { /* Defaults still load when storage is unavailable. */ }
    const url = new URL(location.href);
    url.searchParams.set('encounter', encounterSelect.value);
    url.searchParams.set('difficulty', difficulty.value);
    history.replaceState(null, '', url);
    location.reload();
  };

  function saveSettings() {
    try {
      localStorage.setItem(settingsKey, JSON.stringify({
        loadout: gear.value,
        encounter: encounterSelect.value,
        difficulty: Number(difficulty.value),
        buffs: [...enabled],
        buffDefaults: true,
        ...(className === 'druid' ? {omenConfigured:true} : {}),
        additionalStats: readAdditionalStats(),
        sound: soundEnabled,
        selected: slots[selected][0],
        talents: talentTree.build,
        // Action-bar ranks are always the highest learned rank.
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
      slotButton.append(image);
      gearSlots[name] = {image, slotButton, tip, file};
      find('[data-equipment="' + group + '"]').append(slotButton);
    }
  }
  const gearEditor = mountGearEditor({container:find('.character-sheet'), slots:gearSlots, className, loadouts, select:gear, onchange:()=>reset(), isActive:()=>pull?.state.phase === 'active'});
  const statGroups = {
    Resources: {Health: 'health', Mana: 'mana', 'Base mana': 'baseMana'},
    Attributes: {Strength: 'strength', Agility: 'agility', Stamina: 'stamina',
      Intellect: 'intellect', Spirit: 'spirit'},
    Spell: {'Bonus healing': 'power', 'Spell crit': 'crit',
      'Mana / 5 sec': 'resting', 'Mana / 5 sec while casting': 'mp5'}
  };
  const sheet = {};
  for (const [name, stats] of Object.entries(statGroups)) {
    const heading = document.createElement('h3');
    heading.textContent = name;
    const list = document.createElement('dl');
    for (const [label, value] of Object.entries(stats)) {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      const statIcon = document.createElement('img');
      statIcon.src = new URL('./' + purposeIconPath(({health:'max-health',mana:'max-mana',baseMana:'max-mana',power:'healing',crit:'crit-chance',resting:'mp5'})[value] ?? value), import.meta.url);
      statIcon.alt = ''; statIcon.width = statIcon.height = 24;
      term.append(statIcon, label);
      sheet[value] = description;
      list.append(term, description);
    }
    find('[data-profile]').append(heading, list);
  }
  function updateSheet() {
    find('[data-loadout-label]').textContent = gear.value;
    const kit = gearEditor.baseKit;
    const labels = {strength:'Strength', agility:'Agility', stamina:'Stamina', intellect:'Intellect',
      spirit:'Spirit', power:'Healing power', spellDamage:'Spell damage', mp5:'Mana / 5 sec', crit:'Crit', haste:'Haste', armor:'Armor', health:'Health', mana:'Mana'};
    for (const [name, {image, slotButton, tip, file}] of Object.entries(gearSlots)) {
      const item = kit[name];
      setEquipmentImage(image, item, file);
      slotButton.dataset.quality = item?.quality ?? '';
      slotButton.setAttribute('aria-label', name + ' · ' + (item?.name ?? 'Empty'));
      tip.replaceChildren();
      const title = document.createElement('strong');
      title.textContent = item?.name ?? name + ' · Empty';
      tip.append(title);
      if (!item) { gearSlots[name].tooltip = setGameTooltip(slotButton, name, ['Empty equipment slot']); continue; }
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
        line.textContent = '+' + Number(value.toFixed(2)) + (['crit','haste'].includes(key) ? '% ' : ' ') + labels[key];
        tip.append(line);
      }
      const linkText = document.createElement('span');
      linkText.textContent = 'Item ID ' + item.id;
      const enchant = gearEditor.enchantFor(item);
      if (enchant) {
        const line = document.createElement('span');
        line.textContent = 'Enchantment: ' + enchant.name;tip.append(line);
        for (const [key,value] of Object.entries(enchant.stats)) {
          const bonus = document.createElement('span');bonus.textContent = 'Enchant: +' + value + (['crit','haste'].includes(key) ? '% ' : ' ') + (labels[key] ?? key);tip.append(bonus);
        }
        if (enchant.description) {const effect=document.createElement('span');effect.textContent=enchant.description;tip.append(effect);}
      } else if(item.enchantId) { const line=document.createElement('span');line.textContent='Enchantment: loading…';tip.append(line); }
      tip.append(linkText);
      gearSlots[name].tooltip = setGameTooltip(slotButton, title.textContent, [...tip.children].slice(1).map(line => line.textContent), {quality:item.quality});
    }
    for (const [key, field] of Object.entries(sheet)) {
      field.textContent = key === 'crit' ? (100 * profile.crit).toFixed(2) + '%' :
        key === 'resting' ? (profile.mp5 + 5 * profile.regen).toFixed(1) :
          key === 'mp5' ? (profile.mp5 + 5 * profile.regen * profile.castingRegen).toFixed(1) : whole(profile[key]);
    }
  }
  for (const input of customInputs) input.oninput = () => reset();

  find('[data-buffs]').onchange = () => reset();
  find('[data-talents]').onchange = () => reset();
  find('[data-start]').onclick = () => reset(pull.state.phase === 'ready');
  difficulty.onchange = encounterSelect.onchange = () => {
    const url = new URL(location.href);
    url.searchParams.set('encounter', encounterSelect.value);
    url.searchParams.set('difficulty', difficulty.value);
    history.replaceState(null, '', url);
    reset();
  };


  function healingMultiplier(spell) {
    return '+' + Math.round((spell.multiplier - 1) * 100) + '%';
  }

  const healingByName = new Map(slots.map(([key, name]) => [name, key]));
  function formatHealingRange([low, high]) {
    return low === high ? whole(low) : whole(low) + '–' + whole(high);
  }
  function swiftmendPreviews() {
    return [['regrowth', 'Regrowth'], ['rejuvenation', 'Rejuvenation']].flatMap(([key, label]) => {
      const source = currentSpells?.[key];
      return source ? [[label, swiftmendRange(source, profile.power)]] : [];
    });
  }
  function renderHealingBreakdown(tip, name, row) {
    const previewProfile = {...profile,power:pull?.state.phase==='active' ? pull.healingPower() : profile.power};
    const key = healingByName.get(name);
    if (!key || !row) return;
    const baseSpell = spellFor(key, name, row);
    const spell = applyTalents(baseSpell, talentPoints);
    if (spell.swiftmend) {
      for (const [label, amounts] of swiftmendPreviews()) {
        tooltipValue(tip, 'With ' + label, formatHealingRange(amounts), 'game-tooltip-good');
      }
      tooltipValue(tip, 'Crit chance', (100 * Math.min(1,profile.crit)).toFixed(1) + '%');
      const hpm = swiftmendPreviews().map(([, amounts]) => (amounts[0] + amounts[1]) / 2 * (1 + (.5 + (profile.critHealingBonus ?? 0)) * Math.min(1, profile.crit)) / spell.cost);
      tooltipValue(tip, 'Avg healing per mana', hpm.length && spell.cost > 0 ? [...new Set(hpm.map(n => n.toFixed(2)))].join(' / ') : '—', 'game-tooltip-mana');
      tooltipLine(tip, 'Uses your selected HoT ranks and full duration. Leaves the HoT active; if both are present, uses the one expiring first.', 'game-tooltip-description');
      return true;
    }
    if (spell.shield) {
      tooltipValue(tip, 'Absorb', whole(Math.round((spell.shield + spell.coefficient * previewProfile.power) * spell.multiplier)), 'game-tooltip-good');
      tooltipValue(tip, 'Avg absorb per mana', spell.cost > 0 ? (Math.round((spell.shield + spell.coefficient * previewProfile.power) * spell.multiplier) / spell.cost).toFixed(2) : '—', 'game-tooltip-mana');
      tooltipLine(tip, spell.duration + ' sec duration · prevents another shield for 15 sec');
      tooltipValue(tip, 'Base absorb', whole(spell.shield), 'game-tooltip-reference');
      return true;
    }
    if (key === 'hands') {
      tooltipValue(tip, 'Healing', whole(profile.health), 'game-tooltip-good');
      tooltipLine(tip, 'Spends all remaining mana. Restores ' + whole(spell.layOnHands) + ' mana when used on yourself.');
      return true;
    }
    if (!healingKeys.includes(key)) return;
    const range = (power, multiplier = 1) => formatHealingRange(healingRange({...spell, multiplier}, power));
    if (!spell.period) tooltipValue(tip, spell.chain > 1 ? 'Healing (primary)' : 'Healing', formatHealingRange(healingRange(spell, previewProfile.power)), 'game-tooltip-good');
    if (key === 'chain') {
      tooltipValue(tip, 'Healing (1st bounce)', formatHealingRange(healingRange(spell, previewProfile.power, spell.falloff)), 'game-tooltip-good');
      tooltipValue(tip, 'Healing (2nd bounce)', formatHealingRange(healingRange(spell, previewProfile.power, spell.falloff ** 2)), 'game-tooltip-good');
    }
    if (spell.period || spell.hot) {
      const periodic = periodicHealingPreview(spell, previewProfile.power);
      const ticks = spell.decay ? formatHealingRange(periodic.first) + ' → ' + formatHealingRange(periodic.last) : formatHealingRange(periodic.first);
      if (key !== 'stream') tooltipValue(tip, 'Heal over time (' + periodic.duration + 'sec)', formatHealingRange(periodic.total), 'game-tooltip-good');
      tooltipValue(tip, key === 'stream' ? 'Healing per tick' : 'Healing per tick (' + periodic.ticks + ' ticks)', ticks, 'game-tooltip-good');
    }
    if (spell.party) tooltipLine(tip, 'Heals all living party members.');
    if (spell.mending) tooltipLine(tip, 'Triggers on damage or non-periodic healing, then jumps to another ally. Up to 5 heals; 30 sec after each jump.');
    if (spell.mark === 'vigil') tooltipLine(tip, 'Triggered by Holy Shock on the marked ally. Mark lasts 30 sec.');
    if (spell.chain > 1) tooltipLine(tip, spell.chain + ' targets · ' + Math.round(spell.falloff * 100) + '% healing retained per jump');
    if (spell.selfCopy) tooltipLine(tip, 'Also heals you for ' + Math.round(100 * spell.selfCopy) + '% when used on another ally.');
    const crit = spell.period && !spell.periodicCrit ? 0 : Math.min(1, profile.crit + (spell.bonusCrit ?? 0) + (spell.boundless ?? 0));
    tooltipValue(tip, key === 'regrowth' ? 'Direct and periodic crit' : 'Crit chance', (100 * crit).toFixed(1) + '%');
    const efficiency = expectedHealingPerMana(spell, previewProfile);
    tooltipValue(tip, 'Avg healing per mana', efficiency.perMana === null ? '—' : efficiency.perMana.toFixed(2), 'game-tooltip-mana');
    tooltipLine(tip, 'Full duration and all targets, before overhealing' + (spell.illumination ? '; includes average Illumination refund.' : '.'), 'game-tooltip-muted');
    if (!spell.period) tooltipValue(tip, 'Base healing', range(0), 'game-tooltip-reference');
    if (spell.period || spell.hot) {
      const basePeriodic = periodicHealingPreview({...baseSpell, multiplier:1,
        hot:baseSpell.hot && {...baseSpell.hot, multiplier:1}}, 0);
      tooltipValue(tip, key === 'stream' ? 'Base heal per tick' : 'Base heal over time (' + basePeriodic.duration + 'sec)', formatHealingRange(key === 'stream' ? basePeriodic.first : basePeriodic.total),
        spell.period ? 'game-tooltip-reference' : 'game-tooltip-muted');
    }
    tooltipValue(tip, 'Bonus healing', '+' + whole(previewProfile.power), 'game-tooltip-muted');
    if (key === 'regrowth') {
      tooltipValue(tip, 'Scaling (direct)', (spell.coefficient * 100).toFixed(1) + '%', 'game-tooltip-muted');
      tooltipValue(tip, 'Scaling (HoT)', (periodicHealingScaling(spell) * 100).toFixed(2) + '%', 'game-tooltip-muted');
      tooltipValue(tip, 'Talent multiplier (direct)', '×' + Number(spell.multiplier.toFixed(3)), 'game-tooltip-muted');
      tooltipValue(tip, 'Talent multiplier (HoT)', '×' + Number(spell.hot.multiplier.toFixed(3)), 'game-tooltip-muted');
    } else {
      const fullDuration = !!spell.period && key !== 'stream';
      tooltipValue(tip, key === 'stream' ? 'Scaling (per tick)' : fullDuration ? 'Scaling (full duration)' : 'Scaling',
        ((fullDuration ? periodicHealingScaling(spell) : spell.coefficient) * 100).toFixed(2) + '%', 'game-tooltip-muted');
      tooltipValue(tip, 'Talent multiplier', '×' + Number(spell.multiplier.toFixed(3)), 'game-tooltip-muted');
    }
    if (key === 'chain') {
      for (const [index, label] of ['primary', '1st bounce', '2nd bounce'].entries()) {
        tooltipValue(tip, 'With Riptide (' + label + ')',
          formatHealingRange(healingRange(spell, previewProfile.power, 1.25 * spell.falloff ** index)), 'game-tooltip-good');
      }
    }
    return true;
  }
  let selectedSchool = schools[0], bookPage = 0, bookStatus = 'all';
  let bookTooltips = [];
  find('[data-book-title]').textContent = className[0].toUpperCase() + className.slice(1) + ' spellbook';
  const allRanks = find('[data-all-ranks]');
  const bookLevel = find('[data-book-level]');
  const bookSearch = find('[data-filter]');
  const schoolButtons = schools.map((school, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'book-school-' + index;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'forever-spellbook');
    button.append(icon(schoolIcons[index]), school);
    button.onkeydown = event => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step && !['Home','End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? schools.length - 1 : (index + step + schools.length) % schools.length;
      schoolButtons[target].click(); schoolButtons[target].focus();
    };
    button.onclick = () => { selectedSchool = school; bookPage = 0; renderBook(); };
    find('[data-schools]').append(button);
    return button;
  });
  const bookCatalog = foreverSpellbook(className, catalog, trees, spellGroups);
  const bookRows = Object.entries(bookCatalog).map(([name, entry]) => {
    const [school, status] = spellGroups[name] ?? [entry.school ?? schools[0].toLowerCase(), ''];
    return {name, school, status, talentAbility:entry.talentAbility, ranks: entry.ranks.map(rank => {
      const row = byName(name).find(candidate => candidate.rank === rank.rank);
      const effects = row?.effects.filter(effect => effect.coefficient) ?? [];
      const coefficients = effects.map(effect => (effect.coefficient * 100).toFixed(1) + '%' +
        (effect.period ? ' per ' + effect.period + ' sec' : ''));
      return {rank, coefficients, row};
    })};
  });

  function renderBook() {
    const grid = find('[data-catalog]');
    for (const tooltip of bookTooltips) tooltip.destroy();
    bookTooltips = [];
    hideGameTooltipWithin(grid);
    grid.replaceChildren();
    schoolButtons.forEach((button, index) => {
      const selected = schools[index] === selectedSchool;
      button.setAttribute('aria-pressed', selected);
      button.setAttribute('aria-selected', selected);
      button.tabIndex = selected ? 0 : -1;
      if (selected) grid.setAttribute('aria-labelledby', button.id);
    });
    const level = Math.max(1, Math.min(60, bookLevel.valueAsNumber || 60));
    const query = bookSearch.value.trim();
    const options = {school:selectedSchool, query, level, allRanks:allRanks.checked};
    const allEntries = spellbookEntries(bookRows, options);
    const entries = spellbookEntries(bookRows, {...options, status:bookStatus});
    const page = spellbookPage(entries, bookPage);
    bookPage = page.index;
    const title = document.createElement('header');
    title.className = 'book-heading';
    const heading = document.createElement('h2');
    heading.textContent = query ? 'Search results' : selectedSchool;
    const count = document.createElement('span');
    count.textContent = entries.length + (allRanks.checked ? ' spell ranks' : ' spells');
    title.append(heading, count);
    const spread = document.createElement('div');
    spread.className = 'book-spread';
    function renderPage(rows, side) {
      const list = document.createElement('div');
      list.className = 'book-page';
      list.setAttribute('aria-label', side + ' spellbook page');
      for (const {name, status, rank, coefficients, row, talentAbility} of rows) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'book-spell';
        const label = document.createElement('span');
        label.className = 'book-spell-label';
        const spellName = document.createElement('strong');
        spellName.textContent = name;
        if (['changed','new','removed'].includes(status)) {
          const badge = document.createElement('span');
          badge.className = 'book-change ' + status;
          badge.textContent = status === 'new' ? '★' : status === 'removed' ? '✕' : '◆';
          badge.setAttribute('aria-label', status === 'new' ? 'New in Forever' : status === 'removed' ? 'Not in Forever' : 'Changed from Classic');
          spellName.append(' ', badge);
        }
        const sub = document.createElement('small');
        sub.textContent = status === 'removed' ? 'Not in Forever' : rank.rank || (rank.details?.includes('Passive') ? 'Passive' : 'Level ' + rank.level);
        if (talentAbility) sub.textContent += ' · Talent ability';
        label.append(spellName, sub);
        button.append(icon(name, bookCatalog[name]), label);
        const render = tip => {
          tip.replaceChildren();
          tooltipLine(tip, name, 'game-tooltip-title');
          if (status === 'removed') tooltipLine(tip, 'Not in Forever', 'game-tooltip-muted');
          tooltipLine(tip, [rank.rank, 'Level ' + rank.level].filter(Boolean).join(' · '));
          const key = healingByName.get(name);
          if (key && row) {
            const spell = applyTalents(spellFor(key, name, row), talentPoints);
            tooltipLine(tip, whole(spell.cost) + ' mana · ' + (spell.channel ? spell.duration + ' sec channel' : spell.cast ? Number((spell.cast / (1 + (profile.haste ?? 0))).toFixed(2)) + ' sec cast' : 'Instant'));
            if (spell.cooldown) tooltipLine(tip, spell.cooldown + ' sec cooldown');
          }
          const healing = renderHealingBreakdown(tip, name, row);
          if (!healing) {
            if (!key && rank.details) tooltipLine(tip, rank.details);
            tooltipLine(tip, rank.description || '', 'game-tooltip-description');
            if (coefficients.length) tooltipLine(tip, 'Scaling · ' + coefficients.join(' / '), 'game-tooltip-reference');
          }
        };
        const tooltip = attachGameTooltip(button, render);
        bookTooltips.push(tooltip);
        button.onclick = () => tooltip.show();
        list.append(button);
      }
      return list;
    }
    spread.append(renderPage([...page.left,...page.right], 'Spells'));
    const pagination = document.createElement('nav');
    pagination.className = 'book-pagination';
    pagination.setAttribute('aria-label', 'Spellbook pages');
    const previous = document.createElement('button');
    previous.type = 'button'; previous.textContent = '‹';
    previous.setAttribute('aria-label', 'Previous spellbook page');
    previous.disabled = page.index === 0;
    previous.onclick = () => {bookPage--; renderBook(); find('[data-book-page-next]').focus();};
    const position = document.createElement('span');
    position.setAttribute('role', 'status');
    position.textContent = 'Page ' + (page.index + 1) + '/' + page.pages;
    const next = document.createElement('button');
    next.type = 'button'; next.textContent = '›';
    next.dataset.bookPageNext = '';
    next.setAttribute('aria-label', 'Next spellbook page');
    next.disabled = page.index === page.pages - 1;
    next.onclick = () => {bookPage++; renderBook(); find('[data-book-page-previous]').focus();};
    previous.dataset.bookPagePrevious = '';
    pagination.append(previous, position, next);
    const legend = document.createElement('nav');
    legend.className = 'book-legend';
    legend.setAttribute('aria-label', 'Filter spell changes');
    for (const [key,label] of [['all','All'],['new','★ New in Forever'],['changed','◆ Changed'],['same','Same as Classic'],['unclassified','Other']]) {
      const total = allEntries.filter(entry => key === 'all' || entry.status === key).length;
      if (key === 'unclassified' && !total) continue;
      const filter = document.createElement('button');
      filter.type = 'button';
      filter.textContent = label + ' ' + total;
      filter.setAttribute('aria-pressed', String(bookStatus === key));
      filter.onclick = () => {bookStatus = key; bookPage = 0; renderBook();};
      legend.append(filter);
    }
    grid.append(title);
    if (entries.length) grid.append(spread, pagination);
    else {
      const empty = document.createElement('p');
      empty.className = 'book-empty';
      empty.textContent = 'No spells match your filters. ';
      const clear = document.createElement('button');
      clear.type = 'button'; clear.textContent = 'Clear filters';
      clear.onclick = () => {bookSearch.value = ''; bookStatus = 'all'; bookPage = 0; renderBook();};
      empty.append(clear);grid.append(empty);
    }
    find('[data-book-legend]').replaceChildren(legend);
  }
  allRanks.onchange = bookLevel.oninput = bookSearch.oninput = () => {bookPage = 0; renderBook();};
  mountTabs(find('.heal-menu'));
  const stopCustomStatsLayout = mountCustomStatsLayout(find('.heal-menu'));
  renderBook();

  const manaRows = new Map();
  const meterRows = new Map();
  const meterNames = new Map([...slots, ...extraMeters]);
  const splitToggle = find('[data-detailed-split]');
  splitToggle.onchange = () => renderMeters(pull.state);
  function createMeterRow(key, name, baseName = name) {
    const row = document.createElement('details');
    row.className = 'meter-row';
    row.ontoggle = () => { if (row.open) renderMeters(pull.state); };
    const summary = document.createElement('summary');
    const label = document.createElement('span');
    label.append(icon(baseName), name);
    const total = document.createElement('strong');
    const breakdown = document.createElement('dl');
    breakdown.className = 'healing-breakdown';
    const fields = [
      ['casts', 'Casts'], ['normal-hits', 'Normal hits'],
      ['crits', 'Critical hits'], ['overheal', 'Overhealing'], ['hpm', 'Healing per mana']
    ].map(([art, title]) => addMetric(breakdown, art, title));
    summary.append(label, total);
    const eventBars = document.createElement('div');
    eventBars.className = 'healing-event-bars';
    row.append(summary, eventBars, breakdown);
    find('[data-meter]').append(row);
    meterRows.set(key, {row, summary, total, fields, eventBars});
  }
  function renderMeters(state) {
    const ended = ['won', 'lost'].includes(state.phase);
    const supportsSplit = ['druid', 'shaman'].includes(className) ||
      (className === 'priest' && !!currentSpells.flash?.selfCopy);
    find('[data-detailed-split-label]').hidden = !ended || !supportsSplit;
    const entries = healingMeterEntries(state.meters, ended && !find('[data-detailed-split-label]').hidden && splitToggle.checked);
    const displayedKeys = new Set(entries.map(entry => entry.key));
    for (const [key, {row}] of meterRows) if (!displayedKeys.has(key)) row.hidden = true;
    find('[data-meter-empty]').hidden = entries.some(entry => entry.stats.hits);
    let meterIndex = 0;
    for (const {key, baseKey, label, stats, spellStats} of entries) {
      const name = meterNames.get(baseKey) ?? baseKey;
      if (!meterRows.has(key)) createMeterRow(key, label ? name + ' (' + label + ')' : name, name);
      const {row, summary, total, fields, eventBars} = meterRows.get(key);
      row.hidden = !stats?.hits;
      if (row.hidden) continue;
      const container = find('[data-meter]');
      if (container.children[meterIndex] !== row) container.insertBefore(row, container.children[meterIndex] ?? null);
      meterIndex++;
      summary.style.setProperty('--meter-color', healingColors[baseKey] ?? '#397b42');
      const raw = stats.effective + stats.overheal;
      const percent = (part, all) => (all ? 100 * part / all : 0).toFixed(1) + '%';
      const share = percent(stats.effective, state.healing);
      setBarNumbers(total, whole(stats.effective), share);
      summary.style.setProperty('--share', (100 * stats.effective / (Math.max(...entries.map(entry => entry.stats.effective)) || 1)) + '%');
      if (!row.open) continue;
      const maxHealing = Math.max(...entries.map(entry => entry.stats.effective)) || 1;
      const eventSignature = JSON.stringify([stats.events, maxHealing]);
      if (eventBars.dataset.renderKey !== eventSignature || !eventBars.childElementCount) {
        hideGameTooltipWithin(eventBars);
        eventBars.replaceChildren();
        eventBars.dataset.renderKey = eventSignature;
        for (const event of healingEventRows(stats)) {
          const bar = document.createElement('div');
          bar.className = 'mana-source-bar healing-event-bar';
          bar.style.setProperty('--source-color', healingColors[baseKey] ?? '#397b42');
          bar.style.setProperty('--share', (100 * event.effective / maxHealing) + '%');
          const label = document.createElement('span');
          const art = document.createElement('span');
          art.className = 'healing-event-icon';
          const image = document.createElement('img');
          image.src = new URL('./' + event.icon, import.meta.url);
          image.alt = '';
          art.append(image);
          label.append(art, event.label);
          const count = document.createElement('strong');
          setBarNumbers(count, event.count, event.crit ? '(' + Number(event.critPercent.toFixed(1)) + '%)' : '', '');
          bar.tabIndex = 0;
          bar.append(label, count);
          eventBars.append(bar);
          setGameTooltip(bar, event.label, [whole(event.effective) + ' effective healing', whole(event.overheal) + ' overhealing']);
        }
      }
      const values = [stats.casts, stats.hits - stats.crits,
        stats.crits,
        whole(stats.overheal) + ' (' + percent(stats.overheal, raw) + ')',
        spellStats.mana ? (spellStats.effective / spellStats.mana).toFixed(2) : '—'];
      fields.forEach((field, index) => {
        if (index === 1 || index === 2) {
          const crit = index === 2;
          const events = ['d_', 'p_'].map(prefix => stats.events?.[prefix + (crit ? 'crits' : 'hits')]).filter(Boolean);
          const hits = Number(values[index]);
          const effective = events.length ? events.reduce((sum, event) => sum + event.effective, 0) : (!crit && !stats.crits ? stats.effective : 0);
          const overheal = events.length ? events.reduce((sum, event) => sum + event.overheal, 0) : (!crit && !stats.crits ? stats.overheal : 0);
          const average = hits ? effective / hits : 0;
          const excess = hits ? overheal / hits : 0;
          const signature = [hits, average, excess].join(':');
          if (field.dataset.average !== signature) {
            field.dataset.average = signature;
            const count = document.createElement('span'); count.className = 'hit-count';
            const countValue = document.createElement('span'); countValue.className = 'hit-value'; countValue.textContent = whole(hits);
            count.append('Hits', countValue);
            const summary = document.createElement('span'); summary.className = 'hit-summary';
            const healing = document.createElement('span'); healing.className = 'hit-average'; healing.textContent = whole(average);
            const waste = document.createElement('span'); waste.className = 'hit-overheal'; waste.textContent = '(+' + whole(excess) + ')';
            summary.append('Avg', healing, waste);
            field.replaceChildren(count, summary);
            setGameTooltip(field.parentElement, crit ? 'Critical hits' : 'Normal hits', [hits + ' hits', whole(average) + ' average effective healing per hit', whole(excess) + ' average overhealing per hit']);
          }
          return;
        }
        const value = String(values[index]);
        if (field.textContent !== value) field.textContent = value;
      });
    }
  }

  function renderManaMeters(state) {
    find('[data-mana-gained-total]').textContent = whole(state.manaGained);
    find('[data-mana-empty]').hidden = state.manaGained > 0;
    const sources = manaReportSources(state.manaSources);
    if (currentSpells.waterShield && !sources.some(([source]) => source === 'Water Shield')) sources.push(['Water Shield', 0]);
    for (const {row} of manaRows.values()) row.hidden = true;
    let sourceIndex = 0;
    for (const [source, value] of sources) {
      if (!manaRows.has(source)) {
        const row = document.createElement('details');
        row.className = 'meter-row';
        const summary = document.createElement('summary');
        const label = document.createElement('span');
        const image = document.createElement('img');
        image.src = new URL('./' + reportManaVisual(source)[0], import.meta.url);
        image.alt = '';
        label.append(image, source === 'Spirit regeneration' ? 'Spirit' : source);
        const total = document.createElement('strong');
        const children = document.createElement('div');
        summary.append(label, total);
        row.append(summary, children);
        let innervateTotal;
        if (source === 'Spirit regeneration') {
          const normal = document.createElement('span');
          normal.className = 'mana-pair-heading';
          normal.append(label, total);
          const boosted = document.createElement('span');
          boosted.className = 'mana-pair-heading';
          const boostedLabel = document.createElement('span');
          const boostedIcon = document.createElement('img');
          boostedIcon.src = new URL('./' + reportManaVisual('Innervate')[0], import.meta.url);
          boostedIcon.alt = '';
          boostedLabel.append(boostedIcon, 'Innervate');
          innervateTotal = document.createElement('strong');
          boosted.append(boostedLabel, innervateTotal);
          summary.replaceChildren(normal, boosted);
          row.classList.add('mana-spirit-pair');
        }
        let gearing;
        if (source === 'Spirit regeneration' || source === 'Mana / 5') {
          gearing = document.createElement('button');
          gearing.type = 'button';
          gearing.className = 'mana-gearing';
          const art = document.createElement('img');
          art.src = new URL('./' + purposeIconPath(source === 'Spirit regeneration' ? 'spirit' : 'mp5'), import.meta.url);
          art.alt = '';
          const amount = document.createElement('strong');
          gearing.append(art, amount);
          gearing.onclick = event => { event.preventDefault(); event.stopPropagation(); };
          total.parentElement.insertBefore(gearing, total);
        }
        manaRows.set(source, {row, summary, total, children, innervateTotal, gearing, sourceLabel:label});
      }
      const {row, summary, total, children, innervateTotal, gearing, sourceLabel} = manaRows.get(source);
      if (source === 'Water Shield') {
        const duration = state.endedAt ?? state.time;
        const uptime = duration > 0 ? Math.min(100, 100 * state.waterShieldUptime / duration) : 0;
        sourceLabel.lastChild.textContent = 'Water Shield (' + Math.round(uptime) + '% Uptime)';
        sourceLabel.tabIndex = 0;
        setGameTooltip(sourceLabel, 'Water Shield uptime', [state.waterShieldUptime.toFixed(1) + ' / ' + duration.toFixed(1) + ' combat seconds active', 'Active while at least one charge remains. The proc cooldown counts as active time.']);
      }
      if (gearing) {
        const spirit = source === 'Spirit regeneration';
        const value = (spirit ? state.manaPerSpirit : state.manaPerMp5) ?? 0;
        const amount = value.toLocaleString('en-US', {minimumFractionDigits:1, maximumFractionDigits:1});
        gearing.lastElementChild.textContent = amount + (spirit ? ' / Spirit' : ' / MP5');
        const explanation = amount + ' additional mana per +1 ' + (spirit ? 'base Spirit' : 'mana / 5') + ' over this pull. ' +
          (spirit ? 'Includes Spirit multipliers, casting regeneration, and Innervate.' : 'Mana / 5 regeneration continues while casting.') +
          ' Excludes regeneration lost at full mana; stops accumulating when the encounter ends.';
        setGameTooltip(gearing, spirit ? 'Mana per +1 base Spirit' : 'Mana per +1 Mana / 5', [amount + ' additional mana this fight', spirit ? 'Includes Spirit multipliers, casting regeneration, and Innervate.' : 'Continues regenerating mana while casting.', 'Excludes mana lost at the cap. Final value freezes at fight end.']);
        gearing.setAttribute('aria-label', explanation);
      }
      row.hidden = false;
      const share = (100 * value / (state.manaGained || 1)).toFixed(1) + '%';
      setBarNumbers(total, whole(value), share);
      summary.style.setProperty('--share', share);
      summary.style.setProperty('--meter-color', reportManaVisual(source)[1]);
      const innervate = source === 'Spirit regeneration' ? state.manaSources.Innervate ?? 0 : 0;
      const normal = value - innervate;
      if (innervateTotal) {
        setBarNumbers(total, whole(normal), (100 * normal / state.manaGained).toFixed(1) + '%');
        setBarNumbers(innervateTotal, whole(innervate), (100 * innervate / state.manaGained).toFixed(1) + '%');
        const rightmostTotal = innervate ? innervateTotal : total;
        rightmostTotal.parentElement.insertBefore(gearing, rightmostTotal);
        summary.style.setProperty('--normal-share', (100 * normal / state.manaGained) + '%');
        summary.style.setProperty('--innervate-color', reportManaVisual('Innervate')[1]);
        innervateTotal.parentElement.hidden = !innervate;
      }
      const weights = source === 'Spirit regeneration' ? profile.spiritRates : source === 'Mana / 5' ? profile.mp5Sources : null;
      const childSignature = JSON.stringify([source, value, weights, normal, innervate, state.manaGained]);
      if (children.dataset.renderKey !== childSignature) {
        hideGameTooltipWithin(children);
        children.replaceChildren();
        children.dataset.renderKey = childSignature;
        if (weights) {
          const sum = Object.values(weights).reduce((a, b) => a + b, 0);
          for (const [name, weight] of Object.entries(weights).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])) {
            const bar = document.createElement('div');
            bar.className = 'mana-source-bar';
            bar.style.setProperty('--source-color', contributionColor(source, name));
            const split = spiritContribution(normal, innervate, weight, sum, state.manaGained);
            const contribution = split.normalMana + split.innervateMana;
            const totalShare = split.totalShare;
            if (source === 'Spirit regeneration') {
              bar.classList.add('mana-split-bar');
              bar.style.setProperty('--normal-share', split.normalShare + '%');
              bar.style.setProperty('--innervate-color', reportManaVisual('Innervate')[1]);
            }
            bar.style.setProperty('--share', totalShare + '%');
            bar.tabIndex = 0;
            setGameTooltip(bar, name, [(100 * weight / sum).toFixed(1) + '% of ' + source,
              totalShare.toFixed(1) + '% of total mana gained',
              ...(source === 'Spirit regeneration' ? ['Normal: ' + whole(split.normalMana) + ' · Innervate: ' + whole(split.innervateMana)] : [])]);
            const label = document.createElement('span');
            const image = document.createElement('img');
            image.src = new URL('./' + (contributionIcons[name] ?? purposeIconPath('gained')), import.meta.url);
            image.alt = '';
            label.append(image, name);
            const amount = document.createElement('strong');
            setBarNumbers(amount, whole(contribution), totalShare.toFixed(1) + '%');
            bar.append(label, amount);
            children.append(bar);
          }
        } else {
          const note = document.createElement('p');
          note.textContent = source.endsWith(' · spell cost') ? 'Mana saved by free casts; included in total mana gained.' : source.endsWith(' · Spirit regeneration') ? (source.startsWith('Omen') ? 'Extra usable Spirit regeneration during the five seconds after a free spell lands, relative to that spell costing mana; excludes overlap with Innervate and mana lost to the cap.' : 'Extra Spirit regeneration until the next paid spell lands, relative to five-second-rule regeneration; excludes overlap with Innervate and mana lost to the cap.') : 'Mana restored after the mana cap; excess regeneration is excluded.';
          children.append(note);
        }
      }
      const container = find('[data-mana-meter]');
      if (container.children[sourceIndex] !== row) container.insertBefore(row, container.children[sourceIndex] ?? null);
      sourceIndex++;
    }
  }

  let audio;
  function enableAudio() {
    if (!soundEnabled) return;
    if (!window.AudioContext) {
      soundEnabled = false;
      renderSoundToggle();
      return;
    }
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
  }
  function renderSoundToggle() {
    const button = find('[data-sound]');
    const label = soundEnabled ? 'Mute healing sounds' : 'Unmute healing sounds';
    button.setAttribute('aria-pressed', String(soundEnabled));
    button.setAttribute('aria-label', label);
    setGameTooltip(button, label, [soundEnabled ? 'Healing sounds are on.' : 'Healing sounds are muted.']);
    button.querySelector('[data-sound-on]').toggleAttribute('hidden', !soundEnabled);
    button.querySelector('[data-sound-off]').toggleAttribute('hidden', soundEnabled);
  }
  find('[data-sound]').onclick = () => {
    soundEnabled = !soundEnabled;
    renderSoundToggle();
    enableAudio();
    saveSettings();
  };
  function playHealSound(crit, bounce) {
    if (audio?.state !== 'running' || !soundEnabled) return;
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

  const startButton = find('[data-start]');
  const onStart = () => { enableAudio(); };
  startButton.addEventListener('click', onStart);
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

  hotkeys = mountHotkeys({root, storageKey:settingsKey, spells:spellButtons,
    isAvailable:key => !!currentSpells?.[key],
    cast:(key,index) => { pendingTargetSpell = null; pull.cast(key,index); render(); }});
  damageText = mountDamageText(find('.boss-crest'), damageIcons);
  reset(false, false);
  function frame(now) {
    const delta = Math.min(.1, (now - last) / 1000);
    last = now;
    if (pull.state.phase !== 'ready') {
      pull.step(delta);
      render();
    }
    animation = requestAnimationFrame(frame);
  }
  const stopScoreLayout = watchScoreFormula(find('[data-regen-result]'));
  let animation = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(animation);
    stopScoreLayout();
    damageText.destroy();
    stopCustomStatsLayout();
    gearEditor.destroy();
    hotkeys.destroy();
    for (const tooltip of bookTooltips) tooltip.destroy();
    hideGameTooltip();
    visualPull++;
    startButton.removeEventListener('click', onStart);
    audio?.close();
    for (const {tooltip} of [...spellButtons, ...bossAbilityRows]) tooltip.hide();
    delete bossActions.dataset.encounter;
  };
}
