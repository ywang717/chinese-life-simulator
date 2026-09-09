import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';
import {materialize} from '../dist/engine/event.js';

const startupEvent=()=>({
  id:'synthetic_startup_choice',title:'合伙创业',text:'有人邀请你一起创业。',category:'职业',conditions:[],effects:[],
  options:[
    {text:'一起创业',effects:[{type:'startup'}]},
    {text:'暂时不参与',effects:[]}
  ]
});
const player=credit=>{
  const s=createPlayer({seed:`创业资格-${credit}`,city:'shanghai'});
  s.age=58;s.education=4;s.major='机械';s.cash=100000;s.hidden.credit=credit;s.retired=false;
  return s;
};

test('不满足创业者入职条件时，事件不能展示会执行 startup 的选项',()=>{
  const event=materialize(startupEvent(),player(-14));
  assert.ok(event);
  assert.ok(!event.options.some(o=>(o.effects??[]).some(e=>e.type==='startup')));
  assert.ok(event.options.some(o=>o.text==='暂时不参与'));
});

test('满足创业者入职条件时，创业选项仍然保留',()=>{
  const event=materialize(startupEvent(),player(60));
  assert.ok(event.options.some(o=>(o.effects??[]).some(e=>e.type==='startup')));
});
