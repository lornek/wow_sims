// Match the engine's pre-crit, pre-overheal calculation and rounding.
export function healingRange(spell, power, factor = 1) {
  const amount = base => Math.round((base + (spell.coefficient ?? 0) * power) * (spell.multiplier ?? 1) * factor);
  return [amount(spell.low ?? 0), amount(spell.high ?? spell.low ?? 0)];
}

export function swiftmendRange(source, power) {
  const hot = source.hot ?? source;
  return healingRange(hot, power, Math.floor(source.duration / hot.period));
}
