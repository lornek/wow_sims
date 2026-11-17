import test from 'node:test';import assert from 'node:assert/strict';
import {exportGearSet} from '../public/healing/gear-export.mjs';
test('gear export preserves exact equipped items and enchants independently of browser state',()=>{
 const equipment={Head:{id:123,key:'Forever:123',name:'Example helm',enchantId:456,stats:{power:20}},'Off hand':null};
 const data=exportGearSet({className:'druid',name:' My set ',preset:'Custom',equipment});
 assert.equal(data.name,'My set');assert.equal(data.className,'druid');assert.equal(data.version,1);
 assert.deepEqual(JSON.parse(JSON.stringify(data)).equipment,equipment);
 data.equipment.Head.stats.power=999;assert.equal(equipment.Head.stats.power,20);
 assert.equal(exportGearSet({className:'priest',preset:'Tier 4',spec:'holy'}).name,'Tier 4');
});
