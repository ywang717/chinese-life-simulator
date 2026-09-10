const sum=xs=>xs.reduce((a,b)=>a+b,0);
const mergeCounts=(rows,key)=>rows.reduce((out,row)=>{for(const [k,v] of Object.entries(row[key]??{}))out[k]=(out[k]??0)+v;return out;},{});
const addCounts=(target,source)=>{for(const [k,v] of Object.entries(source??{}))target[k]=(target[k]??0)+v;return target;};
const valueCounts=xs=>xs.reduce((out,value)=>{const key=String(value??0);out[key]=(out[key]??0)+1;return out;},{});
const medianFromCounts=(counts,total)=>{
 if(!total)return 0;
 const low=Math.floor((total-1)/2),high=Math.floor(total/2);let seen=0,a=0,b=0,gotA=false;
 for(const [raw,count] of Object.entries(counts??{}).map(([k,v])=>[Number(k),v]).sort((x,y)=>x[0]-y[0])){
  if(!gotA&&low<seen+count){a=raw;gotA=true;}
  if(high<seen+count){b=raw;break;}
  seen+=count;
 }
 return (a+b)/2;
};
const ageStats=(counts,total,ageSum)=>{const ages=Object.keys(counts??{}).map(Number).sort((a,b)=>a-b);return {mean:total?ageSum/total:0,median:medianFromCounts(counts,total),min:ages[0]??0,max:ages.at(-1)??0};};
const finalizeCity=row=>({
 lives:row.lives,ageSum:row.ageSum,ageCounts:row.ageCounts,years:row.years,choices:row.choices,
 meanAge:row.lives?row.ageSum/row.lives:0,medianAge:medianFromCounts(row.ageCounts,row.lives),choiceRatio:row.years?row.choices/row.years:0
});
const cityStatsFromLives=lives=>{
 const acc={};
 for(const life of lives){const city=life.city??'unknown',row=acc[city]??={lives:0,ageSum:0,ageCounts:{},years:0,choices:0};row.lives++;row.ageSum+=life.age??0;row.years+=life.years??0;row.choices+=life.choices??0;addCounts(row.ageCounts,{[String(life.age??0)]:1});}
 return Object.fromEntries(Object.entries(acc).map(([city,row])=>[city,finalizeCity(row)]));
};
export function summarizeBalance(lives){
 const years=sum(lives.map(x=>x.years??0)),choices=sum(lives.map(x=>x.choices??0)),ages=lives.map(x=>x.age??0),ageSum=sum(ages),ageCounts=valueCounts(ages);
 return {
  lives:lives.length,years,choices,choiceRatio:years?choices/years:0,ageSum,ageCounts,age:ageStats(ageCounts,lives.length,ageSum),cityStats:cityStatsFromLives(lives),
  categoryCounts:mergeCounts(lives,'categories'),eventCounts:mergeCounts(lives,'eventCounts'),
  continuityHits:sum(lives.map(x=>x.continuityHits??0)),strongFollowUps:sum(lives.map(x=>x.strongFollowUps??0)),
  cityHits:sum(lives.map(x=>x.cityHits??0)),careerHits:sum(lives.map(x=>x.careerHits??0)),npcHits:sum(lives.map(x=>x.npcHits??0)),
  maxCategoryStreak:lives.length?Math.max(...lives.map(x=>x.maxCategoryStreak??0)):0,allDead:lives.every(x=>x.dead)
 };
}
export function createShardPayload(lives,failedSeeds,elapsedMs,meta={}){
 const summary=summarizeBalance(lives),scanned=meta.count??lives.length+failedSeeds.length;
 Object.assign(summary,meta,{scanned,failed:failedSeeds.length,elapsedMs,throughput:elapsedMs?scanned/(elapsedMs/1000):0,allDead:failedSeeds.length===0&&summary.allDead});
 return {summary,failedSeeds};
}
export function mergeSummaries(summaries){
 const total={
  lives:sum(summaries.map(s=>s.lives??0)),years:sum(summaries.map(s=>s.years??0)),choices:sum(summaries.map(s=>s.choices??0)),
  ageSum:sum(summaries.map(s=>s.ageSum??(s.age?.mean??0)*(s.lives??0))),ageCounts:{},categoryCounts:{},eventCounts:{},
  continuityHits:sum(summaries.map(s=>s.continuityHits??0)),strongFollowUps:sum(summaries.map(s=>s.strongFollowUps??0)),cityHits:sum(summaries.map(s=>s.cityHits??0)),careerHits:sum(summaries.map(s=>s.careerHits??0)),npcHits:sum(summaries.map(s=>s.npcHits??0)),
  maxCategoryStreak:summaries.length?Math.max(...summaries.map(s=>s.maxCategoryStreak??0)):0,allDead:summaries.every(s=>s.allDead!==false),scanned:sum(summaries.map(s=>s.scanned??s.count??s.lives??0)),failed:sum(summaries.map(s=>s.failed??0)),elapsedMs:sum(summaries.map(s=>s.elapsedMs??0)),cityStats:{}
 };
 for(const s of summaries){addCounts(total.ageCounts,s.ageCounts);addCounts(total.categoryCounts,s.categoryCounts);addCounts(total.eventCounts,s.eventCounts);for(const [city,row] of Object.entries(s.cityStats??{})){const dst=total.cityStats[city]??={lives:0,ageSum:0,ageCounts:{},years:0,choices:0};dst.lives+=row.lives??0;dst.ageSum+=row.ageSum??(row.meanAge??0)*(row.lives??0);dst.years+=row.years??0;dst.choices+=row.choices??0;addCounts(dst.ageCounts,row.ageCounts);}}
 total.choiceRatio=total.years?total.choices/total.years:0;total.age=ageStats(total.ageCounts,total.lives,total.ageSum);total.cityStats=Object.fromEntries(Object.entries(total.cityStats).map(([city,row])=>[city,finalizeCity(row)]));total.throughput=total.elapsedMs?total.scanned/(total.elapsedMs/1000):0;
 return total;
}
