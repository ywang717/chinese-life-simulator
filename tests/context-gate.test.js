import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';
import {eventById} from '../dist/data/events.js';
import {materialize} from '../dist/engine/event.js';

const player=(overrides={})=>Object.assign(createPlayer({seed:'人物状态一致性',city:'hangzhou'}),overrides);

test('城市事件必须匹配玩家当前所在城市',()=>{
  const s=player({age:30,city:'hangzhou'});
  assert.equal(materialize(eventById('city_shanghai'),s),null);
  s.city='shanghai';
  assert.ok(materialize(eventById('city_shanghai'),s));
});

test('事件年龄条件在物化阶段也必须成立',()=>{
  const s=player({age:4,city:'shanghai'});
  assert.equal(materialize(eventById('city_shanghai'),s),null);
  s.age=30;
  assert.ok(materialize(eventById('city_shanghai'),s));
});

test('职业专属事件只能属于当前在职职业',()=>{
  const s=player({age:30,career:'shipyard',retired:false,careerYears:5});
  assert.equal(materialize(eventById('programmer_work'),s),null);
  s.career='programmer';
  assert.ok(materialize(eventById('programmer_work'),s));
  s.retired=true;
  assert.equal(materialize(eventById('programmer_work'),s),null);
});

test('已婚人物不能再次进入普通恋爱事件',()=>{
  const s=player({age:30,relationshipStatus:'已婚',partner:{name:'林安宁',relationship:70,city:'hangzhou'}});
  assert.equal(materialize(eventById('romance'),s),null);
});

test('需要伴侣的关系事件在伴侣状态缺失时应安全排除',()=>{
  const s=player({age:30,relationshipStatus:'恋爱',partner:null});
  s.history.push({age:27,year:s.birthYear+27,city:s.city,eventId:'romance',category:'家庭',title:'有人走近你的生活',text:'',choice:null,background:[],effects:[]});
  assert.doesNotThrow(()=>materialize(eventById('marriage'),s));
  assert.equal(materialize(eventById('marriage'),s),null);
});
