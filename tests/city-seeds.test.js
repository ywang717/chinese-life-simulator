import test from 'node:test';
import assert from 'node:assert/strict';
import {cities} from '../dist/data/cities.js';

test('城市种子扩展到200座且标识唯一',()=>{
  assert.equal(cities.length,200);
  assert.equal(new Set(cities.map(c=>c.id)).size,200);
  assert.equal(new Set(cities.map(c=>c.name)).size,200);
});

test('每座城市种子都能驱动职业、爱好与事件筛选',()=>{
  for(const c of cities){
    assert.ok(Number.isFinite(c.wage)&&c.wage>0,c.name);
    assert.ok(Number.isFinite(c.cost)&&c.cost>0,c.name);
    assert.ok(Number.isFinite(c.house)&&c.house>0,c.name);
    assert.ok(Number.isFinite(c.education)&&c.education>0,c.name);
    assert.ok(Object.keys(c.careerWeights).length>=4,c.name);
    assert.ok(Object.keys(c.hobbyWeights).length>=3,c.name);
    assert.ok(c.eventTags.includes(c.id),c.name);
    assert.ok(c.description.length>=12,c.name);
  }
});
