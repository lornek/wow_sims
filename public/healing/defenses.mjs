// Representative level-60 practice tanks, not exact player gear simulations.
// Warrior gear snapshot: 6,212 armor, 109 block value before Strength;
// avoidance includes talents and level-63 attack skill. See docs/raid-combat-audit.md.
export const tankDefenses=Object.freeze({warrior:{armor:6212,miss:.045,dodge:.12,parry:.10,block:.20,blockValue:125},paladin:{armor:5900,miss:.045,dodge:.09,parry:.10,block:.15,blockValue:120}});
export function defenseFor(unit,{offTank=false}={}){
 if(unit.role==='Tank'||offTank)return tankDefenses[unit.spec==='protectionPaladin'?'paladin':'warrior'];
 const className=unit.className??({Cairne:'warrior',Illidan:'rogue',Sylvanas:'hunter',Jaina:'mage'})[unit.combatantKey??unit.name];
 return {armor:({warrior:3800,paladin:3400,shaman:2300,hunter:2200,rogue:1500,druid:1400})[className]??800,miss:.045,dodge:['rogue','hunter','druid'].includes(className)?.08:.04,parry:['warrior','paladin','rogue'].includes(className)?.05:0,block:0,blockValue:0};
}
export const armorTaken=armor=>Math.max(.25,5755/(5755+armor));
// Preserve the old tank's mean melee intake, including its old 25% × 45 block.
export function bossMeleeRaw(baseline){if(!(baseline>0))return 0;const d=tankDefenses.warrior;return (Math.max(0,baseline-11.25)+d.block*d.blockValue)/((1-d.miss-d.dodge-d.parry)*armorTaken(d.armor));}
export function resolveMelee(unit,baseline,random,{offTank=false,armorBonus=0,holyShield=false}={}){
 const d=defenseFor(unit,{offTank}),roll=random();let threshold=d.miss;
 if(roll<threshold)return {amount:0,outcome:'miss'};
 if(roll<(threshold+=d.dodge))return {amount:0,outcome:'dodge'};
 if(roll<(threshold+=d.parry))return {amount:0,outcome:'parry'};
 const blocked=roll<threshold+Math.min(1-threshold,d.block+(holyShield?.3:0));
 const amount=Math.max(0,bossMeleeRaw(baseline)*armorTaken(d.armor*(1+armorBonus))-(blocked?d.blockValue:0));
 return {amount,outcome:blocked?'block':'hit'};
}
