import fs from 'node:fs';
import path from 'node:path';
import {mergeSummaries} from './balance-lib.mjs';
import {applyCheckpointUpdate,createInitialProgress,balanceProgressConstants} from './balance-progress-lib.mjs';

const output=process.env.OUTPUT??'dist/balance-progress.json';
const checkpoint=Number(process.env.CHECKPOINT);
const explicitStatus=process.env.STATUS;
const inputDir=process.env.INPUT_DIR??'balance-results';
const nextCheckpoint=process.env.NEXT_CHECKPOINT?Number(process.env.NEXT_CHECKPOINT):null;

if(!checkpoint)throw new Error('CHECKPOINT 必须指定');

function readCurrent(){
  if(!fs.existsSync(output))return createInitialProgress();
  return JSON.parse(fs.readFileSync(output,'utf8'));
}

function walk(dir,files=[]){
  if(!fs.existsSync(dir))return files;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())walk(p,files);
    else if(/^balance-\d+\.json$/.test(entry.name))files.push(p);
  }
  return files;
}

function warningsFor(summary){
  const warnings=[];
  if(summary.scanned!==balanceProgressConstants.BATCH_SIZE)warnings.push(`扫描数量异常 ${summary.scanned}/${balanceProgressConstants.BATCH_SIZE}`);
  if(summary.choiceRatio!=null&&(summary.choiceRatio<.15||summary.choiceRatio>.35))warnings.push(`关键选择比例异常 ${(summary.choiceRatio*100).toFixed(2)}%`);
  if((summary.maxCategoryStreak??0)>12)warnings.push(`同类事件最长连续 ${summary.maxCategoryStreak} 年`);
  const years=summary.years??0;
  if(years){for(const [category,count] of Object.entries(summary.categoryCounts??{})){const ratio=count/years;if(ratio>.45)warnings.push(`${category} 类占比过高 ${(ratio*100).toFixed(2)}%`);}}
  return warnings;
}

function deriveUpdate(){
  if(explicitStatus==='running'||explicitStatus==='waiting')return {checkpoint,status:explicitStatus};
  const files=walk(inputDir);
  if(!files.length)throw new Error(`没有找到 ${inputDir} 中的分片结果`);
  const results=files.map(file=>JSON.parse(fs.readFileSync(file,'utf8')));
  const summaries=results.map(row=>row.summary).filter(Boolean);
  const failedSeeds=results.flatMap(row=>row.failedSeeds??[]);
  const summary=mergeSummaries(summaries);
  summary.warnings=warningsFor(summary);
  const complete=summary.scanned===balanceProgressConstants.BATCH_SIZE&&summary.failed===0&&failedSeeds.length===0&&summary.allDead;
  return {checkpoint,status:complete?'passed':'blocked',summary,failedSeeds};
}

const now=new Date().toISOString();
let progress=applyCheckpointUpdate(readCurrent(),deriveUpdate(),now);
if(nextCheckpoint&&progress.checkpoints.find(row=>row.checkpoint===checkpoint)?.status==='passed')progress=applyCheckpointUpdate(progress,{checkpoint:nextCheckpoint,status:'running'},now);
fs.writeFileSync(output,JSON.stringify(progress,null,2)+'\n');
console.log(`BALANCE_PROGRESS ${progress.completedSeeds}/${progress.targetSeeds} status=${progress.overallStatus} checkpoint=${progress.activeCheckpoint} failed=${progress.totalFailed} throughput=${progress.throughput.toFixed(2)}`);
