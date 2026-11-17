import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
test('tooltip audit separates healing, damage and aura without counting on-use, procs or set text',()=>{
 const code=`import sys;sys.dont_write_bytecode=True
import importlib.util
spec=importlib.util.spec_from_file_location('audit','scripts/audit-healing-stats.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
a,_,_=m.passive_bonuses('Equip: Increases healing done by up to 88 and damage done by up to 30 for all magical spells and effects. Use: Increases healing done by spells and effects by up to 1000.')
assert a=={'power':88,'spellDamage':30},a
b,_,_=m.passive_bonuses('Equip: Increases healing done by up to 62 and damage done by up to 19 for all magical spells and effects of all party members within 30. Equip: Increases healing done by up to 300 and damage done by up to 150 for all magical spells and effects.')
assert b=={'power':362,'spellDamage':169},b
c,_,h=m.passive_bonuses('Equip: Increases your casting speed by 4%. Equip: Increases damage and healing done by magical spells and effects by up to 51.')
assert c=={'power':51,'spellDamage':51} and h==4,(c,h)
d,_,_=m.passive_bonuses('Use: Increases healing done by spells and effects by up to 450. Equip: Your spells have a chance to heal for 900. (2) Set: Increases healing done by spells and effects by up to 99.')
assert d=={},d
`;
 execFileSync('python3',['-c',code],{cwd:new URL('..',import.meta.url)});
});
