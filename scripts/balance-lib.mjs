const sum=(xs)=>xs.reduce((a,b)=>a+b,0);
const mergeCounts=(rows,key)=>rows.reduce((out,row)=>{for(const [k,v] of Object.entries(row[key]??{}))out[k]=(out[k]??0)+v;return out;},{});
const median=(xs)=>{if(!xs.length)return 0;const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
export function summarizeBalance(lives){
 const years=sum(lives.map(x=>x.years??0)),choices=sum(lives.map(x=>x.choices??0)),ages=lives.map(x=>x.age??0);
 return {
  lives:lives.length,years,choices,choiceRatio:years?choices/years:0,
  age:{mean:lives.length?sum(ages)/lives.length:0,median:median(ages),min:lives.length?Math.min(...ages):0,max:lives.length?Math.max(...ages):0},
  categoryCounts:mergeCounts(lives,'categories'),eventCounts:mergeCounts(lives,'eventCounts'),
  continuityHits:sum(lives.map(x=>x.continuityHits??0)),strongFollowUps:sum(lives.map(x=>x.strongFollowUps??0)),
  cityHits:sum(lives.map(x=>x.cityHits??0)),careerHits:sum(lives.map(x=>x.careerHits??0)),npcHits:sum(lives.map(x=>x.npcHits??0)),
  maxCategoryStreak:lives.length?Math.max(...lives.map(x=>x.maxCategoryStreak??0)):0
 };
}
export function mergeSummaries(summaries){
 const pseudo=summaries.map(s=>({age:s.age?.mean??0,years:s.years,choices:s.choices,categories:s.categoryCounts,eventCounts:s.eventCounts,continuityHits:s.continuityHits,strongFollowUps:s.strongFollowUps,cityHits:s.cityHits,careerHits:s.careerHits,npcHits:s.npcHits,maxCategoryStreak:s.maxCategoryStreak}));
 const total=summarizeBalance(pseudo);total.lives=sum(summaries.map(s=>s.lives??0));if(total.lives){total.age.mean=sum(summaries.map(s=>(s.age?.mean??0)*(s.lives??0)))/total.lives;const mins=summaries.filter(s=>s.lives).map(s=>s.age.min),maxs=summaries.filter(s=>s.lives).map(s=>s.age.max);total.age.min=mins.length?Math.min(...mins):0;total.age.max=maxs.length?Math.max(...maxs):0;}return total;
}
