// Innervate is incremental mana, not the full regeneration while the buff is up.
export function manaReportSources(manaSources) {
  const normal = manaSources['Spirit regeneration'] ?? 0;
  const innervate = manaSources.Innervate ?? 0;
  return Object.entries({...manaSources, 'Spirit regeneration': normal + innervate})
    .filter(([name, value]) => name !== 'Innervate' && value > 0)
    .sort((a, b) => b[1] - a[1]);
}

export function spiritContribution(normal, innervate, weight, weightSum, total) {
  const fraction = weightSum > 0 ? weight / weightSum : 0;
  const normalMana = normal * fraction;
  const innervateMana = innervate * fraction;
  return {normalMana, innervateMana,
    normalShare: total > 0 ? 100 * normalMana / total : 0,
    totalShare: total > 0 ? 100 * (normalMana + innervateMana) / total : 0};
}
