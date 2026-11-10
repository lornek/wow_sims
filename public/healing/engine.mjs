export function createPull(profile, spells, encounter, random = Math.random, onHeal = () => {}) {
  const party = encounter.party.map(unit => ({...unit, hp: unit.max, poison: 0}));
  const state = {party, phase: 'ready', time: 0, mana: profile.mana, boss: encounter.health,
    cast: null, gcd: 0, lastSpend: -Infinity, cooldowns: {}, effects: [],
    healing: 0, overheal: 0, manaSpent: 0, message: '', nextSwing: 2, innervateUntil: 0, graceUntil: 0,
    manaPerSpirit: 0, manaPerMp5: 0,
    nextPoison: 7, nextFlurry: encounter.firstFlurry, nextMana: 2, swiftness: 0, meters: {}};

  function meter(key) {
    return state.meters[key] ??= {casts: 0, hits: 0, crits: 0, effective: 0, overheal: 0, mana: 0};
  }

  function restoreMana(amount) {
    state.mana = Math.min(profile.mana, state.mana + amount);
  }

  function heal(key, unit, raw, canCrit = false, from = null, bounce = 0, bonusCrit = 0, periodic = false) {
    if (!unit.hp) return;
    const crit = canCrit && random() < profile.crit + bonusCrit;
    if (crit && !periodic && profile.grace) state.graceUntil = state.time + 3;
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
      if (effect.manaTick || effect.abolishPoison) continue;
      for (const unit of effect.target ? [effect.target] : party) add(unit, tickAmount(effect));
    }
    if (state.cast?.spell.low && !state.cast.channel && state.cast.unit.hp) {
      const {spell, unit, end} = state.cast;
      if (spell.period) {
        for (const member of spell.party ? party : [unit]) add(member, healingAmount(spell, .5) * (spell.decay ? 1.3 : 1));
      } else {
        for (const target of directTargets(spell, unit, end)) add(target.unit, healingAmount(spell, .5) * target.factor);
      }
    }
    return party.map(unit => Math.min(unit.max - unit.hp, pending.get(unit)));
  }

  function tickAmount(effect) {
    const progress = effect.ticks > 1 ? (effect.ticks - effect.left) / (effect.ticks - 1) : 0;
    return effect.amount * (effect.decay ? 1.3 - .6 * progress : 1);
  }

  function swiftmendEffect(unit) {
    return state.effects.filter(effect => effect.target === unit && effect.swiftmendable)
      .sort((a, b) => a.expires - b.expires)[0];
  }

  function resolve(spell, unit) {
    if (spell.swiftness) {
      state.swiftness = Infinity;
    } else if (spell.innervate) {
      state.innervateUntil = state.time + spell.duration;
    } else if (spell.swiftmend) {
      const effect = swiftmendEffect(unit);
      if (effect) heal(spell.key, unit, effect.amount * effect.ticks, true);
    } else if (spell.manaRange) {
      restoreMana(spell.manaRange[0] + random() * (spell.manaRange[1] - spell.manaRange[0]));
    } else if (spell.rez) {
      unit.hp = Math.min(unit.max, spell.rez);
    } else if (spell.dispel) {
      unit.poison = 0;
      if (spell.abolishPoison) {
        const period = 2;
        state.effects = state.effects.filter(effect => effect.key !== 'abolish' || effect.target !== unit);
        state.effects.push({key: 'abolish', target: unit, abolishPoison: true, period,
          next: state.time + period, expires: state.time + spell.duration, left: Math.floor(spell.duration / period)});
      }
    } else if (spell.period || spell.hot) {
      if (spell.hot) heal(spell.key, unit, healingAmount(spell, random()), true, null, 0, spell.bonusCrit);
      const periodic = spell.hot ?? spell;
      const target = spell.party ? null : unit;
      state.effects = state.effects.filter(e => (e.key !== spell.key || e.target !== target) &&
        (!spell.waterTotem || !e.waterTotem));
      const ticks = Math.floor(spell.duration / periodic.period);
      state.effects.push({key: spell.key, target, next: state.time + periodic.period, period: periodic.period,
        expires: state.time + spell.duration, left: ticks, ticks, decay: spell.decay,
        periodicCrit: spell.periodicCrit, bonusCrit: spell.bonusCrit, swiftmendable: spell.swiftmendable,
        amount: healingAmount(periodic, random()), manaTick: spell.manaTick, waterTotem: spell.waterTotem,
        directChainBonus: spell.directChainBonus ?? 0});
    } else {
      const raw = healingAmount(spell, random());
      const targets = directTargets(spell, unit, state.time);
      targets.forEach((target, i) => heal(spell.key, target.unit, raw * target.factor, true, targets[i - 1]?.unit, i, spell.bonusCrit));
    }
  }

  function cast(key, index) {
    const spell = spells[key];
    const unit = party[index];
    if (!spell || !unit) return;
    const canResurrect = state.phase === 'active' ? spell.combatRez : ['won', 'lost'].includes(state.phase);
    if (spell.rez ? !canResurrect || unit.hp : state.phase !== 'active' || !unit.hp) {
      state.message = spell.rez ? (spell.combatRez ? 'Choose a fallen ally.' : 'Resurrection requires a fallen ally after combat.') :
        'Choose a living ally during the pull.';
      return;
    }
    if (state.cast || (!spell.offGcd && state.time < state.gcd)) return;
    if (spell.swiftmend && !swiftmendEffect(unit)) {
      state.message = 'Swiftmend requires your Rejuvenation or Regrowth on the target.';
      return;
    }
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
    const speed = state.graceUntil > state.time ? 1.1 : 1;
    if (!spell.offGcd) state.gcd = state.time + spell.gcd / speed;
    const castTime = instant ? 0 : spell.cast / speed;
    state.cast = {spell, unit, end: state.time + castTime, duration: castTime, pushbacks: 0};
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
    if (spell.channel) state.cast = {spell, unit, end: state.time + spell.duration, duration: spell.duration, channel: true};
  }

  function damage(unit, amount) {
    unit.hp = Math.max(0, unit.hp - amount);
    const cast = state.cast;
    if (amount > 0 && unit === party.at(-1) && cast && !cast.channel && cast.pushbacks < 2 &&
        profile.pushbackResist !== undefined && random() >= profile.pushbackResist) {
      cast.pushbacks++;
      cast.end += .5;
      cast.duration += .5;
    }
  }

  function step(dt) {
    if (state.phase === 'ready') return;
    state.time += dt;
    if (state.cast && state.time >= state.cast.end) {
      if (state.cast.channel) state.cast = null;
      else finishCast();
    }
    if (state.time >= state.nextMana) {
      state.nextMana += 2;
      const spiritFraction = state.innervateUntil > state.time ? 5 : state.time - state.lastSpend >= 5 ? 1 : profile.castingRegen ?? 0;
      const regen = (profile.mp5 ?? 0) * .4 + profile.regen * 2 * spiritFraction;
      if (state.phase === 'active') {
        const headroom = Math.max(0, profile.mana - state.mana - regen);
        state.manaPerSpirit += Math.min(headroom, (profile.spiritPerRawPoint ?? 1) * spiritFraction / 4);
        state.manaPerMp5 += Math.min(headroom, .4);
      }
      restoreMana(regen);
    }
    if (state.phase !== 'active') return;
    for (const effect of state.effects) {
      if (state.time < effect.next) continue;
      if (effect.abolishPoison) effect.target.poison = 0;
      else if (effect.manaTick) restoreMana(effect.manaTick);
      else for (const unit of effect.target ? [effect.target] : party) heal(effect.key, unit, tickAmount(effect),
        effect.periodicCrit, null, 0, effect.bonusCrit, true);
      effect.next += effect.period;
      effect.left--;
      if (!effect.left && effect.swiftmendable && profile.bloom) heal('bloom', effect.target, profile.bloom);
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
