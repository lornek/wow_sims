// Spec artwork uses the named ability icons already bundled with the game.
export const specIcons={Cairne:'inv_shield_05',Illidan:'ability_rogue_slicedice',Sylvanas:'inv_spear_07',Jaina:'spell_fire_flamebolt',frost:'spell_frost_frostbolt02',fury:'ability_warrior_innerrage',mutilate:'ability_rogue_deadlybrew',enhancement:'spell_nature_lightningshield',elemental:'spell_nature_lightning',balance:'spell_nature_starfall',shadow:'spell_shadow_shadowwordpain',affliction:'spell_shadow_abominationexplosion',destruction:'spell_fire_burnout',retribution:'spell_holy_auraoflight',protectionPaladin:'spell_holy_devotionaura',discipline:'spell_holy_penance',holy:'spell_holy_greaterheal',paladin:'spell_holy_searinglight',druid:'spell_nature_rejuvenation',shaman:'spell_nature_healingwavegreater',priest:'spell_holy_powerwordshield'};
export function specIcon(unit){return new URL('./icons/'+(specIcons[unit.spec]??specIcons[unit.combatantKey??unit.name]??specIcons[unit.className]??'spell_holy_heal')+'.jpg',import.meta.url).href;}
export function classShades(element,color='#99603c'){
 const n=parseInt(color.slice(1),16),rgb=[n>>16,(n>>8)&255,n&255].map(v=>v/255),hi=Math.max(...rgb),lo=Math.min(...rgb),d=hi-lo,l=(hi+lo)/2;
 let h=0;if(d){h=hi===rgb[0]?(rgb[1]-rgb[2])/d+(rgb[1]<rgb[2]?6:0):hi===rgb[1]?(rgb[2]-rgb[0])/d+2:(rgb[0]-rgb[1])/d+4;h*=60;}
 const s=d?d/(1-Math.abs(2*l-1)):0;
 element.style.setProperty('--class-light',`hsl(${h} ${s*100}% ${Math.min(85,l*100+12)}%)`);
 element.style.setProperty('--class-dark',`hsl(${h} ${s*100}% ${Math.max(8,l*100-20)}%)`);
}
export const compactTotal=n=>n>=1000?(n/1000).toFixed(1)+'K':Math.round(n).toLocaleString();
export function combatNumbers(element,total,rate,share){element.classList.add('combat-numbers');const text=compactTotal(total)+' ('+Math.round(rate).toLocaleString()+', '+share.toFixed(1)+'%)';if(element.textContent!==text)element.textContent=text;}
