export const enchantEffectDefinitions = {
  7941:{kind:'power',chance:.07,icd:.1,duration:20,power:140,mana:[300,500],description:'Direct spell heals have a 7% chance to restore 300–500 mana and grant +140 healing for 20 sec (0.1 sec cooldown).'},
  7942:{kind:'power',chance:.07,icd:.1,duration:20,power:70,mana:[300,500],description:'Direct spell heals have a 7% chance to restore 300–500 mana and grant +70 healing for 20 sec (0.1 sec cooldown).'},
  8216:{kind:'spirit',chance:.35,icd:45,duration:10,description:'Direct spell heals have a 35% chance to double Spirit for 10 sec (45 sec cooldown).'},
  8217:{kind:'revelation',chance:.08,icd:0,duration:15,description:'Non-critical direct heals can grant a guaranteed critical heal charge for 15 sec. Uses the upstream 8% fallback; crit-dependent server rate is unresolved.'},
  8220:{kind:'absorb',chance:.25,icd:5,duration:Infinity,absorb:50,description:'Melee hits have a 25% chance to grant a 50 physical-damage shield (5 sec cooldown).'},
  8737:{kind:'movement',speed:.08,description:'+8% movement speed. These encounters do not model player movement.'},
  2621:{kind:'threat',multiplier:.98,description:'Reduces threat by 2%. These encounters use scripted targets rather than threat-based targeting.'}
};
export function equippedEnchantEffects(kit) { return Object.values(kit ?? {}).flatMap(item=>item.enchantEffects??[]); }

export const revelationSpells = {"priest": ["Flash Heal", "Greater Heal", "Heal", "Prayer of Healing", "Penance", "Holy Nova", "Desperate Prayer"], "druid": ["Healing Touch", "Regrowth", "Swiftmend"], "shaman": ["Healing Wave", "Lesser Healing Wave", "Chain Heal"], "paladin": ["Holy Light", "Flash of Light", "Holy Shock", "Light's Vigil"]};

export function enchantPassiveModifiers(kit) {
  const effects = equippedEnchantEffects(kit);
  return {movementSpeedMultiplier:1+Math.max(0,...effects.filter(e=>e.kind==='movement').map(e=>e.speed)),
    healingThreatMultiplier:effects.filter(e=>e.kind==='threat').reduce((value,e)=>value*e.multiplier,1)};
}
