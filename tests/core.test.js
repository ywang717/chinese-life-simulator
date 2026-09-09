import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';
import {applyEffects} from '../dist/engine/effect.js';
import {advanceYear,choose,rewind} from '../dist/engine/year.js';
import {probability} from '../dist/engine/probability.js';
import {candidates} from '../dist/engine/event.js';
import {events} from '../dist/data/events.js';

test('固定种子复现人物和人生',()=>{let a=createPlayer({seed:'复现',city:'nantong'}),b=createPlayer({seed:'复现',city:'nantong'});assert.deepEqual(a,b);for(let i=0;i<30&&!a.dead;i++){a=advanceYear(a);b=advanceYear(b);if(a.pending){a=choose(a,0);b=choose(b,0);}assert.deepEqual(a,b);}});
test('属性不限制到零和一百，概率软饱和',()=>{let s=createPlayer({seed:'属性'});s=applyEffects(s,[{type:'stat',key:'intelligence',value:200},{type:'stat',key:'happiness',value:-200}],'测试');assert.ok(s.stats.intelligence>100);assert.ok(s.stats.happiness<0);assert.ok(probability(200)<1);assert.ok(probability(80)>probability(40));assert.ok(probability(220)-probability(160)<probability(120)-probability(60));});
test('迁居永久保留出生地和原房产，记录原因成本和关系距离',()=>{let s=createPlayer({seed:'迁居',city:'nantong'});s=applyEffects(s,[{type:'set',path:'age',value:30},{type:'cash',value:2000000},{type:'property',action:'buy'},{type:'migrate',city:'suzhou',reason:'工伤转行'}],'测试');assert.equal(s.birthCity,'nantong');assert.equal(s.city,'suzhou');assert.equal(s.cityHistory.length,2);assert.equal(s.cityHistory[0].endAge,30);assert.equal(s.properties[0].city,'nantong');assert.ok(s.familiarity<50);});
test('每年一个主事件，关键选择不能跳过',()=>{let s=createPlayer({seed:'年度'});for(let i=0;i<40&&!s.dead;i++){let age=s.age;s=advanceYear(s);assert.equal(s.age,age+1);if(s.pending){assert.throws(()=>advanceYear(s));s=choose(s,0);}assert.equal(s.history.filter(x=>x.age===s.age).length,1);}});
test('预约优先并且长期标签多年保留',()=>{let s=createPlayer({seed:'记忆'});s=applyEffects(s,[{type:'tag',key:'长期伤病'},{type:'schedule',eventId:'recovery',after:1}],'工伤');s=advanceYear(s);assert.equal(s.pending?.eventId??s.history.at(-1).eventId,'recovery');if(s.pending)s=choose(s,0);assert.ok(s.memories.some(m=>m.source==='工伤'));});
test('不满足电竞条件的事件不入池',()=>{let s=createPlayer({seed:'硬条件'});assert.ok(!candidates(s).some(x=>x.event.id==='esports_trial'));});
test('回退一次且复现最近选择前状态',()=>{let s=createPlayer({seed:'回退'});while(!s.pending&&!s.dead)s=advanceYear(s);const checkpoint=structuredClone(s);s=choose(s,0);s=rewind(s,checkpoint);assert.deepEqual(s.pending,checkpoint.pending);assert.equal(s.rewindUsed,true);assert.throws(()=>rewind(s,checkpoint));});
test('样例事件在80至120条，标识唯一',()=>{assert.ok(events.length>=80&&events.length<=120,events.length);assert.equal(new Set(events.map(e=>e.id)).size,events.length);});
