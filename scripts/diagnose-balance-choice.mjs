import {createPlayer} from '../dist/state/player.js';
import {advanceYear,choose} from '../dist/engine/year.js';

const cities=['nantong','hangzhou','shanghai','chengdu','wuhan','wenzhou','zhengzhou'];
const offset=Number(process.env.OFFSET??0),shard=Number(process.env.SHARD),count=Number(process.env.COUNT??50);
for(let i=0;i<count;i++){
  const index=offset+shard*count+i,city=cities[index%cities.length],seed=`平衡-${index}-${city}`;
  let s=createPlayer({seed,city});
  while(!s.dead&&s.age<130){
    s=advanceYear(s);
    if(s.pending){
      const option=(s.rng>>>0)%s.pending.options.length;
      try{s=choose(s,option);}catch(error){
        console.error('BALANCE_FAILURE '+JSON.stringify({
          offset,shard,index,seed,city,age:s.age,eventId:s.pending?.id??s.pending?.eventId,title:s.pending?.title,
          optionIndex:option,optionText:s.pending?.options?.[option]?.text,effects:s.pending?.options?.[option]?.effects,
          career:s.career,careerLevel:s.careerLevel,education:s.education,major:s.major,qualifications:s.qualifications,
          health:s.stats?.health,credit:s.hidden?.credit,tags:s.tags,careerHistory:s.careerHistory
        }));
        throw error;
      }
    }
  }
}
console.log(`offset ${offset} shard ${shard} no failure`);
