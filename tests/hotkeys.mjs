import test from 'node:test';
import assert from 'node:assert/strict';
import {hotkey,hotkeyLabel,assignHotkey} from '../public/healing/hotkeys.mjs';
test('hotkey chords distinguish modifiers, keys and mouse buttons',()=>{
  assert.equal(hotkey({code:'KeyQ',ctrlKey:true,shiftKey:true}),'Ctrl+Shift+KeyQ');
  assert.equal(hotkey({code:'Digit1',altKey:true}),'Alt+Digit1');
  assert.equal(hotkey({button:2,ctrlKey:true},true),'Ctrl+MouseRight');
  assert.equal(hotkey({button:1,shiftKey:true},true),'Shift+MouseMiddle');
  assert.equal(hotkey({button:3},true),'MouseBack');
  assert.equal(hotkey({button:4,altKey:true},true),'Alt+MouseForward');
  for(const code of ['ShiftLeft','ControlRight','Shift','Control','Alt','Meta','Escape','Tab']) assert.equal(hotkey({code}),null);
  assert.equal(hotkeyLabel('Ctrl+Shift+KeyQ'),'Ctrl + Shift + Q');
});
test('reassigning a chord removes its previous owner without changing other spells',()=>{
  const original={regrowth:'KeyQ',rejuvenation:'KeyE',swiftmend:'KeyR'};
  assert.deepEqual(assignHotkey(original,'rejuvenation','KeyQ'),{swiftmend:'KeyR',rejuvenation:'KeyQ'});
  assert.equal(original.regrowth,'KeyQ');
});
