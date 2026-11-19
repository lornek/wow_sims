// Estimated from the user's pooled Forever logs (2026-10-05), not a verified
// server proc formula. Spell casts use observed rates, not melee PPM.
export const omenModel = {chance:.05, regrowthChance:.08, internalCooldown:10, duration:15};
export function omenChance(spell, playerLevel = 60) {
  if (!spell.omenEligible) return 0;
  const downrank = Math.min(1, ((spell.level ?? playerLevel) + 11) / playerLevel);
  return (spell.key === 'regrowth' ? omenModel.regrowthChance : omenModel.chance) * downrank;
}
