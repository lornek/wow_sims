// Match the engine's pre-crit, pre-overheal calculation and rounding.
export function healingRange(spell, power, factor = 1) {
  const amount = base => Math.round((base + (spell.coefficient ?? 0) * power) * (spell.multiplier ?? 1) * factor);
  return [amount(spell.low ?? 0), amount(spell.high ?? spell.low ?? 0)];
}

export function swiftmendRange(source, power) {
  const hot = source.hot ?? source;
  return healingRange(hot, power, Math.floor(source.duration / hot.period));
}

export function periodicHealingPreview(spell, power) {
  const periodic = spell.hot ?? spell;
  const ticks = Math.floor(spell.duration / periodic.period) + Number(!spell.hot && !!spell.immediateTick);
  return {duration:spell.duration, ticks,
    total:healingRange(periodic, power, ticks),
    first:healingRange(periodic, power, spell.decay ? 1.3 : 1),
    last:healingRange(periodic, power, spell.decay ? .7 : 1)};
}

// Full-duration bonus-healing coefficient, before the separate talent multiplier.
export function periodicHealingScaling(spell) {
  const periodic = spell.hot ?? spell;
  return (periodic.coefficient ?? 0) * periodicHealingPreview(spell, 0).ticks;
}

// Full cast potential: all ticks/targets, no overhealing or temporary buffs.
// Illumination returns 50% of base spell cost on a successful proc per crit.
export function expectedHealingPerMana(spell, profile, partySize = 5) {
  const crit = Math.max(0, Math.min(1, (profile.crit ?? 0) + (spell.bonusCrit ?? 0) + (spell.boundless ?? 0)));
  const critFactor = chance => 1 + chance * (.5 + (profile.critHealingBonus ?? 0));
  const mean = s => (((s.low ?? 0) + (s.high ?? s.low ?? 0)) / 2 + (s.coefficient ?? 0) * (profile.power ?? 0)) * (s.multiplier ?? 1);
  let healing = 0, critEvents = 0;
  if (spell.period || spell.hot) {
    const hot = spell.hot ?? spell;
    const ticks = Math.floor(spell.duration / hot.period);
    const periodicCrit = spell.periodicCrit ? crit : 0;
    const targets = spell.party ? partySize : 1;
    // Linear decay from 130% to 70% averages 100% over multiple ticks.
    const decay = spell.decay && ticks === 1 ? 1.3 : 1;
    healing += mean(hot) * ticks * decay * critFactor(periodicCrit) * targets;
    critEvents += ticks * periodicCrit * targets;
    if (spell.immediateTick) {
      healing += mean(hot) * (spell.decay ? 1.3 : 1) * critFactor(crit);
      critEvents += crit;
    }
    if (spell.hot) { healing += mean(spell) * critFactor(crit); critEvents += crit; }
  } else {
    const targets = spell.mending ? 5 : spell.party ? partySize : 1;
    let factor = targets;
    if (spell.chain > 1) factor = Array.from({length:Math.min(spell.chain,partySize)},(_,i)=>(spell.falloff ?? 1)**i).reduce((a,b)=>a+b,0);
    factor += spell.selfCopy ?? 0;
    healing = mean(spell) * factor * critFactor(crit);
    critEvents = crit * targets;
  }
  const expectedCost = spell.cost - critEvents * (spell.illumination ?? 0) * .5 * (spell.baseCost ?? spell.cost);
  return {healing, expectedCost, perMana: expectedCost > 0 ? healing / expectedCost : null};
}
