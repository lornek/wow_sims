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

  function heal(key, unit, raw, canCrit = false, from = null, bounce = 0, bonusCrit = 0, periodic = false, spell = spells[key]) {
    if (!unit.hp) return;
    const weakened = spell?.renewedHope && unit.weakened > state.time;
    const crit = canCrit && random() < profile.crit + bonusCrit + (weakened ? .02 * spell.renewedHope : 0);
    if (weakened && !spell.channel) unit.weakened = Math.max(state.time, unit.weakened - spell.renewedHope);
    if (crit && !periodic && profile.grace) state.graceUntil = state.time + 3;
    const amount = Math.round(raw * (state.powerInfusion > state.time ? 1.2 : 1) * (crit ? 1.5 + (profile.critHealingBonus ?? 0) : 1));
    const effective = Math.min(unit.max - unit.hp, amount);
    unit.hp += effective;
    state.healing += effective;
    state.overheal += amount - effective;
    const stats = meter(key);
    stats.hits++;
    stats.crits += Number(crit);
    stats.effective += effective;
    stats.overheal += amount - effective;
    if (crit && spell?.illumination && random() < spell.illumination) restoreMana(.5 * spell.baseCost);
    if (crit && spell?.infusion) state.infusion = state.time + 15;
    if (crit && !periodic && profile.aegis) {
      const existing = unit.aegis?.expires > state.time ? unit.aegis.amount : 0;
      unit.aegis = {amount: Math.min(1200, existing + amount * profile.aegis), expires: state.time + 12};
    }
    if (crit && !periodic && profile.inspiration) unit.inspiration = {expires:state.time + 15};
    onHeal({key, target: party.indexOf(unit), from: from ? party.indexOf(from) : null, bounce, amount, effective, crit});
    if (!periodic && key !== 'mending') triggerMending(unit);
  }

  function triggerMending(unit) {
    const effect = state.mending;
    if (effect?.target !== unit || effect.expires <= state.time) return;
    const next = party.filter(member => member !== unit && member.hp)
      .sort((a, b) => (b.max - b.hp) - (a.max - a.hp))[0];
    state.mending = --effect.left && next ? {...effect, target: next, expires: state.time + 30} : null;
    heal('mending', unit, effect.amount, true, effect.from, 0);
    if (state.mending) state.mending.from = unit;
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
    if (spell.shield) {
      unit.shield = {amount: Math.round((spell.shield + spell.coefficient * profile.power) * spell.multiplier), expires: state.time + spell.duration};
      unit.weakened = state.time + 15;
    } else if (spell.mark) {
      state[spell.mark] = {target: unit, expires: state.time + spell.duration, spell};
    } else if (spell.mending) {
      state.mending = {target: unit, expires: state.time + 30, amount: healingAmount(spell, .5), left: 5};
    } else if (spell.activateBuff) {
      state[spell.activateBuff] = spell.duration > 0 ? state.time + spell.duration : Infinity;
    } else if (spell.layOnHands) {
      state.mana = 0;
      heal(spell.key, unit, party.at(-1).max);
      if (unit === party.at(-1)) restoreMana(spell.layOnHands);
    } else if (spell.swiftness) {
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
      const effect = {key: spell.key, target, next: state.time + periodic.period, period: periodic.period,
        expires: state.time + spell.duration, left: ticks, ticks, decay: spell.decay,
        periodicCrit: spell.periodicCrit, bonusCrit: spell.bonusCrit, swiftmendable: spell.swiftmendable,
        amount: healingAmount(periodic, random()), manaTick: spell.manaTick, waterTotem: spell.waterTotem,
        directChainBonus: spell.directChainBonus ?? 0};
      state.effects.push(effect);
      if (spell.immediateTick) {
        heal(spell.key, unit, effect.amount, true, null, 0, spell.bonusCrit, false, spell);
        if (spell.renewedHope && unit.weakened > state.time) unit.weakened = Math.max(state.time, unit.weakened - spell.renewedHope);
      }
    } else {
      const oath = state.oath?.target === unit && state.oath.expires > state.time;
      const favor = spell.favor && state.divineFavor > state.time;
      if (favor) state.divineFavor = 0;
      const bonusCrit = (spell.bonusCrit ?? 0) + (favor ? 1 : 0) + (oath ? 0 : spell.boundless ?? 0);
      const vigil = spell.key === 'shock' && state.vigil?.target === unit && state.vigil.expires > state.time ? state.vigil.spell : null;
      if (vigil) {
        state.vigil = null;
        for (const member of party) heal('vigil', member, healingAmount(vigil, random()), true, null, 0, 0, false, vigil);
      }
      const raw = healingAmount(spell, random()) + (oath ? (spell.oathBonus ?? 0) * spell.multiplier : 0);
      if (spell.party) {
        for (const member of party) heal(spell.key, member, raw, true, null, 0, bonusCrit);
        return;
      }
      const targets = directTargets(spell, unit, state.time);
      targets.forEach((target, i) => heal(spell.key, target.unit, raw * target.factor, true, targets[i - 1]?.unit, i, bonusCrit));
      if (spell.selfCopy && unit !== party.at(-1)) heal(spell.key, party.at(-1), raw * spell.selfCopy, true, null, 0, bonusCrit);
    }
  }

  function cast(key, index) {
    const spell = spells[key];
    const unit = spell?.self ? party.at(-1) : party[index];
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
    if (spell.shield && unit.weakened > state.time) {
      state.message = 'That ally has Weakened Soul.';
      return;
    }
    const usesVigil = key === 'shock' && state.vigil?.target === unit && state.vigil.expires > state.time;
    if (!usesVigil && state.time < (state.cooldowns[key] ?? 0)) {
      state.message = 'That spell is on cooldown.';
      return;
    }
    const focus = key !== 'focus' && state.innerFocus > state.time;
    if (!focus && state.mana < spell.cost) {
      state.message = 'Not enough mana.';
      return;
    }
    const instant = spell.cast > 0 && !spell.rez && state.swiftness > state.time;
    if (instant) state.swiftness = 0;
    const speed = state.graceUntil > state.time ? 1.1 : 1;
    if (!spell.offGcd) state.gcd = state.time + spell.gcd / speed;
    const infused = key === 'holyLight' && state.infusion > state.time;
    if (infused) state.infusion = 0;
    if (focus) state.innerFocus = 0;
    const castTime = instant ? 0 : (spell.cast - (infused ? spell.infusionReduction : 0)) / speed;
    const prepared = focus ? {...spell, cost: 0, bonusCrit: (spell.bonusCrit ?? 0) + (spell.period ? 0 : .25)} : spell;
    state.cast = {spell: prepared, unit, end: state.time + castTime, duration: castTime, pushbacks: 0, usesVigil};
    state.message = spell.name + ' → ' + unit.name;
    if (!castTime) finishCast();
  }

  function finishCast() {
    const {spell, unit, usesVigil} = state.cast;
    state.cast = null;
    if (!unit.hp && !spell.rez) return;
    state.mana -= spell.cost;
    if (spell.cost) state.lastSpend = state.time;
    state.manaSpent += spell.cost;
    state.cooldowns[spell.key] = usesVigil ? state.time : state.time + spell.cooldown;
    meter(spell.key).casts++;
    meter(spell.key).mana += spell.cost;
    if (spell.litany) {
      if (state.lastHeal && state.lastHeal !== spell.key && spell.cost) restoreMana(spell.baseCost * spell.litany);
      state.lastHeal = spell.key;
    }
    resolve(spell, unit);
    if (spell.channel) state.cast = {spell, unit, end: state.time + spell.duration, duration: spell.duration, channel: true};
  }

  function damage(unit, amount, physical = true) {
    if (physical && unit.inspiration?.expires > state.time) {
      const armor = unit.role === 'Tank' ? 4500 : 1500;
      amount *= (5500 + armor) / (5500 + armor * (1 + profile.inspiration));
    }
    for (const key of ['shield', 'aegis']) {
      const absorb = unit[key];
      if (!(absorb?.amount > 0 && absorb.expires > state.time)) continue;
      const consumed = Math.min(amount, absorb.amount);
      absorb.amount -= consumed;
      amount -= consumed;
      const stats = meter(key);
      stats.effective += consumed;
      if (consumed) stats.hits++;
      state.healing += consumed;
    }
    unit.hp = Math.max(0, unit.hp - amount);
    if (amount > 0) triggerMending(unit);
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
        state.manaPerSpirit += Math.min(headroom, (profile.spiritPerRawPoint ?? 1) * spiritFraction * 2 * (profile.spiritRegenCoefficient ?? .125));
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
        effect.periodicCrit, null, 0, effect.bonusCrit, !spells[effect.key]?.immediateTick);
      effect.next += effect.period;
      effect.left--;
      if (!effect.left && effect.swiftmendable && profile.bloom) heal('bloom', effect.target, profile.bloom);
    }
    state.effects = state.effects.filter(effect => effect.left > 0);
    if (state.time >= state.nextSwing) {
      state.nextSwing += 2;
      const living = party.filter(unit => unit.hp);
      if (living.length) damage(living[0], encounter.swing);
      for (const unit of living) if (unit.poison > state.time) damage(unit, encounter.poisonTick, false);
    }
    if (state.time >= state.nextPoison) {
      state.nextPoison += 11;
      const living = party.filter(unit => unit.hp);
      if (living.length) living[Math.floor(random() * living.length)].poison = state.time + 10;
      state.message = (encounter.hazard === 'disease' ? 'Infected Blade' : 'Poisoned Blade') + ' · dispel the marked player';
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
