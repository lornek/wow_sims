import test from 'node:test';
import assert from 'node:assert/strict';
import {spellbookEntries,spellbookPage,spellbookStatus} from '../public/healing/spellbook-layout.mjs';
const rows=[{name:'Heal',school:'restoration',status:'changed',ranks:[{rank:{rank:'Rank 1',level:1}},{rank:{rank:'Rank 2',level:10}}]}, {name:'Bolt',school:'elemental',status:'new',ranks:[{rank:{rank:'Rank 1',level:4}}]}];
test('spellbook shows highest learned rank per school and searches across schools',()=>{
 assert.equal(spellbookEntries(rows,{school:'Restoration',level:5})[0].rank.rank,'Rank 1');
 assert.equal(spellbookEntries(rows,{school:'Restoration',level:60})[0].rank.rank,'Rank 2');
 assert.equal(spellbookEntries(rows,{school:'Restoration',level:60,allRanks:true}).length,2);
 assert.equal(spellbookEntries(rows,{school:'Restoration',query:'bolt'})[0].name,'Bolt');
 assert.equal(spellbookEntries(rows,{school:'Restoration',status:'new'}).length,0);
 assert.equal(spellbookEntries(rows,{school:'Elemental',status:'new'}).length,1);
});
test('paired pages contain six rows each with no skipped or duplicated entries',()=>{
 const entries=Array.from({length:29},(_,id)=>({id}));
 const pages=Array.from({length:3},(_,i)=>spellbookPage(entries,i));
 assert.deepEqual(pages.flatMap(p=>[...p.left,...p.right]),entries);
 assert.equal(pages[0].left.length,6);assert.equal(pages[0].right.length,6);assert.equal(pages[2].left.length,5);assert.equal(pages[2].right.length,0);
 assert.equal(spellbookPage(entries,99).index,2);assert.equal(spellbookPage([],99).index,0);assert.equal(spellbookPage([],99).pages,1);
});

test('Classic comparisons use known statuses without mislabelling unverified spells',()=>{
 assert.equal(spellbookStatus('unchanged'),'same');assert.equal(spellbookStatus(undefined),'unclassified');assert.equal(spellbookStatus('removed'),'removed');
 const source=[{...rows[0],status:'unchanged'},{...rows[0],name:'Unknown',status:undefined}];
 assert.equal(spellbookEntries(source,{school:'Restoration',status:'same'}).length,1);
 assert.equal(spellbookEntries(source,{school:'Restoration',status:'unclassified'})[0].name,'Unknown');
});
