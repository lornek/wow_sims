export function healingScore(state) {
  const efficiency = state.healing / (state.healing + state.overheal || 1);
  const potionMana = Object.entries(state.manaSources ?? {}).reduce((sum, [name, value]) =>
    sum + (/mana potion/i.test(name) ? value : 0), 0);
  const manaGained = Math.max(0, state.manaGained - potionMana);
  const survivors = state.survivors ?? state.party.filter(unit => unit.hp > 0).length;
  const survivalMultiplier = state.party.length ? survivors / state.party.length : 0;
  const base = (.1 * state.healing) * (.1 * manaGained);
  return {total: state.phase === 'won' ? Math.round(base * efficiency * survivalMultiplier) : null,
    base, manaGained, potionMana, efficiency, survivors, survivalMultiplier};
}
