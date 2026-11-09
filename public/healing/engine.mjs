export function createPull(profile, spells, encounter, random = Math.random) {
  const party = encounter.party.map(unit => ({...unit, hp: unit.max, poison: 0}));
  const state = {party, phase: 'ready', time: 0, mana: profile.mana, boss: encounter.health,
    cast: null, gcd: 0, lastSpend: -Infinity, cooldowns: {}, effects: [],
    healing: 0, overheal: 0, manaSpent: 0, message: '', nextSwing: 2,
    nextPoison: 7, nextFlurry: encounter.firstFlurry, nextMana: 2};

  function heal(unit, raw, crit = false) {
    if (!unit.hp) return;
    const amount = Math.round(raw * (crit && random() < profile.crit ? 1.5 : 1));
    const effective = Math.min(unit.max - unit.hp, amount);
    unit.hp += effective;
    state.healing += effective;
    state.overheal += amount - effective;
  }

  function resolve(spell, unit) {
    const amount = () => (spell.low ?? 0) + random() * ((spell.high ?? spell.low ?? 0) - (spell.low ?? 0)) +
      (spell.coefficient ?? 0) * profile.power;
    if (spell.rez) {
      unit.hp = Math.min(unit.max, spell.rez);
    } else if (spell.dispel) {
      unit.poison = 0;
    } else if (spell.period) {
      const target = spell.party ? null : unit;
      state.effects = state.effects.filter(e => e.key !== spell.key || e.target !== target);
      state.effects.push({key: spell.key, target, next: state.time + spell.period, period: spell.period,
        expires: state.time + spell.duration, left: Math.floor(spell.duration / spell.period),
        amount: amount(), directChainBonus: spell.directChainBonus ?? 0});
    } else {
      const raw = amount();
      const bonus = spell.chain > 1 ? state.effects.reduce((sum, effect) =>
        sum + (effect.target === unit ? effect.directChainBonus : 0), 0) : 0;
      heal(unit, raw * (1 + bonus), true);
      const others = party.filter(member => member !== unit && member.hp > 0)
        .sort((a, b) => (b.max - b.hp) - (a.max - a.hp));
      for (let i = 0; i < Math.min((spell.chain ?? 1) - 1, others.length); i++) {
        heal(others[i], raw * spell.falloff ** (i + 1), true);
      }
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
    if (state.cast || state.time < state.gcd) return;
    if (state.time < (state.cooldowns[key] ?? 0)) {
      state.message = 'That spell is on cooldown.';
      return;
    }
    if (state.mana < spell.cost) {
      state.message = 'Not enough mana.';
      return;
    }
    state.gcd = state.time + spell.gcd;
    state.cast = {spell, unit, end: state.time + spell.cast};
    state.message = spell.name + ' → ' + unit.name;
    if (!spell.cast) finishCast();
  }

  function finishCast() {
    const {spell, unit} = state.cast;
    state.cast = null;
    if (!unit.hp && !spell.rez) return;
    state.mana -= spell.cost;
    state.lastSpend = state.time;
    state.manaSpent += spell.cost;
    state.cooldowns[spell.key] = state.time + spell.cooldown;
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
      if (state.time - state.lastSpend >= 5) state.mana = Math.min(profile.mana, state.mana + profile.regen * 2);
    }
    if (state.phase !== 'active') return;
    for (const effect of state.effects) {
      if (state.time < effect.next) continue;
      for (const unit of effect.target ? [effect.target] : party) heal(unit, effect.amount);
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
      for (const unit of party) unit.poison = 0;
      state.endedAt = state.time;
      state.survivors = party.filter(unit => unit.hp).length;
      state.manaAtEnd = state.mana;
    }
  }
  return {state, cast, step, start() { if (state.phase === 'ready') state.phase = 'active'; }};
}
