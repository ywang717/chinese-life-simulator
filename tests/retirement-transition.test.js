import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';
import {materialize} from '../dist/engine/event.js';
import {eventById} from '../dist/data/events.js';

const injuredWorker=()=>{
  const s=createPlayer({seed:'退休工伤回归',city:'nantong'});
  s.age=62;
  s.career='shipyard';
  s.careerLevel=0;
  s.education=5;
  s.major='警务';
  s.hidden.credit=74;
  s.stats.health=45.8;
  return s;
};

test('退休后不再出现工伤职业转换后续',()=>{
  const s=injuredWorker();
  s.retired=true;
  assert.equal(materialize(eventById('injury_transition'),s),null);
});

test('未退休时工伤职业转换后续仍可出现',()=>{
  const s=injuredWorker();
  s.retired=false;
  const event=materialize(eventById('injury_transition'),s);
  assert.ok(event);
  assert.ok(event.options.length>=2);
});
