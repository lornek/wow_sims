export function createPull(profile, spells, encounter, random = Math.random, onHeal = () => {}) {
  const party = encounter.party.map(unit => ({...unit, hp: unit.max, poison: 0}));
  const state = {party, phase: 'ready', time: 0, mana: profile.mana, boss: encounter.health,
    cast: null, gcd: 0, lastSpend: -Infinity, cooldowns: {}, effects: [],
    healing: 0, overheal: 0, manaSpent: 0, message: '', nextSwing: 2,
    nextPoison: 7, nextFlurry: encounter.firstFlurry, nextMana: 2, swiftness: 0, meters: {}};

  function meter(key) {
    return state.meters[key] ??= {casts: 0, hits: 0, crits: 0, effective: 0, overheal: 0, mana: 0};
  }

  function restoreMana(amount) {
    state.mana = Math.min(profile.mana, state.mana + amount);
  }

  function heal(key, unit, raw, canCrit = false, from = null, bounce = 0) {
    if (!unit.hp) return;
    const crit = canCrit && random() < profile.crit;
    const amount = Math.round(raw * (crit ? 1.5 : 1));
    const effective = Math.min(unit.max - unit.hp, amount);
    unit.hp += effective;
    state.healing += effective;
    state.overheal += amount - effective;
    const stats = meter(key);
    stats.hits++;
    stats.crits += Number(crit);
    stats.effective += effective;
    stats.overheal += amount - effective;
    onHeal({key, target: party.indexOf(unit), from: from ? party.indexOf(from) : null, bounce, amount, effective, crit});
  }

  function healingAmount(spell, roll) {
    return ((spell.low ?? 0) + roll * ((spell.high ?? spell.low ?? 0) - (spell.low ?? 0)) +
      (spell.coefficient ?? 0) * profile.power) * (spell.multiplier ?? 1);
  }

  function directTargets(spell, unit, time) {
    const bonus = spell.chain > 1 ? state.effects.reduce((sum, effect) =>
      sum + (effect.target === unit && effect.expires >= time ? effect.directChainBonus : 0), 0) : 0;
    const others = spell.chain > 1 ? party.filter(member => member !== unit && member.hp > 0)
      .sort((a, b) => (b.max - b.hp) - (a.max - a.hp)).slice(0, spell.chain - 1) : [];
    return [{unit, factor: 1 + bonus}, ...others.map((target, index) =>
      ({unit: target, factor: spell.falloff ** (index + 1)}))];
  }

  function incomingHealing() {
    const pending = new Map(party.map(unit => [unit, 0]));
    const add = (unit, amount) => {
      if (unit.hp) pending.set(unit, pending.get(unit) + Math.round(amount));
    };
    for (const effect of state.effects) {
      if (effect.key !== 'riptide' && effect.key !== 'stream') continue;
      for (const unit of effect.target ? [effect.target] : party) add(unit, effect.amount);
    }
    if (state.cast?.spell.low && !state.cast.spell.period && state.cast.unit.hp) {
      const {spell, unit, end} = state.cast;
      for (const target of directTargets(spell, unit, end)) add(target.unit, healingAmount(spell, .5) * target.factor);
    }
    return party.map(unit => Math.min(unit.max - unit.hp, pending.get(unit)));
  }

  function resolve(spell, unit) {
    if (spell.swiftness) {
      state.swiftness = Infinity;
    } else if (spell.manaRange) {
      restoreMana(spell.manaRange[0] + random() * (spell.manaRange[1] - spell.manaRange[0]));
    } else if (spell.rez) {
      unit.hp = Math.min(unit.max, spell.rez);
    } else if (spell.dispel) {
      unit.poison = 0;
    } else if (spell.period) {
      const target = spell.party ? null : unit;
      state.effects = state.effects.filter(e => (e.key !== spell.key || e.target !== target) &&
        (!spell.waterTotem || !e.waterTotem));
      state.effects.push({key: spell.key, target, next: state.time + spell.period, period: spell.period,
        expires: state.time + spell.duration, left: Math.floor(spell.duration / spell.period),
        amount: healingAmount(spell, random()), manaTick: spell.manaTick, waterTotem: spell.waterTotem,
        directChainBonus: spell.directChainBonus ?? 0});
    } else {
      const raw = healingAmount(spell, random());
      const targets = directTargets(spell, unit, state.time);
      targets.forEach((target, i) => heal(spell.key, target.unit, raw * target.factor, true, targets[i - 1]?.unit, i));
    }
  }

  function cast(key, index) {
    const spell = spells[key];
    const unit = party[index];
    if (!spell || !unit) return;
    if (spell.rez ? !['won', 'lost'].includes(state.phase) || unit.hp : state.phase !== 'active' || !unit.hp) {
      state.message = spell.rez ? 'Resurrection requires a fallen ally after combat.' : 'Choose a living ally during the pull.';
      return;
    }
    if (state.cast || (!spell.offGcd && state.time < state.gcd)) return;
    if (state.time < (state.cooldowns[key] ?? 0)) {
      state.message = 'That spell is on cooldown.';
      return;
    }
    if (state.mana < spell.cost) {
      state.message = 'Not enough mana.';
      return;
    }
    const instant = spell.cast > 0 && !spell.rez && state.swiftness > state.time;
    if (instant) state.swiftness = 0;
    if (!spell.offGcd) state.gcd = state.time + spell.gcd;
    const castTime = instant ? 0 : spell.cast;
    state.cast = {spell, unit, end: state.time + castTime};
    state.message = spell.name + ' → ' + unit.name;
    if (!castTime) finishCast();
  }

  function finishCast() {
    const {spell, unit} = state.cast;
    state.cast = null;
    if (!unit.hp && !spell.rez) return;
    state.mana -= spell.cost;
    if (spell.cost) state.lastSpend = state.time;
    state.manaSpent += spell.cost;
    state.cooldowns[spell.key] = state.time + spell.cooldown;
    meter(spell.key).casts++;
    meter(spell.key).mana += spell.cost;
    resolve(spell, unit);
  }

  function damage(unit, amount) {
    unit.hp = Math.max(0, unit.hp - amount);
  }

  function step(dt) {
    if (state.phase === 'ready') return;
    state.time += dt;
    if (state.cast && state.time >= state.cast.end) finishCast();
    if (state.time >= state.nextMana) {
      state.nextMana += 2;
      const spiritFraction = state.time - state.lastSpend >= 5 ? 1 : profile.castingRegen ?? 0;
      restoreMana((profile.mp5 ?? 0) * .4 + profile.regen * 2 * spiritFraction);
    }
    if (state.phase !== 'active') return;
    for (const effect of state.effects) {
      if (state.time < effect.next) continue;
      if (effect.manaTick) restoreMana(effect.manaTick);
      else for (const unit of effect.target ? [effect.target] : party) heal(effect.key, unit, effect.amount);
      effect.next += effect.period;
      effect.left--;
    }
    state.effects = state.effects.filter(effect => effect.left > 0);
    if (state.time >= state.nextSwing) {
      state.nextSwing += 2;
      const living = party.filter(unit => unit.hp);
      if (living.length) damage(living[0], encounter.swing);
      for (const unit of living.slice(1)) if (unit.poison > state.time) damage(unit, encounter.poisonTick);
      if (living[0]?.poison > state.time) damage(living[0], encounter.poisonTick);
    }
    if (state.time >= state.nextPoison) {
      state.nextPoison += 11;
      const living = party.filter(unit => unit.hp);
      if (living.length) living[Math.floor(random() * living.length)].poison = state.time + 10;
      state.message = 'Poisoned Blade · dispel the marked player';
    }
    if (state.time >= state.nextFlurry) {
      state.nextFlurry += 9;
      for (const unit of party) damage(unit, encounter.flurry);
      state.message = 'Blade Flurry hit the party!';
    }
    state.boss = Math.max(0, state.boss - party.reduce((sum, unit) => sum + (unit.hp ? unit.dps : 0), 0) * dt);
    if (!party.at(-1).hp || state.time >= encounter.limit || !state.boss) {
      state.phase = !state.boss && party.at(-1).hp ? 'won' : 'lost';
      state.cast = null;
      state.effects = [];
      state.swiftness = 0;
      for (const unit of party) unit.poison = 0;
      state.endedAt = state.time;
      state.survivors = party.filter(unit => unit.hp).length;
      state.manaAtEnd = state.mana;
    }
  }
  return {state, cast, step, incomingHealing, start() { if (state.phase === 'ready') state.phase = 'active'; }};
}
