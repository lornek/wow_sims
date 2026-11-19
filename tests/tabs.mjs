import test from 'node:test';
import assert from 'node:assert/strict';
import {mountTabs} from '../public/healing/tabs.mjs';
test('main tabs preserve nested spellbook school handlers and panel visibility',()=>{
 const main={},nested={};const panels=Object.fromEntries(['character','talents','spellbook','custom','schools'].map(id=>[id,{hidden:false}]));
 const make=(id,list)=>({tabIndex:0,attrs:{'aria-controls':id},getAttribute(key){return this.attrs[key]},setAttribute(key,v){this.attrs[key]=v},closest(){return list},focus(){this.focused=true}});
 const outer=['character','talents','spellbook','custom'].map(id=>make(id,main));const school=make('schools',nested);
 let clicks=0;const schoolClick=()=>clicks++;const schoolKey=()=>{};school.onclick=schoolClick;school.onkeydown=schoolKey;
 main.querySelectorAll=()=>[...outer,school];
 const root={matches:()=>false,querySelector(selector){return selector==='[role=tablist]'?main:panels[selector.slice(1)]}};
 mountTabs(root);assert.equal(school.onclick,schoolClick);assert.equal(school.onkeydown,schoolKey);
 outer[2].onclick();school.onclick();assert.equal(clicks,1);assert.equal(panels.spellbook.hidden,false);assert.equal(panels.schools.hidden,false);
 outer[2].onkeydown({key:'ArrowRight',preventDefault(){}});assert.equal(panels.custom.hidden,false);assert.equal(outer[3].focused,true);
});
test('keyboard navigation skips the Custom tab when it is docked and hidden',()=>{
 const list={},panels={character:{},spellbook:{},custom:{}};
 const tabs=['character','spellbook','custom'].map(id=>({hidden:id==='custom',attrs:{'aria-controls':id},closest:()=>list,getAttribute(key){return this.attrs[key]},setAttribute(key,v){this.attrs[key]=v},focus(){this.focused=true}}));
 list.querySelectorAll=()=>tabs;
 mountTabs({matches:()=>false,querySelector:selector=>selector==='[role=tablist]'?list:panels[selector.slice(1)]});
 tabs[1].onclick();tabs[1].onkeydown({key:'ArrowRight',preventDefault(){}});
 assert.equal(tabs[0].attrs['aria-selected'],true);assert.equal(tabs[0].focused,true);assert.equal(panels.custom.hidden,true);
});
