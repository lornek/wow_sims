import {warriorGear} from './warrior-gear.mjs';

export const encounters = {
  rend: {name:'Rend Blackhand', health:28000, limit:85, swing:225, firstFlurry:17, flurry:265, poisonTick:100,
    description:'Tank damage, Blade Flurry, and a dispellable debuff. Enrages at 35%.'},
  patchwerk: {name:'Patchwerk', health:30000, limit:90, swing:360, strike:680,
    description:'Cairne takes melee swings. Illidan serves as the off-tank for Hateful Strike.'},
  sapphiron: {name:'Sapphiron', health:30000, limit:95, swing:200, frost:105,
    description:'Frost Aura steadily damages the entire party.'}
};

// Level 60 Tauren Warrior base stats and Forever combat rating conversions.
const gearStat = key => warriorGear.reduce((sum, item) => sum + (item[key] ?? 0), 0);
const warriorStrength = 125 + gearStat('strength');
const warriorAgility = 75 + gearStat('agility');
const warriorSpeed = gearStat('speed');
const sunderArmor = 450;
const sunderDuration = 30;
// Improved Sunder Armor and Focused Rage reduce rank 5's 15-rage cost by 3 each.
const sunderCost = 9;

export function bossArmor(state) {
  const stacks = state.sunderUntil > state.time ? state.sunderStacks : 0;
  return Math.max(0, 3731 - stacks * sunderArmor);
}

export const combatants = {
  Cairne: {resource:'Rage', max:100, regen:0, ap:160 + 2 * warriorStrength + gearStat('ap'),
    crit:(warriorAgility * .05 + gearStat('critRating') / 14) / 100,
    hit:.94 + gearStat('hitRating') / 1000, expertise:gearStat('expertiseRating') / 1000,
    blockValue:gearStat('blockValue') + warriorStrength * .05,
    weaponMin:gearStat('weaponMin'), weaponMax:gearStat('weaponMax'), speed:warriorSpeed,
    swingInterval:warriorSpeed / (1 + gearStat('hasteRating') / 1000)},
  Illidan: {resource:'Energy', max:100, regen:10, ap:850, crit:.23, hit:.94, weapon:85, speed:2.6, offHand:48, offSpeed:1.5},
  Sylvanas: {resource:'Mana', max:3300, regen:165, ap:950, crit:.21, hit:.95, weapon:108, speed:2.8},
  Jaina: {resource:'Mana', max:4000, regen:160, power:250, crit:.18, hit:.94}
};

const rageConversion = .0091107836 * 60 ** 2 + 3.225598133 * 60 + 4.2652911;

export function gainDamageRage(unit, damage) {
  if (unit.resource?.type === 'Rage') gain(unit, damage * 2.5 / rageConversion);
}

function gain(unit, amount) {
  unit.resource.value = Math.min(unit.resource.max, unit.resource.value + amount);
}

export function setupPartyCombat(party) {
  for (const unit of party) {
    const stats = combatants[unit.name];
    if (!stats) continue;
    unit.resource = {type:stats.resource, max:stats.max, value:stats.resource === 'Rage' ? 0 : stats.max};
    unit.rotation = {action:0, swing:stats.swingInterval ?? stats.speed ?? Infinity, offSwing:stats.offSpeed ?? Infinity, cooldowns:{}, combo:0};
    unit.damage = {};
  }
}

