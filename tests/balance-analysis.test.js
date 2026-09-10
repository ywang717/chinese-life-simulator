import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeBalance} from '../scripts/balance-lib.mjs';

test('平衡统计汇总寿命、选择、类别、重复和连续性命中',()=>{
  const lives=[
    {seed:'a',city:'hangzhou',age:80,years:81,choices:20,categories:{职业:20,家庭:10},eventCounts:{job_search:2,marriage:1},continuityHits:30,strongFollowUps:4,cityHits:3,careerHits:4,npcHits:2,maxCategoryStreak:3},
    {seed:'b',city:'zhengzhou',age:70,years:71,choices:18,categories:{职业:10,家庭:20},eventCounts:{job_search:1,marriage:2},continuityHits:20,strongFollowUps:2,cityHits:1,careerHits:2,npcHits:1,maxCategoryStreak:4}
  ];
  const s=summarizeBalance(lives);
  assert.equal(s.lives,2);
  assert.equal(s.years,152);
  assert.equal(s.choices,38);
  assert.equal(s.age.mean,75);
  assert.equal(s.age.median,75);
  assert.equal(s.categoryCounts.职业,30);
  assert.equal(s.eventCounts.marriage,3);
  assert.equal(s.continuityHits,50);
  assert.equal(s.strongFollowUps,6);
  assert.equal(s.maxCategoryStreak,4);
});

test('空样本不会产生 NaN 或无穷值',()=>{
  const s=summarizeBalance([]);
  assert.equal(s.lives,0);
  assert.equal(s.years,0);
  assert.equal(s.choiceRatio,0);
  assert.equal(s.age.mean,0);
  assert.equal(s.age.median,0);
});
