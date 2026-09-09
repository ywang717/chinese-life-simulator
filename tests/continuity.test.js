import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';

const sameSeedName=name=>createPlayer({seed:'姓名连续性',city:'zhengzhou',name});

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
