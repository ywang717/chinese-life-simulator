import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const exists=path=>fs.existsSync(new URL(`../${path}`,import.meta.url));
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('进度模型支持 100 个千种子 checkpoint 并计算十万目标完成度',async()=>{
  assert.equal(exists('scripts/balance-progress-lib.mjs'),true,'缺少 balance-progress-lib.mjs');
  const {createInitialProgress,applyCheckpointUpdate}=await import('../scripts/balance-progress-lib.mjs');
  const initial=createInitialProgress('2026-09-12T00:00:00.000Z');
  assert.equal(initial.targetSeeds,100000);
  assert.equal(initial.batchSize,1000);
  assert.equal(initial.checkpoints.length,100);
  assert.equal(initial.checkpoints.at(-1).checkpoint,100000);
  const running=applyCheckpointUpdate(initial,{checkpoint:1000,status:'running'},'2026-09-12T00:01:00.000Z');
  assert.equal(running.overallStatus,'running');
  const passed=applyCheckpointUpdate(running,{checkpoint:1000,status:'passed',summary:{scanned:1000,lives:1000,failed:0,elapsedMs:100000,throughput:10,allDead:true,warnings:[]},failedSeeds:[]},'2026-09-12T00:02:00.000Z');
  assert.equal(passed.completedSeeds,1000);
  assert.equal(passed.scannedSeeds,1000);
  assert.equal(passed.progressRatio,0.01);
  assert.equal(passed.activeCheckpoint,2000);
  assert.equal(passed.checkpoints[0].status,'passed');
});

test('失败 checkpoint 会阻断总体状态并保留失败种子',async()=>{
  assert.equal(exists('scripts/balance-progress-lib.mjs'),true,'缺少 balance-progress-lib.mjs');
  const {createInitialProgress,applyCheckpointUpdate}=await import('../scripts/balance-progress-lib.mjs');
  const progress=createInitialProgress('2026-09-12T00:00:00.000Z');
  const blocked=applyCheckpointUpdate(progress,{checkpoint:2000,status:'blocked',summary:{scanned:1000,lives:998,failed:2,elapsedMs:50000,throughput:20,allDead:false,warnings:['存在失败种子']},failedSeeds:[{index:1500,seed:'平衡-1500',city:'hangzhou'},{index:1501,seed:'平衡-1501',city:'shanghai'}]},'2026-09-12T00:02:00.000Z');
  assert.equal(blocked.overallStatus,'blocked');
  assert.equal(blocked.totalFailed,2);
  assert.equal(blocked.recentFailures.length,2);
  assert.equal(blocked.activeCheckpoint,2000);
});

test('看板页面包含总进度、checkpoint、失败种子和刷新入口',()=>{
  assert.equal(exists('dist/balance.html'),true,'缺少 balance.html');
  const html=read('dist/balance.html');
  for(const marker of ['data-role="total-progress"','data-role="checkpoint-list"','data-role="failed-seeds"','data-action="refresh"','./balance-dashboard.js'])assert.match(html,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('看板脚本只读取同源 progress JSON 并支持自动刷新',()=>{
  assert.equal(exists('dist/balance-dashboard.js'),true,'缺少 balance-dashboard.js');
  const js=read('dist/balance-dashboard.js');
  assert.match(js,/fetch\(['"]\.\/balance-progress\.json/);
  assert.match(js,/setInterval/);
  assert.doesNotMatch(js,/api\.github\.com|Authorization|token/i);
});

test('十万种子工作流接入进度脚本并按 10000 一段续跑',()=>{
  const path='.github/workflows/balance-10000-to-100000.yml';
  assert.equal(exists(path),true,'缺少 10000→100000 工作流');
  const yml=read(path);
  assert.match(yml,/feature\/balance-100k/);
  assert.match(yml,/scripts\/balance-progress\.mjs/);
  assert.match(yml,/contents:\s*write/);
  assert.match(yml,/10000/);
  assert.match(yml,/100000/);
});

test('fast scan 诊断不能提前终止 shard，失败应交给 checkpoint 记录并阻断',()=>{
  const js=read('scripts/diagnose-balance-choice.mjs');
  assert.doesNotMatch(js,/if\(fromFastScan\)throw new Error/);
  assert.match(js,/BALANCE_DIAGNOSTIC_SUMMARY/);
});
