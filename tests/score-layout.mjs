import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreFitScale} from '../public/healing/score-layout.mjs';
test('score text shrinks to narrow containers without enlarging on desktop',()=>{
 assert.equal(scoreFitScale(300,900),1/3);
 assert.equal(scoreFitScale(1200,900),1);
 assert.equal(scoreFitScale(0,900),0);
 assert.equal(scoreFitScale(300,0),1);
});
test('large score values still fit at mobile and zoomed viewport widths',()=>{
 for(const width of [160,240,320,375,768,1440]) for(const natural of [500,900,1400]) {
  assert.ok(natural*scoreFitScale(width,natural)<=width+1e-9);
 }
});

test('measured fitting includes operator gaps and container padding', async()=>{
 const {fitScoreFormula}=await import('../public/healing/score-layout.mjs');
 let scale=1;
 const element={hidden:false,clientWidth:320,style:{setProperty(name,value){if(name==='--score-fit')scale=Number(value);}},
   children:Array.from({length:8},()=>({getBoundingClientRect:()=>({width:80*scale})}))};
 const old=globalThis.getComputedStyle;
 globalThis.getComputedStyle=()=>({paddingLeft:'8px',paddingRight:'8px',columnGap:String(12*scale)});
 try {
  fitScoreFormula(element);
  assert.ok(Math.abs(scale-303/724)<1e-12);
  assert.ok((8*80+7*12)*scale<=304);
  element.clientWidth=1000;fitScoreFormula(element);assert.equal(scale,1);
 } finally {if(old)globalThis.getComputedStyle=old;else delete globalThis.getComputedStyle;}
});
