import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import {damageTextLanes} from '../public/healing/damage-text.mjs';
const profile={mana:10000,regen:0,mp5:0,castingRegen:0,power:0,crit:0};
const encounter={id:'rend',party:['Cairne','Illidan','Sylvanas','Jaina','Malfurion'].map((name,i)=>({name,max:100000,dps:0,color:['#a97043','#9a50be','#548e30','#247fa3','#bd6520'][i]})),health:1e9,swing:0,flurry:0,poisonTick:0,limit:100};
function run(onDamage){let seed=7;const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32};const p=createPull(profile,{},encounter,rng,()=>{},onDamage);p.start();for(let i=0;i<300;i++)p.step(.1);return p.state;}
test('damage callback reports every individual hit with exact damage, crit, ability and source',()=>{
 const events=[];const s=run(event=>events.push(event));
 const meters=s.party.flatMap(u=>Object.values(u.damage??{})).filter(m=>m.total>0);
 assert.equal(events.length,meters.reduce((n,m)=>n+m.hits,0));
 assert.equal(events.reduce((n,e)=>n+e.amount,0),meters.reduce((n,m)=>n+m.total,0));
 assert.equal(events.filter(e=>e.crit).length,meters.reduce((n,m)=>n+m.crits,0));
 assert.ok(events.some(e=>e.spell==='Ignite'||e.spell==='Serpent Sting'));
 for(const name of ['Cairne','Illidan','Sylvanas','Jaina'])assert.ok(events.some(e=>e.source===name));
 for(const event of events){assert.equal(event.color,s.party[event.sourceIndex].color);assert.ok(event.amount>0);}
});
test('damage presentation callbacks do not change seeded combat or consume random rolls',()=>{
 const a=run(),b=run(()=>{});assert.deepEqual(a,b);
});
test('damage quadrants match the requested party layout',()=>{
 assert.deepEqual(damageTextLanes,{Cairne:'top-left',Illidan:'bottom-left',Sylvanas:'top-right',Jaina:'bottom-right'});
});
