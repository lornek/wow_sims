import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=mkdtempSync(join(tmpdir(),'healbot-baseline-'));
const source=execFileSync('git',['show','388a4db677b2b01e07d0e35991c18907cafb24bf:public/healing/engine.mjs'],{encoding:'utf8'});
const file=join(temp,'engine.mjs');
writeFileSync(file,source.replace("'./party-combat.mjs'",JSON.stringify(new URL('../public/healing/party-combat.mjs',import.meta.url).href)));
const {createPull:before}=await import(pathToFileURL(file));
process.on('exit',()=>rmSync(temp,{recursive:true,force:true}));
import {createPull as after} from '../public/healing/engine.mjs';
import {encounters} from '../public/healing/party-combat.mjs';
import assert from 'node:assert/strict';
for(const [id,boss] of Object.entries(encounters)){
 const scenario={...boss,id,party:[{name:'Cairne',role:'Tank',max:3200},{name:'Illidan',max:3000},{name:'Sylvanas',max:2400},{name:'Jaina',max:2400},{name:'Healer',max:2500}]};
 const run=engine=>{let seed=42;const p=engine({mana:20000,regen:10,mp5:0,power:100,crit:.2},{heal:{key:'heal',name:'Heal',cast:1.5,gcd:1.5,cost:100,low:300,high:500,coefficient:.5}},scenario,()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32));p.start();let steps=0;const start=performance.now();while(p.state.phase==='active'&&steps++<10000){if(steps%40===0){const target=p.state.party.map((u,i)=>({i,h:u.hp/u.max})).filter(u=>u.h>0).sort((a,b)=>a.h-b.h)[0];p.cast('heal',target.i);}p.step(.05);}return {state:p.state,ms:performance.now()-start};};
 const a=run(before),b=run(after);for(const key of ['boss','healing','overheal','mana','manaSpent','phase','endedAt'])assert.deepEqual(b.state[key],a.state[key],id+' '+key);
 assert.deepEqual(b.state.party,a.state.party);console.log(id+': identical seeded combat outcome; baseline '+a.ms.toFixed(2)+'ms, release '+b.ms.toFixed(2)+'ms; events '+b.state.events.length);
}
