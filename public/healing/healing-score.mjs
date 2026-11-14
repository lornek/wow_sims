export function healingScore(state) {
  const efficiency = state.healing / (state.healing + state.overheal || 1);
  const survival = Math.min(1, Math.max(0, state.survivalSeconds / ((state.endedAt || state.time || 1) * state.party.length)));
  const survivalMultiplier = .5 + .5 * survival;
  const killMultiplier = state.phase === 'won' ? 1.1 : 1;
  const base = state.healing + 2 * state.manaGained;
  return {total: Math.round(base * efficiency * survivalMultiplier * killMultiplier), base,
    efficiency, survivalMultiplier, killMultiplier};
}
