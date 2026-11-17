// These are the simulator's invented five-player practice rules, not raid mechanics.
export function nextThreat(state, encounter) {
  const targets = state.party.map((unit, index) => unit.hp ? index : -1).filter(index => index >= 0);
  if (state.phase !== 'active') return {text: state.phase === 'ready' ? 'Practice rules · ' + encounter.description : 'Review your last decisions below, then try another pull.', urgent: false, targets: []};
  let at, name, advice, affected;
  if (encounter.id === 'patchwerk') {
    at = state.nextSpecial; name = 'Hateful Strike';
    affected = [state.party[1].hp ? 1 : targets[0]];
    advice = 'Prepare a heal or shield for ' + state.party[affected[0]]?.name;
  } else if (encounter.id === 'sapphiron') {
    at = state.nextSpecial; name = 'Frost Aura'; affected = targets;
    advice = 'Maintain party healing; watch your mana';
  } else {
    at = state.nextFlurry; name = 'Blade Flurry'; affected = targets;
    advice = 'Prepare party healing' + (state.enraged ? ' · Enraged: faster attacks' : '');
  }
  const remaining = Math.max(0, at - state.time);
  return {text: `${name} in ${remaining.toFixed(1)}s · ${advice}`, urgent: remaining <= 2, targets: affected};
}
