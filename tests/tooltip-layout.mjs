import test from 'node:test';
import assert from 'node:assert/strict';
import {tooltipPosition} from '../public/healing/tooltip-layout.mjs';
test('tooltips use the available side of the trigger',()=>{
  assert.deepEqual(tooltipPosition({left:100,right:140,top:50,width:40},200,100,800,600),{left:148,top:50});
  assert.deepEqual(tooltipPosition({left:700,right:740,top:50,width:40},200,100,800,600),{left:492,top:50});
});
test('tooltips remain in narrow viewports and move above bottom-edge triggers',()=>{
  const position=tooltipPosition({left:10,right:50,top:550,width:40},300,200,320,600);
  assert.deepEqual(position,{left:8,top:342});
  assert.deepEqual(tooltipPosition({left:0,right:20,top:0,width:20},304,584,320,600),{left:8,top:8});
});
