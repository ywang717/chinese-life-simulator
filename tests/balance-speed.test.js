import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as balance from '../scripts/balance-lib.mjs';

const life=(age,city,years=age,choices=10)=>({
  seed:`seed-${age}-${city}`,city,age,years,choices,
  categories:{职业:years},eventCounts:{job_search:1},
  continuityHits:1,strongFollowUps:0,cityHits:0,careerHits:1,npcHits:0,
  maxCategoryStreak:2,dead:true
});

test('shard payload 只保留可合并摘要和失败种子，并记录吞吐量',()=>{
  assert.equal(typeof balance.createShardPayload,'function');
  const payload=balance.createShardPayload([life(20,'hangzhou',20,4)],[],2000,{shard:0,count:1});
  assert.equal(Object.hasOwn(payload,'lives'),false);
  assert.deepEqual(payload.failedSeeds,[]);
  assert.equal(payload.summary.scanned,1);
  assert.equal(payload.summary.elapsedMs,2000);
  assert.equal(payload.summary.throughput,0.5);
  assert.deepEqual(payload.summary.ageCounts,{'20':1});
  assert.equal(payload.summary.cityStats.hangzhou.lives,1);
});

test('compact summaries 合并后仍保留精确年龄中位数和城市统计',()=>{
  const a=balance.summarizeBalance([life(20,'hangzhou',20,4),life(40,'shanghai',40,8)]);
  const b=balance.summarizeBalance([life(30,'hangzhou',30,6),life(50,'shanghai',50,10)]);
  const merged=balance.mergeSummaries([a,b]);
  assert.equal(merged.lives,4);
  assert.equal(merged.years,140);
  assert.equal(merged.choices,28);
  assert.equal(merged.age.median,35);
  assert.deepEqual(merged.ageCounts,{'20':1,'30':1,'40':1,'50':1});
  assert.equal(merged.cityStats.hangzhou.lives,2);
  assert.equal(merged.cityStats.hangzhou.meanAge,25);
  assert.equal(merged.cityStats.hangzhou.medianAge,25);
  assert.equal(merged.cityStats.hangzhou.choiceRatio,10/50);
});

test('balance workflows 使用 gate、8×125 shards、失败精查与 always artifact',()=>{
  for(const path of ['.github/workflows/balance-0-to-5000-latest.yml','.github/workflows/balance-5000-to-10000.yml']){
    const text=fs.readFileSync(path,'utf8');
    assert.match(text,/\bgate:\s/);
    assert.match(text,/npm test/);
    assert.match(text,/npm run build/);
    assert.match(text,/shard:\s*\[0,1,2,3,4,5,6,7\]/);
    assert.doesNotMatch(text,/shard:\s*\[0,1,2,3,4,5,6,7,8/);
    assert.match(text,/COUNT:\s*'125'/);
    assert.match(text,/diagnose-balance-choice\.mjs/);
    assert.match(text,/INPUT:/);
    assert.match(text,/if:\s*always\(\)/);
  }
});

test('诊断脚本支持从 fast scan 失败列表读取种子',()=>{
  const text=fs.readFileSync('scripts/diagnose-balance-choice.mjs','utf8');
  assert.match(text,/process\.env\.INPUT/);
  assert.match(text,/failedSeeds/);
});
