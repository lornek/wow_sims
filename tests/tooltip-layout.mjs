import test from 'node:test';
import assert from 'node:assert/strict';
import {tooltipPosition} from '../public/healing/tooltip-layout.mjs';
test('tooltips use the right side, clamped to the page edge',()=>{
  assert.deepEqual(tooltipPosition({left:100,right:140,top:50,width:40},200,100,800,600),{left:148,top:58});
  assert.deepEqual(tooltipPosition({left:700,right:740,top:50,width:40},200,100,800,600),{left:592,top:58});
});
test('tooltips remain in narrow viewports and move above bottom-edge triggers',()=>{
  const position=tooltipPosition({left:10,right:50,top:550,width:40},300,200,320,600);
  assert.deepEqual(position,{left:12,top:342});
  assert.deepEqual(tooltipPosition({left:0,right:20,top:0,width:20},304,584,320,600),{left:8,top:8});
});

test('prefers above and right when there is space',()=>{
 assert.deepEqual(tooltipPosition({left:100,right:140,top:400,bottom:440,width:40},200,100,800,600),{left:148,top:292});
});
