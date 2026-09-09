import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';
import {materialize} from '../dist/engine/event.js';
import {eventById} from '../dist/data/events.js';

const sameSeedName=name=>createPlayer({seed:'姓名连续性',city:'zhengzhou',name});
const employable=()=>{
  const s=createPlayer({seed:'求职连续性',city:'hangzhou'});
  s.age=26;s.education=5;s.major='通用';
  Object.keys(s.hidden).forEach(k=>s.hidden[k]=85);
  Object.keys(s.hobbies).forEach(k=>s.hobbies[k]=80);
  return s;
};

test('自定义中文姓名让父亲跟随玩家姓氏，母亲保持独立随机姓氏',()=>{
  const wang=sameSeedName('王小明');
  const zhao=sameSeedName('赵小明');
  assert.ok(wang.parents[0].name.startsWith('王'));
  assert.ok(zhao.parents[0].name.startsWith('赵'));
  assert.equal(wang.parents[1].name,zhao.parents[1].name);
});

test('无法识别中文姓氏时父亲回退随机姓氏且人物仍可创建',()=>{
  const s=sameSeedName('John');
  assert.equal(s.name,'John');
  assert.match(s.parents[0].name,/^[王李张刘陈杨赵周徐孙]/);
});

test('新人物初始化轻量回声计数',()=>{
  const s=sameSeedName('王小明');
  assert.deepEqual(s.echoUsage,{});
});

test('第一次求职与再次求职使用不同语义',()=>{
  const first=employable();
  const a=materialize(eventById('job_search'),first);
  assert.equal(a.title,'第一份工作的方向');
  const again=employable();
  again.careerHistory=[{career:'programmer',startAge:22,endAge:25,highest:1,city:'hangzhou'}];
  const b=materialize(eventById('job_search'),again);
  assert.equal(b.title,'重新寻找工作');
  assert.doesNotMatch(b.text,/第一份工作/);
  assert.match(b.text,/程序员/);
});

test('上一份职业的相邻转型进入再次求职前列但仍保留其他方向',()=>{
  const s=employable();
  s.careerHistory=[{career:'programmer',startAge:22,endAge:25,highest:1,city:'hangzhou'}];
  const e=materialize(eventById('job_search'),s);
  const names=e.options.slice(0,4).map(o=>o.text);
  assert.ok(names.some(n=>['产品经理','游戏策划'].includes(n)));
  assert.ok(new Set(names).size>1);
});
