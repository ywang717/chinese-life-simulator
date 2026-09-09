import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';
import {materialize} from '../dist/engine/event.js';
import {eventById} from '../dist/data/events.js';

test('不满足创业者入职条件时，事件不能展示会执行 startup 的选项',()=>{
  const s=createPlayer({seed:'创业资格回归',city:'shanghai'});
  s.age=58;
  s.education=4;
  s.major='机械';
  s.cash=100000;
  s.hidden.credit=-14;
  s.retired=false;
  const event=materialize(eventById('friend_business'),s);
  assert.ok(event);
  assert.ok(!event.options.some(o=>(o.effects??[]).some(e=>e.type==='startup')));
});

test('满足创业者入职条件时，创业选项仍然保留',()=>{
  const s=createPlayer({seed:'创业资格正常',city:'shanghai'});
  s.age=58;
  s.education=4;
  s.major='机械';
  s.cash=100000;
  s.hidden.credit=60;
  s.retired=false;
  const event=materialize(eventById('friend_business'),s);
  assert.ok(event.options.some(o=>(o.effects??[]).some(e=>e.type==='startup')));
});
