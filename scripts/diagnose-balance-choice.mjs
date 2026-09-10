import fs from 'node:fs';
import {createPlayer} from '../dist/state/player.js';
import {advanceYear,choose} from '../dist/engine/year.js';

const cities=['nantong','hangzhou','shanghai','chengdu','wuhan','wenzhou','zhengzhou'];
const input=process.env.INPUT,fromFastScan=Boolean(input),offset=Number(process.env.OFFSET??0),shard=Number(process.env.SHARD??0),count=Number(process.env.COUNT??50);
const failedSeeds=fromFastScan?(JSON.parse(fs.readFileSync(input,'utf8')).failedSeeds??[]):Array.from({length:count},(_,i)=>{const index=offset+shard*count+i,city=cities[index%cities.length];return {index,city,seed:`平衡-${index}-${city}`};});

if(fromFastScan&&!failedSeeds.length){console.log('BALANCE_DIAGNOSTIC no failed seeds');process.exit(0);}
let reproduced=0;
for(const row of failedSeeds){
 const {index,city,seed}=row;let s=createPlayer({seed,city}),option=null,phase='advanceYear';
 try{
  while(!s.dead&&s.age<130){
   phase='advanceYear';s=advanceYear(s);
   if(s.pending){phase='choose';option=(s.rng>>>0)%s.pending.options.length;s=choose(s,option);}
  }
  if(fromFastScan)console.error('BALANCE_DIAGNOSTIC_RECOVERED '+JSON.stringify({index,seed,city}));
 }catch(error){
  reproduced++;
  console.error('BALANCE_FAILURE '+JSON.stringify({
   phase,offset,shard,index,seed,city,age:s.age,eventId:s.pending?.id??s.pending?.eventId,title:s.pending?.title,
   optionIndex:option,optionText:option==null?null:s.pending?.options?.[option]?.text,effects:option==null?null:s.pending?.options?.[option]?.effects,
   career:s.career,careerLevel:s.careerLevel,retired:s.retired,education:s.education,major:s.major,qualifications:s.qualifications,
   health:s.stats?.health,credit:s.hidden?.credit,tags:s.tags,careerHistory:s.careerHistory,error:error instanceof Error?error.stack:String(error)
  }));
  if(!fromFastScan)throw error;
 }
}
if(fromFastScan){
 console.log(`BALANCE_DIAGNOSTIC_SUMMARY detected=${failedSeeds.length} reproduced=${reproduced}`);
 process.exit(0);
}
console.log(`offset ${offset} shard ${shard} no failure`);
