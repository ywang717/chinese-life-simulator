import fs from 'node:fs';
import {createPlayer} from '../dist/state/player.js';
import {advanceYear,choose} from '../dist/engine/year.js';
import {continuityByEventId} from '../dist/data/continuity.js';
import {createShardPayload} from './balance-lib.mjs';

const cities=['nantong','hangzhou','shanghai','chengdu','wuhan','wenzhou','zhengzhou'];
const shard=Number(process.env.SHARD??0),count=Number(process.env.COUNT??125),offset=Number(process.env.OFFSET??0);
const outPath=process.env.OUT??`balance-${shard}.json`;
const strongIds=new Set(Object.entries(continuityByEventId).filter(([,v])=>v.followUpOf?.length).map(([id])=>id));
const continuityIds=new Set(Object.keys(continuityByEventId));

function maxStreak(history){let max=0,cur=0,last=null;for(const h of history){if(h.category===last)cur++;else{last=h.category;cur=1;}if(cur>max)max=cur;}return max;}
function recentCityHit(s,h){if(!h.eventId?.startsWith('city_'))return false;const stay=s.cityHistory.findLast?.(x=>x.city===h.city)??[...s.cityHistory].reverse().find(x=>x.city===h.city);return !!stay&&h.age-stay.startAge<=3&&stay.startAge>0;}
function recentCareerHit(s,h){if(!['job_search','promotion','external_offer','layoff','side_job','startup'].includes(h.eventId))return false;return s.careerHistory.some(c=>c.startAge<=h.age&&(c.endAge==null||h.age-c.endAge<=5));}
function npcHit(s,h){return ['old_friend','friend_business','romance'].includes(h.eventId)&&s.npcs.some(n=>n.experiences?.some(e=>Math.abs(h.age-e.age)<=10));}

const started=performance.now(),lives=[],failedSeeds=[];
for(let i=0;i<count;i++){
 const index=offset+shard*count+i,city=cities[index%cities.length],seed=`平衡-${index}-${city}`;
 try{
  let s=createPlayer({seed,city});let choices=0;
  while(!s.dead&&s.age<130){s=advanceYear(s);if(s.pending){choices++;const option=(s.rng>>>0)%s.pending.options.length;s=choose(s,option);}}
  const categories={},eventCounts={};let continuityHits=0,strongFollowUps=0,cityHits=0,careerHits=0,npcHits=0;
  for(const h of s.history){categories[h.category]=(categories[h.category]??0)+1;eventCounts[h.eventId]=(eventCounts[h.eventId]??0)+1;if(continuityIds.has(h.eventId))continuityHits++;if(strongIds.has(h.eventId))strongFollowUps++;if(recentCityHit(s,h))cityHits++;if(recentCareerHit(s,h))careerHits++;if(npcHit(s,h))npcHits++;}
  lives.push({seed,city,age:s.age,years:s.history.length,choices,categories,eventCounts,continuityHits,strongFollowUps,cityHits,careerHits,npcHits,maxCategoryStreak:maxStreak(s.history),dead:s.dead});
 }catch(error){failedSeeds.push({index,seed,city,error:error instanceof Error?error.message:String(error)});}
}
const elapsedMs=Math.round(performance.now()-started),payload=createShardPayload(lives,failedSeeds,elapsedMs,{shard,count,offset});
fs.writeFileSync(outPath,JSON.stringify(payload));
console.log(`BALANCE_SCAN Seeds: ${payload.summary.scanned} | Elapsed: ${(elapsedMs/1000).toFixed(1)}s | Throughput: ${payload.summary.throughput.toFixed(2)} seeds/s | Failed: ${failedSeeds.length}`);
if(failedSeeds.length)console.log('BALANCE_FAILED_SEEDS '+JSON.stringify(failedSeeds.map(x=>({index:x.index,seed:x.seed,city:x.city}))));
