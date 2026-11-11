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
    gain(unit, stats.regen * dt * (rotation.adrenalineUntil > now ? 2 : 1));
    if (rotation.evocationUntil > now) gain(unit, unit.resource.max * .075 * dt);
    const ready = (spell, cost) => (rotation.cooldowns[spell] ?? 0) <= now && unit.resource.value >= cost;
    const weapon = speed => stats.weapon + stats.ap * speed / 14;
    function recordDamage(spell, amount, crit = false) {
      const meter = unit.damage[spell] ??= {attempts:0, hits:0, crits:0, total:0};
      const damage = Math.min(state.boss, Math.round(amount));
      meter.hits++;
      meter.crits += Number(crit);
      meter.total += damage;
      state.boss -= damage;
    }
    function hit(spell, base, {ignite = false, bonusCrit = 0, magic = false, auto = false, critMultiplier = 2, spread = .05, grantsRage = false} = {}) {
      const meter = unit.damage[spell] ??= {attempts:0, hits:0, crits:0, total:0};
      meter.attempts++;
      const roll = random();
      const miss = 1 - stats.hit + (auto && stats.offHand ? .19 : 0) +
        (stats.expertise === undefined ? 0 : Math.max(0, .065 - stats.expertise));
      if (roll < miss) return false;
      const crit = roll < miss + stats.crit + bonusCrit;
      const glance = !crit && auto && stats.resource !== 'Mana' && roll < miss + stats.crit + .4;
      const infused = magic && unit.powerInfusion?.expires > now;
      const damage = base * (1 - spread + 2 * spread * random()) *
        (magic ? 1 : 5500 / (5500 + bossArmor(state))) * (crit ? critMultiplier : glance ? .7 : 1) * (infused ? 1.2 : 1);
      recordDamage(spell, damage, crit);
      if (unit.name === 'Jaina' && random() < .1) rotation.clearcasting = true;
      if (ignite && crit) {
        gain(unit, (rotation.mageCastCost ?? 0) * .3);
        rotation.ignitePool = (rotation.ignitePool ?? 0) + damage * .4;
        rotation.igniteTick ??= now + 2;
        rotation.igniteTicks = 2;
      }
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
      if ((rotation.cooldowns['Adrenaline Rush'] ?? 0) <= now && unit.resource.value <= 40) {
        rotation.adrenalineUntil = now + 15;
        rotation.cooldowns['Adrenaline Rush'] = now + 300;
      }
      const haste = (rotation.sliceUntil > now ? 1.3 : 1) * (rotation.flurryUntil > now ? 1.2 : 1);
      if (now >= rotation.swing) {
        rotation.swing += stats.speed / haste;
        hit('Main-hand swing', weapon(stats.speed), {auto:true});
      }
      if (now >= rotation.offSwing) {
        rotation.offSwing += stats.offSpeed / haste;
        hit('Off-hand swing', (stats.offHand + stats.ap * stats.offSpeed / 14) * .75, {auto:true});
      }
      if (now < rotation.action) continue;
      if (ready('Blade Flurry', 25)) {
        spend('Blade Flurry', 25, 120, 1);
        rotation.flurryUntil = now + 15;
      } else if (rotation.combo >= 2 && !(rotation.sliceUntil > now) && ready('Slice and Dice', 25)) {
        spend('Slice and Dice', 25, 0, 1);
        rotation.sliceUntil = now + (6 + 3 * rotation.combo) * 1.45;
        rotation.combo = Number(random() < .6);
      } else if (rotation.combo === 5 && ready('Eviscerate', 35)) {
        spend('Eviscerate', 35, 0, 1);
        if (hit('Eviscerate', 108 + 170 * rotation.combo + .15 * stats.ap)) rotation.combo = Number(random() < .6);
      } else if (rotation.combo < 5 && ready('Sinister Strike', 40)) {
        spend('Sinister Strike', 40, 0, 1);
        if (hit('Sinister Strike', weapon(2.4) + 68, {critMultiplier:2.3})) rotation.combo++;
      }
    } else if (unit.name === 'Sylvanas') {
      // ForeverDB's ranged priority assumes Hunter's Mark, Hawk and Improved Tracking.
      const ranged = (speed, bonus = 0) => (weapon(speed) + 263 * speed / 14 + bonus) * 1.05;
      if (now >= (rotation.petSwing ?? 2)) {
        rotation.petSwing = now + 2;
        hit('Pet: Melee', 60, {spread:.25});
      }
      if (now >= (rotation.petClaw ?? 5)) {
        rotation.petClaw = now + 5;
        hit('Pet: Claw', 50);
      }
      if (rotation.stingTicks && now >= rotation.stingTick) {
        recordDamage('Serpent Sting', 58 * 1.05);
        rotation.stingTicks--;
        rotation.stingTick += 3;
      }
      if (rotation.aimedUntil > now) continue;
      if (rotation.aimedUntil) {
        hit('Aimed Shot', ranged(2.8, 350), {critMultiplier:2.3});
        rotation.aimedUntil = 0;
      }
      if ((rotation.cooldowns['Rapid Fire'] ?? 0) <= now) {
        rotation.cooldowns['Rapid Fire'] = now + 300;
        rotation.rapidUntil = now + 15;
      }
      if (now >= rotation.swing) {
        rotation.swing = now + stats.speed / (rotation.rapidUntil > now ? 1.4 : 1);
        hit('Auto Shot', ranged(stats.speed), {auto:true, critMultiplier:2.3});
      }
      if (now < rotation.action) continue;
      if (!rotation.stingTicks && ready('Serpent Sting', 115)) {
        spend('Serpent Sting', 115);
        rotation.stingTicks = 5;
        rotation.stingTick = now + 3;
      } else if (ready('Arcane Shot', 190)) {
        spend('Arcane Shot', 190, 6);
        hit('Arcane Shot', 280 * 1.05, {magic:true, critMultiplier:2.3});
      } else if (ready('Aimed Shot', 310)) {
        spend('Aimed Shot', 310, 6, 2);
        rotation.aimedUntil = now + 2;
      }
    } else if (unit.name === 'Jaina') {
      const fire = state.encounterId === 'sapphiron';
      if (rotation.igniteTicks && now >= rotation.igniteTick) {
        const tick = rotation.ignitePool / rotation.igniteTicks;
        recordDamage('Ignite', tick);
        rotation.ignitePool -= tick;
        rotation.igniteTicks--;
        rotation.igniteTick = rotation.igniteTicks ? rotation.igniteTick + 2 : undefined;
      }
      if (now < rotation.action || !state.boss) continue;
      const vulnerability = fire && rotation.scorchUntil > now ? (rotation.scorchStacks ?? 0) : 0;
      if (rotation.casting) {
        const {spell, base, spread, bonusCrit} = rotation.casting;
        const multiplier = fire ? 1 + .03 * vulnerability : spell === 'Frostbolt' ? 1.06 : 1;
        const landed = hit(spell, base * multiplier, {magic:true, ignite:fire, spread, bonusCrit,
          critMultiplier:spell === 'Frostbolt' || spell === 'Ice Lance' ? 2 : 1.5});
        if (landed && spell === 'Scorch') {
          rotation.scorchStacks = Math.min(5, vulnerability + 1);
          rotation.scorchUntil = now + 30;
        }
        if (landed && spell === 'Frostbolt' && random() < .15) rotation.fingers = 2;
        rotation.casting = null;
      }
      if (!state.boss) continue;
      if (unit.resource.value < .15 * unit.resource.max && ready('Evocation', 0)) {
        spend('Evocation', 0, 480, 8);
        rotation.evocationUntil = now + 8;
        continue;
      }
      const stacks = rotation.scorchUntil > now ? rotation.scorchStacks : 0;
      let spell = fire ? 'Fireball' : 'Frostbolt';
      let base = fire ? 483 + stats.power : 475 + .814 * stats.power;
      let cost = fire ? 410 : 290;
      let castTime = fire ? 3 : 2.5;
      let spread = .05;
      let bonusCrit = 0;
      let cooldown = 0;
      if (ready('Fire Blast', rotation.clearcasting ? 0 : 340)) {
        spell = 'Fire Blast';
        base = 438 + .429 * stats.power;
        cost = 340;
        castTime = 0;
        cooldown = 8;
      } else if (fire && (stacks < 5 || rotation.scorchUntil - now < 4)) {
        spell = 'Scorch';
        base = 178 + .429 * stats.power;
        cost = 150;
        castTime = 1.5;
      } else if (!fire && rotation.fingers) {
        spell = 'Ice Lance';
        base = 3 * (28 + .143 * stats.power);
        cost = 120;
        castTime = 0;
        bonusCrit = .5;
      }
      if (rotation.clearcasting) cost = 0;
      if (ready(spell, cost)) {
        spend(spell, cost, cooldown, Math.max(1.5, castTime));
        rotation.mageCastCost = cost;
        rotation.clearcasting = false;
        if (spell === 'Ice Lance') rotation.fingers--;
        if (castTime) rotation.casting = {spell, base, spread, bonusCrit};
        else hit(spell, base * (fire ? 1 + .03 * stacks : 1),
          {magic:true, ignite:fire, bonusCrit, critMultiplier:spell === 'Ice Lance' ? 2 : 1.5});
      }
    }
  }
}
