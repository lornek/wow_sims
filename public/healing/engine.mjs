import {resolveMelee} from './defenses.mjs';
import {revelationSpells} from './enchant-effects.mjs';
import {omenModel, omenChance} from './omen-of-clarity.mjs';
import {recordHealingEvent} from './healing-events.mjs';
import {setupPartyCombat, advancePartyCombat, gainDamageRage} from './party-combat.mjs';

export function createPull(profile, spells, encounter, random = Math.random, onHeal = () => {}, onDamage = () => {}, onSpell = () => {}) {
  const party = encounter.sharedParty ?? encounter.party.map(unit => ({...unit, hp: unit.max, poison: 0}));
  if(encounter.windfuryTotem)for(const unit of party)unit.windfuryTotem=true;
  const caster = party[encounter.healerIndex ?? party.length - 1];
  let damageBatch=false;
  const groupMembers = (target=caster) => encounter.raid ? party.filter(unit=>unit.group===target.group) : party;
  if (encounter.id && !encounter.supportMode) setupPartyCombat(party);
  const state = {party, phase: 'ready', time: 0, mana: profile.mana, boss: encounter.health,bossMax:encounter.health,
    enchantAuras:{}, enchantNext:{}, enchantProcs:{},
    cast: null, gcd: 0, lastSpend: -Infinity, cooldowns: {}, effects: [],
    healing: 0, overheal: 0, manaSpent: 0, message: '', nextSwing: 2, innervateUntil: 0, graceUntil: 0,
    manaPerSpirit: 0, manaPerMp5: 0, manaGained: 0, manaSources: {}, waterShieldUptime: 0, survivalSeconds: 0, focusSpend: -Infinity, clearcastingSpend: -Infinity, clearcastingUntil: 0, omenNext: 0, omenProcs: 0, clearcastingUses: 0,
    encounterId: encounter.id, nextPoison: encounter.id && encounter.id !== 'rend' ? Infinity : 7,
    nextFlurry: encounter.firstFlurry ?? Infinity, nextSpecial: encounter.id === 'patchwerk' ? 3 : 2, swiftness: 0, meters: {}};

  function meter(key) {
    return state.meters[key] ??= {casts: 0, hits: 0, crits: 0, effective: 0, overheal: 0, mana: 0};
  }

  function creditMana(source, amount) {
    state.manaSources[source] = (state.manaSources[source] ?? 0) + amount;
    state.manaGained += amount;
  }

  function restoreMana(amount, source) {
    const gained = Math.max(0, Math.min(profile.mana - state.mana, amount));
    state.mana += gained;
    if (source && state.phase === 'active') creditMana(source, gained);
  }

  function applyWaterShield() {
    state.waterShield = {charges: 3, expires: state.time + spells.waterShield.duration};
  }
  if (encounter.startWaterShield && spells.waterShield) applyWaterShield();

  function triggerWaterShield() {
    const shield = state.waterShield;
    if (!shield?.charges || shield.expires <= state.time || state.time < (state.waterShieldNext ?? 0)) return;
    shield.charges--;
    state.waterShieldNext = state.time + 3.5;
    restoreMana(profile.mana * .02, 'Water Shield');
  }

  const enchants = [...new Map((profile.enchantEffects ?? []).map(effect=>[effect.id,effect])).values()];
  function extraSpirit(time = state.time) {
    return Object.values(state.enchantAuras).some(aura=>aura.kind==='spirit' && aura.expires>time) ? (profile.spirit ?? 0) : 0;
  }
  function healingPower() {
    return profile.power + Object.values(state.enchantAuras).reduce((sum,aura)=>sum+(aura.expires>state.time?(aura.power??0):0),0) + extraSpirit()*(profile.spiritHealingRatio??0);
  }
  function triggerEnchants(spell, crit) {
    for (const effect of enchants) {
      if (!['power','spirit','revelation'].includes(effect.kind) || state.time < (state.enchantNext[effect.id] ?? 0)) continue;
      if (effect.kind === 'revelation' && crit) continue;
      const levelShare = effect.kind==='revelation' ? Math.max(0,Math.min(1,((spell.level??60)+32-(profile.level??60))/20)) : 1;
      if (random() >= effect.chance * levelShare) continue;
      state.enchantNext[effect.id] = state.time + effect.icd;
      state.enchantAuras[effect.id] = {...effect,expires:state.time+effect.duration};
      state.enchantProcs[effect.id] = (state.enchantProcs[effect.id]??0)+1;
      if (effect.mana) restoreMana(Math.round(effect.mana[0]+random()*(effect.mana[1]-effect.mana[0])),effect.name);
      state.message = effect.name + ' activated';
    }
  }

  function heal(key, unit, raw, canCrit = false, from = null, bounce = 0, bonusCrit = 0, periodic = false, spell = spells[key], componentKey = null, isTick = periodic) {
    if (!unit.hp) return;
    const weakened = spell?.renewedHope && unit.weakened > state.time;
    const crit = canCrit && random() < profile.crit + bonusCrit + (weakened ? .02 * spell.renewedHope : 0);
    if (crit && key !== 'stream' && !(key === 'riptide' && periodic)) triggerWaterShield();
    if (weakened && !spell.channel) unit.weakened = Math.max(state.time, unit.weakened - spell.renewedHope);
    if (crit && !periodic && profile.grace) state.graceUntil = state.time + 3;
    const amount = Math.round(raw * (caster.powerInfusion?.expires > state.time ? 1.2 : 1) * (crit ? 1.5 + (profile.critHealingBonus ?? 0) : 1));
    const effective = Math.min(unit.max - unit.hp, amount);
    unit.hp += effective;
    state.healing += effective;
    state.overheal += amount - effective;
    const stats = meter(key);
    stats.hits++;
    stats.crits += Number(crit);
    stats.effective += effective;
    stats.overheal += amount - effective;
    recordHealingEvent(stats, periodic || !!spell?.period, crit, effective, amount - effective);
    if (key === 'regrowth' || key === 'chain' || (key === 'flash' && spell?.selfCopy)) {
      const components = stats.components ??= {};
      const part = key === 'regrowth' ? (periodic ? 'hot' : 'direct') :
        key === 'flash' ? (componentKey ?? 'direct') : String(bounce);
      const component = components[part] ??= {hits:0, crits:0, effective:0, overheal:0};
      component.hits++;
      component.crits += Number(crit);
      component.effective += effective;
      component.overheal += amount - effective;
      recordHealingEvent(component, periodic, crit, effective, amount - effective);
    }
    if (crit && spell?.illumination && random() < spell.illumination) restoreMana(.5 * spell.baseCost, 'Illumination');
    if (crit && spell?.infusion) state.infusion = state.time + 15;
    if (crit && !periodic && profile.aegis) {
      const previous=unit.aegis;
      const existing = previous?.expires > state.time ? previous.amount : 0;
      const added=Math.min(1200-existing,amount*profile.aegis);
      unit.aegis = {credit:n=>creditAbsorb('aegis',n),amount:existing+added, expires:state.time+12};
      if(encounter.raid)unit.aegis.credits=[...(existing?(previous.credits??[{amount:existing,credit:previous.credit}]):[]),{amount:added,credit:n=>creditAbsorb('aegis',n)}];
    }
    if (crit && !periodic && profile.inspiration) unit.inspiration = {expires:state.time + 15};
    onHeal({key, target: party.indexOf(unit), from: from ? party.indexOf(from) : null, bounce, amount, effective, crit, periodic:isTick});
    if (!periodic && key !== 'mending') triggerMending(unit);
    if (!periodic && spell && componentKey !== 'binding' && !['mending','vigil','bloom'].includes(key)) triggerEnchants(spell,crit);
  }

  function triggerMending(unit) {
    const effect = state.mending;
    if (effect?.target !== unit || effect.expires <= state.time) return;
    const next = party.filter(member => member !== unit && member.hp)
      .sort((a, b) => (b.max - b.hp) - (a.max - a.hp))[0];
    state.mending = --effect.left && next ? {...effect, target: next, expires: state.time + 30} : null;
    heal('mending', unit, effect.amount, true, effect.from, 0);
    if (state.mending) state.mending.from = unit;
  }

  function healingAmount(spell, roll) {
    return ((spell.low ?? 0) + roll * ((spell.high ?? spell.low ?? 0) - (spell.low ?? 0)) +
      (spell.coefficient ?? 0) * healingPower()) * (spell.multiplier ?? 1);
  }

  function directTargets(spell, unit, time) {
    const bonus = spell.chain > 1 ? state.effects.reduce((sum, effect) =>
      sum + (effect.target === unit && effect.expires >= time ? effect.directChainBonus : 0), 0) : 0;
    const others = spell.chain > 1 ? party.filter(member => member !== unit && member.hp > 0 && (!encounter.raid||member.group===unit.group))
      .sort((a, b) => (b.max - b.hp) - (a.max - a.hp)).slice(0, spell.chain - 1) : [];
    return [{unit, factor: 1 + bonus}, ...others.map((target, index) =>
      ({unit: target, factor: (1 + bonus) * spell.falloff ** (index + 1)}))];
  }

  function incomingHealing() {
    const pending = new Map(party.map(unit => [unit, 0]));
    const add = (unit, amount) => {
      if (unit.hp) pending.set(unit, pending.get(unit) + Math.round(amount));
    };
    for (const effect of state.effects) {
      if (effect.manaTick || effect.abolishPoison) continue;
      for (const unit of effect.target ? [effect.target] : effect.members ?? party) add(unit, tickAmount(effect));
    }
    if (state.cast?.spell.low && !state.cast.channel && state.cast.unit.hp) {
      const {spell, unit, end} = state.cast;
      if (spell.party) {
        const members=encounter.raid?groupMembers(unit):party;
        for(const member of members)add(member,healingAmount(spell,.5)*(spell.decay?1.3:1));
      } else if (spell.period) {
        add(unit, healingAmount(spell, .5) * (spell.decay ? 1.3 : 1));
      } else {
        for (const target of directTargets(spell, unit, end)) add(target.unit, healingAmount(spell, .5) * target.factor);
      }
    }
    return party.map(unit => Math.min(unit.max - unit.hp, pending.get(unit)));
  }

  function tickAmount(effect) {
    const progress = effect.ticks > 1 ? (effect.ticks - effect.left) / (effect.ticks - 1) : 0;
    return effect.amount * (effect.decay ? 1.3 - .6 * progress : 1);
  }

  function swiftmendEffect(unit) {
    return state.effects.filter(effect => effect.target === unit && effect.swiftmendable)
      .sort((a, b) => a.expires - b.expires)[0];
  }

  function creditAbsorb(key,consumed){const stats=meter(key);stats.effective+=consumed;if(consumed){stats.hits++;recordHealingEvent(stats,false,false,consumed,0);}state.healing+=consumed;}

  function resolve(spell, unit) {
    if (spell.waterShield) {
      applyWaterShield();
    } else if (spell.shield) {
      unit.shield = {credit:n=>creditAbsorb('shield',n),amount: Math.round((spell.shield + spell.coefficient * healingPower()) * spell.multiplier), expires: state.time + spell.duration};
      unit.weakened = state.time + 15;
    } else if (spell.mark) {
      state[spell.mark] = {target: unit, expires: state.time + spell.duration, spell};
    } else if (spell.mending) {
      state.mending = {target: unit, expires: state.time + 30, amount: healingAmount(spell, .5), left: 5};
    } else if (spell.powerInfusion) {
      for (const ally of party) delete ally.powerInfusion;
      unit.powerInfusion = {expires:state.time + spell.duration};
    } else if (spell.activateBuff) {
      state[spell.activateBuff] = spell.duration > 0 ? state.time + spell.duration : Infinity;
    } else if (spell.layOnHands) {
      state.mana = 0;
      heal(spell.key, unit, caster.max);
      if (unit === caster) restoreMana(spell.layOnHands, 'Lay on Hands');
    } else if (spell.swiftness) {
      state.swiftness = Infinity;
    } else if (spell.innervate) {
      state.innervateUntil = state.time + spell.duration;
    } else if (spell.swiftmend) {
      const effect = swiftmendEffect(unit);
      if (effect) heal(spell.key, unit, effect.amount * effect.ticks, true, null, 0, spell.revelationCrit?1:0);
    } else if (spell.manaRange) {
      restoreMana(spell.manaRange[0] + random() * (spell.manaRange[1] - spell.manaRange[0]), spell.name);
      if (spell.healthCost) {
        const cost = Math.round(spell.healthCost[0] + random() * (spell.healthCost[1] - spell.healthCost[0]));
        damage(caster, cost, false);
        state.message = spell.name + ' · ' + cost + ' self-damage';
      }
    } else if (spell.dispel) {
      unit.poison = 0;
      if (spell.abolishPoison) {
        const period = 2;
        state.effects = state.effects.filter(effect => effect.key !== 'abolish' || effect.target !== unit);
        state.effects.push({key: 'abolish', target: unit, abolishPoison: true, period,
          next: state.time + period, expires: state.time + spell.duration, left: Math.floor(spell.duration / period)});
      }
    } else if (spell.period || spell.hot) {
      if (spell.hot) heal(spell.key, unit, healingAmount(spell, random()), true, null, 0, (spell.bonusCrit??0)+(spell.revelationCrit?1:0));
      const periodic = spell.hot ?? spell;
      const target = spell.party ? null : unit;
      const members = spell.party && encounter.raid ? groupMembers(unit) : null;
      state.effects = state.effects.filter(e => (e.key !== spell.key || e.target !== target) &&
        (!spell.waterTotem || !e.waterTotem));
      const ticks = Math.floor(spell.duration / periodic.period);
      const effect = {key: spell.key, target, members, next: state.time + periodic.period, period: periodic.period,
        expires: state.time + spell.duration, left: ticks, ticks, decay: spell.decay,
        periodicCrit: spell.periodicCrit, bonusCrit: (spell.bonusCrit??0)+(spell.channel&&spell.revelationCrit?1:0), swiftmendable: spell.swiftmendable,
        amount: healingAmount(periodic, random()), manaTick: spell.manaTick, waterTotem: spell.waterTotem,
        directChainBonus: spell.directChainBonus ?? 0};
      state.effects.push(effect);
      if (spell.immediateTick) {
        heal(spell.key, unit, effect.amount, true, null, 0, effect.bonusCrit, false, spell, null, true);
        if (spell.renewedHope && unit.weakened > state.time) unit.weakened = Math.max(state.time, unit.weakened - spell.renewedHope);
      }
    } else {
      const oath = state.oath?.target === unit && state.oath.expires > state.time;
      const favor = spell.favor && state.divineFavor > state.time;
      if (favor) state.divineFavor = 0;
      const bonusCrit = (spell.bonusCrit ?? 0) + (spell.revelationCrit ? 1 : 0) + (favor ? 1 : 0) + (oath ? 0 : spell.boundless ?? 0);
      const vigil = spell.key === 'shock' && state.vigil?.target === unit && state.vigil.expires > state.time ? state.vigil.spell : null;
      if (vigil) {
        state.vigil = null;
        for (const member of (encounter.raid ? groupMembers(unit) : party)) heal('vigil', member, healingAmount(vigil, random()), true, null, 0, 0, false, vigil);
      }
      const raw = healingAmount(spell, random()) + (oath ? (spell.oathBonus ?? 0) * spell.multiplier : 0);
      if (spell.party) {
        for (const member of groupMembers(unit)) heal(spell.key, member, raw, true, null, 0, bonusCrit);
        return;
      }
      const targets = directTargets(spell, unit, state.time);
      targets.forEach((target, i) => heal(spell.key, target.unit, raw * target.factor, true, targets[i - 1]?.unit, i, bonusCrit));
      if (spell.selfCopy && unit !== caster) heal(spell.key, caster, raw * spell.selfCopy, true, null, 0, spell.bonusCrit ?? 0, false, spell, 'binding');
    }
  }

  function cast(key, index) {
    const spell = spells[key];
    const unit = spell?.self ? caster : party[index];
    if (!spell || !unit) return;
    if (state.phase !== 'active' || !unit.hp) {
      state.message = 'Choose a living ally during the pull.';
      return;
    }
    if (state.cast || (!spell.offGcd && state.time < state.gcd)) return;
    if (spell.swiftmend && !swiftmendEffect(unit)) {
      state.message = 'Swiftmend requires your Rejuvenation or Regrowth on the target.';
      return;
    }
    if (spell.shield && unit.weakened > state.time) {
      state.message = 'That ally has Weakened Soul.';
      return;
    }
    const usesVigil = key === 'shock' && state.vigil?.target === unit && state.vigil.expires > state.time;
    if (!usesVigil && state.time < (state.cooldowns[key] ?? 0)) {
      state.message = 'That spell is on cooldown.';
      return;
    }
    const focus = key !== 'focus' && state.innerFocus > state.time;
    const clearcasting = profile.omen && spell.omenEligible && spell.cost > 0 && state.clearcastingUntil > state.time;
    if (!focus && !clearcasting && state.mana < spell.cost) {
      state.message = 'Not enough mana.';
      return;
    }
    const instant = spell.cast > 0 && state.swiftness > state.time;
    if (instant) state.swiftness = 0;
    const speed = (1 + Math.max(0, profile.haste ?? 0)) * (state.graceUntil > state.time ? 1.1 : 1);
    if (!spell.offGcd) {
      state.gcdDuration = spell.gcd === 0 ? 0 : Math.max(1.5, spell.gcd ?? 1.5);
      state.gcd = state.time + state.gcdDuration;
    }
    const infused = key === 'holyLight' && state.infusion > state.time;
    if (infused) state.infusion = 0;
    if (focus) state.innerFocus = 0;
    else if (clearcasting) state.clearcastingUntil = 0;
    const castTime = instant ? 0 : (spell.cast - (infused ? spell.infusionReduction : 0)) / speed;
    const prepared = clearcasting && !focus ? {...spell, clearcastingCost:spell.cost, cost:0} : focus ? {...spell, focusCost: spell.cost, cost: 0, bonusCrit: (spell.bonusCrit ?? 0) + (spell.period ? 0 : .25)} : spell;
    state.cast = {spell: prepared, unit, end: state.time + castTime, duration: castTime, pushbacks: 0, usesVigil};
    state.message = spell.name + ' → ' + unit.name;
    if (!castTime) finishCast();
  }

  function finishCast() {
    let {spell, unit, usesVigil} = state.cast;
    state.cast = null;
    if (!unit.hp) return;
    if (spell.focusCost > 0) {
      creditMana('Inner Focus · spell cost', spell.focusCost);
      state.focusSpend = state.time;
    }
    if (spell.clearcastingCost > 0) {
      creditMana('Omen of Clarity · spell cost', spell.clearcastingCost);
      state.clearcastingSpend = state.time;
      state.clearcastingUses++;
    }
    state.mana -= spell.cost;
    if (spell.cost) state.lastSpend = state.time;
    state.manaSpent += spell.cost;
    state.cooldowns[spell.key] = usesVigil ? state.time : state.time + spell.cooldown;
    meter(spell.key).casts++;
    meter(spell.key).mana += spell.cost;
    if (spell.litany) {
      if (state.lastHeal && state.lastHeal !== spell.key && spell.cost) restoreMana(spell.baseCost * spell.litany, 'Litany');
      state.lastHeal = spell.key;
    }
    const revelation = enchants.find(effect=>effect.kind==='revelation' && state.enchantAuras[effect.id]?.expires>state.time);
    if (revelation && (revelationSpells[profile.className]??[]).includes(spell.name)) {
      spell = {...spell,revelationCrit:true};state.enchantAuras[revelation.id].expires=0;
    }
    resolve(spell, unit);
    onSpell({key:spell.key, name:spell.name});
    if (profile.omen && spell.omenEligible && state.time >= state.omenNext && random() < omenChance(spell, profile.level ?? 60)) {
      state.clearcastingUntil = state.time + omenModel.duration;
      state.omenNext = state.time + omenModel.internalCooldown;
      state.omenProcs++;
      state.message = 'Clearcasting! Your next spell costs no mana.';
    }
    if (spell.channel) state.cast = {spell, unit, end: state.time + spell.duration, duration: spell.duration, channel: true};
    if (!caster.hp) checkFightEnd();
  }

  function damage(unit, amount, physical = true, procMending = true, canPushback = true, melee = false) {
    const incomingAmount = amount;
    if(melee&&encounter.mitigation){
      const holyShield=unit.spec==='protectionPaladin'&&unit.rotation?.holyShieldUntil>state.time&&unit.rotation.holyShieldCharges>0;
      const result=resolveMelee(unit,amount,random,{offTank:!encounter.raid&&encounter.id==='patchwerk'&&unit===party[1],armorBonus:unit.inspiration?.expires>state.time?profile.inspiration??0:0,holyShield});
      amount=result.amount;unit.defenseEvents??={};unit.defenseEvents[result.outcome]=(unit.defenseEvents[result.outcome]??0)+1;
      if(['dodge','parry','block'].includes(result.outcome)&&unit.rotation)unit.rotation.revengeUntil=state.time+5;
      if(amount===0)return 0;
      if(holyShield&&result.outcome==='block'){
        unit.rotation.holyShieldCharges--;const reflected=Math.min(state.boss,Math.round(221+.08*(unit.combatStats?.power??0))),m=unit.damage['Holy Shield']??={attempts:0,hits:0,crits:0,total:0};m.attempts++;m.hits++;m.total+=reflected;state.boss-=reflected;
        if(reflected)onDamage({source:unit.name,sourceIndex:party.indexOf(unit),color:unit.color,spell:'Holy Shield',amount:reflected,crit:false,time:state.time});
      }
    }
    if(!(melee&&encounter.mitigation)&&physical&&unit.spec==='protectionPaladin'&&unit.rotation?.holyShieldUntil>state.time&&unit.rotation.holyShieldCharges>0&&random()<.3){
      amount=Math.max(0,amount-120);unit.rotation.holyShieldCharges--;
      const reflected=Math.min(state.boss,Math.round(221+.08*(unit.combatStats?.power??0))),m=unit.damage['Holy Shield']??={attempts:0,hits:0,crits:0,total:0};m.attempts++;m.hits++;m.total+=reflected;state.boss-=reflected;
      if(reflected)onDamage({source:unit.name,sourceIndex:party.indexOf(unit),color:unit.color,spell:'Holy Shield',amount:reflected,crit:false,time:state.time});
    }
    if (!(melee&&encounter.mitigation) && physical && unit.inspiration?.expires > state.time) {
      const armor = unit.role === 'Tank' ? 4500 : 1500;
      amount *= (5500 + armor) / (5500 + armor * (1 + profile.inspiration));
    }
    if (!(melee&&encounter.mitigation) && physical && unit.resource?.type === 'Rage' && random() < .25) {
      amount = Math.max(0, amount - 45);
      unit.rotation.revengeUntil = state.time + 5;
    }
    if (amount > 0 && unit === caster) triggerWaterShield();
    for (const key of ['shield', 'aegis', ...(physical ? ['enchantAbsorb'] : [])]) {
      const absorb = unit[key];
      if (!(absorb?.amount > 0 && absorb.expires > state.time)) continue;
      const consumed = Math.min(amount, absorb.amount);
      absorb.amount -= consumed;
      amount -= consumed;
      if(absorb.credits){let remaining=consumed;for(const share of absorb.credits){const n=Math.min(remaining,share.amount);share.amount-=n;remaining-=n;if(n)share.credit(n);}absorb.credits=absorb.credits.filter(s=>s.amount>0);}
      else if(absorb.credit)absorb.credit(consumed);else creditAbsorb(key,consumed);
    }
    gainDamageRage(unit, Math.min(unit.hp, amount));
    unit.hp = Math.max(0, unit.hp - amount);
    if (amount > 0 && procMending) triggerMending(unit);
    const cast = state.cast;
    if (canPushback && amount > 0 && unit === caster && cast && !cast.channel && cast.pushbacks < 2 &&
        random() >= (profile.pushbackResist ?? 0)) {
      cast.pushbacks++;
      cast.end += .5;
      cast.duration += .5;
    }
    if (physical && incomingAmount > 0 && unit === caster && unit.hp) {
      for (const effect of enchants.filter(effect=>effect.kind==='absorb')) {
        if (state.time < (state.enchantNext[effect.id]??0) || random()>=effect.chance) continue;
        state.enchantNext[effect.id]=state.time+effect.icd;
        unit.enchantAbsorb={amount:effect.absorb,expires:Infinity};
        state.enchantProcs[effect.id]=(state.enchantProcs[effect.id]??0)+1;
      }
    }
    if(!damageBatch)encounter.onDamageTaken?.(unit,amount);
    return amount;
  }

  // A simultaneous party pulse may trigger the aura's starting holder only.
  // A newly jumped-to ally must wait for a later damage/healing event.
  function damageParty(amount, physical = true, canPushback = true) {
    const damaged=[];damageBatch=true;
    const mendingTarget = state.mending?.target ?? null;
    let trigger = false;
    for (const unit of party) if (unit.hp) {
      const dealt = damage(unit, amount, physical, false, canPushback);
      if(dealt>0)damaged.push(unit);
      if (unit === mendingTarget && dealt > 0) trigger = true;
    }
    damageBatch=false;encounter.onRaidDamageBatch?.(damaged);
    if (trigger) triggerMending(mendingTarget);
  }

  function spiritRegenFraction(time) {
    if (time < state.innervateUntil) return 5;
    return time < state.lastSpend + 5 ? (profile.castingRegen ?? 0) : 1;
  }

  function manaRegenRate(time = state.time) {
    return (profile.mp5 ?? 0) / 5 + (profile.regen + extraSpirit(time)*(profile.spiritRegenCoefficient??.125)) * spiritRegenFraction(time);
  }

  function regenerate(from, to) {
    while (from < to) {
      const innervated = from < state.innervateUntil;
      const restricted = from < state.lastSpend + 5;
      const boundaries = [to, state.innervateUntil, state.lastSpend + 5, state.focusSpend + 5, state.clearcastingSpend + 5, ...Object.values(state.enchantAuras).map(aura=>aura.expires)];
      const end = Math.min(...boundaries.filter(time => time > from));
      const seconds = end - from;
      if (state.phase === 'active' && state.waterShield?.charges > 0) {
        state.waterShieldUptime += Math.max(0, Math.min(end, state.waterShield.expires) - from);
      }
      const spiritFraction = spiritRegenFraction(from);
      const regen = manaRegenRate(from) * seconds;
      if (state.phase === 'active') {
        const headroom = Math.max(0, profile.mana - state.mana - regen);
        state.manaPerSpirit += Math.min(headroom, (profile.spiritPerRawPoint ?? 1) * spiritFraction * seconds * (profile.spiritRegenCoefficient ?? .125));
        state.manaPerMp5 += Math.min(headroom, seconds / 5);
      }
      const normalFraction = restricted ? (profile.castingRegen ?? 0) : 1;
      // Credit the free-cast window until the next paid spell lands.
      const freeCastSpend = Math.max(state.focusSpend, state.clearcastingSpend);
      const freeCastSource = state.clearcastingSpend > state.focusSpend ? 'Omen of Clarity · Spirit regeneration' : 'Inner Focus · Spirit regeneration';
      const withoutFocus = freeCastSpend > state.lastSpend && (state.focusSpend >= state.clearcastingSpend || from < freeCastSpend + 5) ? (profile.castingRegen ?? 0) : normalFraction;
      const focusBonus = Math.max(0, normalFraction - withoutFocus);
      const components = {
        'Spirit regeneration': profile.regen * (normalFraction - focusBonus) * seconds,
        'Enchant Weapon - Insight': extraSpirit(from)*(profile.spiritRegenCoefficient??.125)*spiritFraction*seconds,
        'Mana / 5': (profile.mp5 ?? 0) / 5 * seconds,
        'Innervate': innervated ? profile.regen * (5 - normalFraction) * seconds : 0,
        [freeCastSource]: innervated ? 0 : profile.regen * focusBonus * seconds
      };
      // Innervate supersedes the free-cast benefit; retain the baseline Spirit rate.
      if (innervated) components['Spirit regeneration'] += profile.regen * focusBonus * seconds;
      const usable = regen > 0 ? Math.min(1, Math.max(0, profile.mana - state.mana) / regen) : 0;
      for (const [source, amount] of Object.entries(components)) {
        if (amount > 0 && state.phase === 'active') creditMana(source, amount * usable);
      }
      restoreMana(regen);
      from = end;
    }
  }

  function step(dt) {
    if (state.phase !== 'active') return;
    const end = state.time + dt;
    if (state.cast && end >= state.cast.end) {
      const castEnd = Math.max(state.time, state.cast.end);
      regenerate(state.time, castEnd);
      state.time = castEnd;
      if (state.cast.channel) state.cast = null;
      else finishCast();
    }
    regenerate(state.time, end);
    state.time = end;
    if (state.phase !== 'active') return;
    state.survivalSeconds += party.filter(unit => unit.hp).length * dt;
    for (const effect of state.effects) {
      if (state.time < effect.next) continue;
      if (effect.abolishPoison) effect.target.poison = 0;
      else if (effect.manaTick) {restoreMana(effect.manaTick, spells[effect.key]?.name ?? effect.key);encounter.onGroupMana?.(caster,effect.manaTick,spells[effect.key]?.name ?? effect.key,effect.members);}
      else for (const unit of effect.target ? [effect.target] : effect.members ?? party) heal(effect.key, unit, tickAmount(effect),
        effect.periodicCrit, null, 0, effect.bonusCrit, !spells[effect.key]?.immediateTick, spells[effect.key], null, true);
      effect.next += effect.period;
      effect.left--;
      if (!effect.left && effect.swiftmendable && profile.bloom) heal('bloom', effect.target, profile.bloom + extraSpirit()*(profile.bloomPerSpirit??0));
    }
    state.effects = state.effects.filter(effect => effect.left > 0);
    if (encounter.supportMode) {checkFightEnd();return;}
    const bossSpeed = state.enraged ? 1.2 : 1;
    if (state.time >= state.nextSwing) {
      state.nextSwing += 2 / bossSpeed;
      const living = party.filter(unit => unit.hp);
      if (living.length) damage(living[0], encounter.swing,true,true,true,true);
      for (const unit of living) if (unit.poison > state.time) damage(unit, encounter.poisonTick, false);
    }
    if (state.time >= state.nextPoison) {
      state.nextPoison += 11 / bossSpeed;
      const living = party.filter(unit => unit.hp);
      if (living.length) living[Math.floor(random() * living.length)].poison = state.time + 10;
      state.message = (encounter.hazard === 'disease' ? 'Infected Blade' : 'Poisoned Blade') + ' · dispel the marked player';
    }
    if (state.time >= state.nextFlurry) {
      state.nextFlurry += 9 / bossSpeed;
      damageParty(encounter.flurry);
      state.message = 'Blade Flurry hit the party!';
    }
    if (state.time >= state.nextSpecial && encounter.id === 'patchwerk') {
      state.nextSpecial += 3;
      const target = party[1].hp ? party[1] : party.find(unit => unit.hp);
      if (target) damage(target, encounter.strike,true,true,true,true);
      state.message = 'Hateful Strike hits ' + (target?.name ?? 'the party') + '!';
    }
    if (state.time >= state.nextSpecial && encounter.id === 'sapphiron') {
      state.nextSpecial += 2;
      damageParty(encounter.frost, false, false);
    }
    if (encounter.id) advancePartyCombat(state, dt, random, onDamage,(unit,amount)=>damage(unit,amount,false));
    else state.boss = Math.max(0, state.boss - party.reduce((sum, unit) => sum + (unit.hp ? unit.dps : 0), 0) * dt);
    if ((!encounter.id || encounter.id === 'rend') && !state.enraged && state.boss > 0 && state.boss <= encounter.health * .35) {
      state.enraged = true;
      for (const timer of ['nextSwing', 'nextPoison', 'nextFlurry']) {
        state[timer] = state.time + Math.max(0, state[timer] - state.time) / 1.2;
      }
      state.message = 'Rend Blackhand enrages!';
    }
    checkFightEnd();
  }

  function checkFightEnd() {
    if(encounter.supportMode){if(!caster.hp){state.phase='lost';state.cast=null;state.effects=[];}return;}
    if (!caster.hp || state.time >= encounter.limit || !state.boss) {
      state.phase = !state.boss && caster.hp ? 'won' : 'lost';
      state.cast = null;
      state.effects = [];
      state.swiftness = 0;
      for (const unit of party) unit.poison = 0;
      state.endedAt = state.time;
      state.survivors = party.filter(unit => unit.hp).length;
      state.manaAtEnd = state.mana;
    }
  }
  return {state, cast, step, incomingHealing, manaRegenRate, healingPower, grantMana:restoreMana, reactToDamage(unit){if(unit===caster)triggerWaterShield();triggerMending(unit);}, start() { if (state.phase === 'ready') state.phase = 'active'; }};
}
