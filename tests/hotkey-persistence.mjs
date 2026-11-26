import test from 'node:test';
import assert from 'node:assert/strict';
import {readHotkeyPreference} from '../public/healing/hotkeys.mjs';
const storage = entries => {const values=new Map(entries);return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};
test('raid bindings migrate into the shared spec preference',()=>{
 const saved=storage([['priest.raid.hotkeys','{"flash":"KeyF"}']]);
 assert.equal(readHotkeyPreference(saved,'priest','.hotkeys'),'{"flash":"KeyF"}');
 assert.equal(saved.getItem('priest.hotkeys'),'{"flash":"KeyF"}');
});
test('shared bindings take precedence and remain isolated by spec',()=>{
 const saved=storage([['priest.hotkeys','{}'],['priest.raid.hotkeys','{"flash":"KeyF"}']]);
 assert.equal(readHotkeyPreference(saved,'priest','.hotkeys'),'{}');
 assert.equal(readHotkeyPreference(saved,'druid','.hotkeys'),null);
});
test('reset cancel binding does not resurrect a legacy raid binding',()=>{
 const saved=storage([['priest.raid.cancelHotkey','KeyX']]);
 assert.equal(readHotkeyPreference(saved,'priest','.cancelHotkey'),'KeyX');
 saved.setItem('priest.cancelHotkey','');
 assert.equal(readHotkeyPreference(saved,'priest','.cancelHotkey'),'');
});