export function advancePartyCombat(state, dt, random) {
  const now = state.time;
  if (!(state.sunderUntil > now)) state.sunderStacks = 0;
  for (const unit of state.party) {
    if (!unit.hp || !unit.rotation || !state.boss) continue;
    const stats = combatants[unit.name];
    const rotation = unit.rotation;
    gain(unit, stats.regen * dt);
    const ready = (spell, cost) => (rotation.cooldowns[spell] ?? 0) <= now && unit.resource.value >= cost;
    const weapon = speed => stats.weapon + stats.ap * speed / 14;
    function hit(spell, base, {magic = false, auto = false, critMultiplier = 2, spread = .05, grantsRage = false} = {}) {
      const meter = unit.damage[spell] ??= {attempts:0, hits:0, crits:0, total:0};
      meter.attempts++;
      const roll = random();
      const miss = 1 - stats.hit + (auto && stats.offHand ? .19 : 0) +
        (stats.expertise === undefined ? 0 : Math.max(0, .065 - stats.expertise));
      if (roll < miss) return false;
      const crit = roll < miss + stats.crit;
      const glance = !crit && auto && stats.resource !== 'Mana' && roll < miss + stats.crit + .4;
      const infused = magic && unit.powerInfusion?.expires > now;
      const damage = Math.min(state.boss, Math.round(base * (1 - spread + 2 * spread * random()) *
        (magic ? 1 : 5500 / (5500 + bossArmor(state))) * (crit ? critMultiplier : glance ? .7 : 1) * (infused ? 1.2 : 1)));
      meter.hits++;
      meter.crits += Number(crit);
      meter.total += damage;
      state.boss -= damage;
      if (grantsRage) {
        const before = unit.resource.value;
        gain(unit, 3.46 * stats.speed * (crit ? 2 : 1));
        rotation.swingRage += unit.resource.value - before;
      }
      return damage;
    }
    function spend(spell, cost, cooldown = 0, gcd = 1.5) {
      unit.resource.value -= cost;
      rotation.cooldowns[spell] = now + cooldown;
      rotation.action = now + gcd;
    }
    if (unit.name === 'Cairne') {
      if (rotation.opened === undefined) {
        rotation.opened = true;
        rotation.swingRage = 0;
        rotation.bloodrageTick = now + 1;
        rotation.bloodrageTicksLeft = 10;
        // The encounter starts with pooled Rage plus Charge and Bloodrage.
        gain(unit, 5 * sunderCost);
      }
      if (rotation.bloodrageTicksLeft && now >= rotation.bloodrageTick) {
        gain(unit, 1);
        rotation.bloodrageTicksLeft--;
        rotation.bloodrageTick++;
      }
      const stacking = state.sunderStacks < 5;
      const sunderNeeded = stacking || state.sunderUntil - now <= 3;
      if (now >= rotation.action && sunderNeeded && ready('Sunder Armor', sunderCost)) {
        spend('Sunder Armor', sunderCost);
        // Script landed applications so every pull gets the requested opener.
        state.sunderStacks = Math.min(5, state.sunderStacks + 1);
        state.sunderUntil = now + sunderDuration;
        const sunder = unit.damage['Sunder Armor'] ??= {attempts:0, hits:0, crits:0, total:0};
        sunder.attempts++;
        sunder.hits++;
      }
      if (now >= rotation.swing) {
        rotation.swing += stats.swingInterval;
        // Queue Heroic Strike only with surplus rage. It replaces a rage-generating swing.
        const heroic = !stacking && unit.resource.value >= 60;
        if (heroic) unit.resource.value -= 12;
        const bonus = stats.ap * stats.speed / 14 + (heroic ? 157 : 0);
        const low = stats.weaponMin + bonus;
        const high = stats.weaponMax + bonus;
        hit(heroic ? 'Heroic Strike' : 'Melee', (low + high) * .45,
          {auto:!heroic, spread:(high - low) / (high + low), grantsRage:!heroic});
      }
      if (stacking || now < rotation.action) continue;
      if (ready('Shield Slam', 17)) {
        spend('Shield Slam', 17, 6);
        hit('Shield Slam', (655 + stats.blockValue) * .9, {spread:15 / (655 + stats.blockValue)});
      } else if (rotation.revengeUntil > now && ready('Revenge', 2)) {
        spend('Revenge', 2, 5);
        rotation.revengeUntil = 0;
        const revenge = 152.5 + .25 * stats.ap;
        hit('Revenge', revenge * .9, {spread:15.5 / revenge});
      }
    } else if (unit.name === 'Illidan') {
      const haste = rotation.sliceUntil > now ? 1.3 : 1;
      if (now >= rotation.swing) {
        rotation.swing += stats.speed / haste;
        hit('Main-hand swing', weapon(stats.speed), {auto:true});
      }
      if (now >= rotation.offSwing) {
        rotation.offSwing += stats.offSpeed / haste;
        hit('Off-hand swing', (stats.offHand + stats.ap * stats.offSpeed / 14) * .75, {auto:true});
      }
      if (now < rotation.action) continue;
      if (rotation.combo >= 2 && !(rotation.sliceUntil > now) && ready('Slice and Dice', 25)) {
        spend('Slice and Dice', 25, 0, 1);
        rotation.sliceUntil = now + (6 + 3 * rotation.combo) * 1.45;
        rotation.combo = 0;
      } else if (rotation.combo === 5 && ready('Eviscerate', 35)) {
        spend('Eviscerate', 35, 0, 1);
        if (hit('Eviscerate', 108 + 170 * rotation.combo + .15 * stats.ap)) rotation.combo = 0;
      } else if (rotation.combo < 5 && ready('Sinister Strike', 40)) {
        spend('Sinister Strike', 40, 0, 1);
        if (hit('Sinister Strike', weapon(2.4) + 68)) rotation.combo++;
      }
    } else if (unit.name === 'Sylvanas') {
      if (rotation.aimedUntil > now) continue;
      if (rotation.aimedUntil) {
        hit('Aimed Shot', weapon(2.8) + 350, {critMultiplier:2.3});
        rotation.aimedUntil = 0;
      }
      if (now >= rotation.swing) {
        rotation.swing = now + stats.speed;
        hit('Auto Shot', weapon(stats.speed), {auto:true,critMultiplier:2.3});
      }
      if (now < rotation.action) continue;
      if (ready('Aimed Shot', 310)) {
        spend('Aimed Shot', 310, 6, 2);
        rotation.aimedUntil = now + 2;
      } else if (ready('Multi-Shot', 235)) {
        spend('Multi-Shot', 235, 6);
        hit('Multi-Shot', weapon(2.8), {critMultiplier:2.3});
      }
    } else if (unit.name === 'Jaina') {
      if (now < rotation.action) continue;
      const frostImmune = state.encounterId === 'sapphiron';
      const spell = frostImmune ? 'Fireball' : 'Frostbolt';
      if (rotation.casting) {
        hit(spell, frostImmune ? 483 + stats.power : (475 + .814 * stats.power) * 1.06,
          {magic:true,critMultiplier:frostImmune ? 1.5 : 2});
        rotation.casting = false;
      }
      const cost = frostImmune ? 410 : 290;
      if (ready(spell, cost)) {
        spend(spell, cost, 0, frostImmune ? 3 : 2.5);
        rotation.casting = true;
      }
    }
  }
}
