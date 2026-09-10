import fs from 'node:fs';
import path from 'node:path';
import {mergeSummaries} from './balance-lib.mjs';

const root=process.env.INPUT_DIR??'balance-results';
const output=process.env.OUT??'balance-summary.json';
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(/^balance-\d+\.json$/.test(entry.name))files.push(p);}}
walk(root);
if(!files.length)throw new Error('没有找到平衡测试分片结果');
const results=files.map(f=>JSON.parse(fs.readFileSync(f,'utf8'))),failedSeeds=results.flatMap(x=>x.failedSeeds??[]),summaries=results.map(x=>x.summary).filter(Boolean);
if(!summaries.length)throw new Error('没有找到可合并的平衡测试摘要');
const summary=mergeSummaries(summaries);
summary.continuityConfiguredRatio=summary.years?summary.continuityHits/summary.years:0;
summary.strongFollowUpRatio=summary.years?summary.strongFollowUps/summary.years:0;
summary.categoryRatios=Object.fromEntries(Object.entries(summary.categoryCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v/summary.years]));
summary.topEvents=Object.entries(summary.eventCounts).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([eventId,count])=>({eventId,count,ratio:count/summary.years}));
const warnings=[];
if(summary.choiceRatio<.15||summary.choiceRatio>.35)warnings.push(`关键选择比例异常 ${(summary.choiceRatio*100).toFixed(2)}%`);
if(summary.maxCategoryStreak>12)warnings.push(`同类事件最长连续 ${summary.maxCategoryStreak} 年`);
for(const [category,ratio] of Object.entries(summary.categoryRatios))if(ratio>.45)warnings.push(`${category} 类占比过高 ${(ratio*100).toFixed(2)}%`);
summary.warnings=warnings;
if(failedSeeds.length)throw new Error(`存在 ${failedSeeds.length} 个失败种子`);
if(!summary.allDead)throw new Error('存在 130 岁仍未结束的人生');
fs.writeFileSync(output,JSON.stringify({summary}));
console.log('BALANCE_SUMMARY '+JSON.stringify(summary));
