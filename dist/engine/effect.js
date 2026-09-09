import {remember,memoryTypes} from './memory.js';
import {draw,probability} from './probability.js';
import {cityById,cities} from '../data/cities.js';
import {careerById,eligible} from '../data/careers.js';
import {salaryFor,netWorth} from './finance.js';
export const at=(s,path)=>path.split('.').reduce((v,k)=>v?.[k],s);
const put=(s,path,value)=>{const p=path.split('.');let o=s;for(const k of p.slice(0,-1)){if(['__proto__','constructor','prototype'].includes(k))throw Error('无效状态字段');o=o[k];}o[p.at(-1)]=value;};
export function applyEffects(state,effects,source='年度变化'){
 const s=structuredClone(state);const run=e=>{
  const before=e.type==='stat'?s.stats[e.key]:e.type==='cash'?s.cash:e.path?structuredClone(at(s,e.path)):null;
  if(memoryTypes.has(e.type)){remember(s,e,source);if(e.type==='npc'&&s.partner?.id===e.id)s.partner.relationship=s.npcs.find(n=>n.id===e.id).relationship;}
  else switch(e.type){
   case 'set':put(s,e.path,structuredClone(e.value));break;
   case 'add':put(s,e.path,(at(s,e.path)??0)+e.value);break;
   case 'append':at(s,e.path).push(structuredClone(e.value));break;
   case 'echo':{s.echoUsage??={};s.echoUsage[e.key]=(s.echoUsage[e.key]??0)+1;break;}
   case 'stat':s.stats[e.key]+=e.value;break;
   case 'hidden':s.hidden[e.key]+=e.value;break;
   case 'hobby':s.hobbies[e.key]+=e.value;break;
   case 'personality':s.personality[e.key]+=e.value;break;
   case 'cash':s.cash+=Math.round(e.value);break;
   case 'income':s.salary+=Math.round(e.value);break;
   case 'credit':s.hidden.credit+=e.value;remember(s,{type:'social',kind:'信用',text:e.value<0?'信用受到影响':'信用有所恢复'},source);break;
   case 'aspiration':s.aspiration=e.value;remember(s,{type:'memory',text:'人生愿望改变为'+e.value},source);break;
   case 'note':if(s.frame)s.frame.notes.push(e.text);break;
   case 'roll':{const d=draw(s.rng);s.rng=d.rng;const score=e.score?e.score.reduce((sum,x)=>sum+(at(s,x.path)??0)*x.weight,e.offset??0):55;const chance=e.chance??probability(score,e.center??55);(d.value<chance?e.success:e.failure).forEach(run);break;}
   case 'migrate':{
    const target=e.city==='home'?s.birthCity:e.city==='partner'?s.partner?.city:e.city;if(!cities.some(c=>c.id===target))throw Error('目的城市不存在');if(target===s.city)break;
    const old=s.city;s.cityHistory.at(-1).endAge=s.age;s.city=target;s.cityHistory.push({city:target,startAge:s.age,endAge:null,reason:e.reason});s.cash-=5000+Math.round(cityById(target).cost*.15);s.familiarity=target===s.birthCity?75:20;s.adaptation=target===s.birthCity?1:3;s.stats.happiness-=5;
    if(s.career&&!s.retired)s.salary=salaryFor(s,careerById(s.career));
    for(const n of s.npcs)n.distance=n.city===target?'同城':'异地';for(const p of s.parents)p.distance=p.city===target?'同城':'异地';
    if(e.family&&s.partner)s.partner.city=target;s.children.forEach(c=>c.city=target);
    remember(s,{type:'count',key:'moves',value:1},source);remember(s,{type:'memory',text:`从${cityById(old).name}迁往${cityById(target).name}：${e.reason}`},source);run({type:'note',text:`迁居${cityById(target).name}，搬家支出已结算，原有房产保留。`});break;
   }
   case 'career':{
    if(e.id===null){if(s.careerHistory.length)s.careerHistory.at(-1).endAge=s.age;s.career=null;s.salary=0;s.careerLevel=0;break;}
    const c=careerById(e.id);if(!c||!eligible(s,c))throw Error('尚不满足这份职业的入职条件');
    if(s.career&&s.career!==c.id)remember(s,{type:'count',key:'careerChanges',value:1},source);
    if(s.careerHistory.length)s.careerHistory.at(-1).endAge=s.age;
    s.career=c.id;s.careerLevel=e.level??0;s.careerYears=0;s.salary=salaryFor(s,c);s.careerHistory.push({career:c.id,startAge:s.age,endAge:null,highest:s.careerLevel,city:s.city});remember(s,{type:'memory',text:'进入'+c.name+'行业'},source);break;
   }
   case 'level':{const c=careerById(s.career);if(!c)break;s.careerLevel=Math.max(0,Math.min(c.levels.length-1,s.careerLevel+e.value));s.salary=salaryFor(s,c);if(s.careerHistory.length)s.careerHistory.at(-1).highest=Math.max(s.careerHistory.at(-1).highest,s.careerLevel);break;}
   case 'retire':s.retired=true;if(s.careerHistory.length)s.careerHistory.at(-1).endAge=s.age;remember(s,{type:'memory',text:'结束全职工作，开始退休生活'},source);break;
   case 'property':{
    if(e.action==='buy'){const price=cityById(s.city).house,deposit=Math.round(price*.3);if(s.cash<deposit||s.hidden.credit<50||s.age<18)throw Error('首付或信用暂不满足购房条件');s.cash-=deposit;s.properties.push({id:'house'+s.age+'-'+s.properties.length,city:s.city,value:price,loan:price-deposit,annualPrincipal:Math.round((price-deposit)/25),rented:false,boughtAge:s.age});remember(s,{type:'memory',text:'购置房产'},source);}
    else {const p=s.properties.find(p=>p.id===e.id)??s.properties[0];if(!p)throw Error('没有可操作的房产');if(e.action==='sell'){s.cash+=Math.round(p.value*.98-p.loan);s.properties=s.properties.filter(x=>x.id!==p.id);}else if(e.action==='rent')p.rented=!p.rented;else if(e.action==='repay'){const amount=Math.min(Math.max(0,s.cash),p.loan);s.cash-=amount;p.loan-=amount;}}
    break;
   }
   case 'invest':{const amount=e.amount??Math.round(Math.max(0,s.cash)*.2);if(e.action==='withdraw'){const v=Math.min(amount,s.investments[e.key]);s.cash+=v;s.investments[e.key]-=v;}else{if(s.cash<amount||amount<0)throw Error('可用现金不足');s.cash-=amount;s.investments[e.key]+=amount;if(e.key==='venture')remember(s,{type:'schedule',eventId:'venture_result',after:5},source);}break;}
   case 'startup':{
    if(s.cash<60000||s.age<18)throw Error('创业资金不足');run({type:'career',id:'founder'});s.salary=0;s.cash-=60000;s.company+=60000;s.businessType=cityById(s.city).industries[0];remember(s,{type:'count',key:'startups',value:1},source);remember(s,{type:'schedule',eventId:'startup_result',after:2},source);break;
   }
   case 'gamble':{
    if(s.age<21)throw Error('未达到娱乐场适龄要求');const stake=Math.max(e.level===1?500:5000,Math.round(Math.max(0,s.cash)*(e.level===1?.01:e.level===2?.12:e.level===3?.45:.8)));const d=draw(s.rng);s.rng=d.rng;const won=d.value<.32;run({type:'cash',value:won?stake*.8:-stake});run({type:'stat',key:'happiness',value:won?10:-12});run({type:'hidden',key:'gambling',value:won?15:5});run({type:'hidden',key:'addiction',value:e.level*6});remember(s,{type:'count',key:'gambles',value:1},source);remember(s,{type:'count',key:won?'wins':'losses',value:1},source);remember(s,{type:'tag',key:won?'赌博大赢记忆':'赌博亏损记忆'},source);
    if(s.partner)s.partner.relationship-=e.level*5;
    if(!won&&e.level>=2){run({type:'credit',value:-10});remember(s,{type:'schedule',eventId:'gamble_chase',after:1,priority:20},source);}
    if(s.cash<0){s.debt+=-s.cash;s.cash=0;remember(s,{type:'tag',key:'赌博负债'},source);remember(s,{type:'social',kind:'赌博债务',text:'赌博亏损形成债务'},source);s.hidden.professional-=5;}
    run({type:'note',text:won?'这一回赢了一些钱。那阵兴奋比钱本身留得更久。':'这次损失已经结算。离开后，你还在反复想那笔钱。'});break;
   }
   case 'partner':{
    if(e.action==='meet'){const d=draw(s.rng);s.rng=d.rng;s.partner={id:'partner'+s.age,name:d.value<.5?'林安宁':'陈知夏',age:s.age,city:e.city??(d.value<.5?s.city:'shanghai'),career:'teacher',income:60000,personality:'温和',relationship:60};s.relationshipStatus='恋爱';remember(s,{type:'npc',id:s.partner.id,name:s.partner.name,role:'朋友',data:{...s.partner}},source);}
    else if(e.action==='marry'&&s.partner){s.relationshipStatus=s.counts.marriages?'再婚':'已婚';remember(s,{type:'count',key:'marriages',value:1},source);s.cash-=15000;}
    else if(e.action==='divorce'&&s.partner){remember(s,{type:'npc',id:s.partner.id,role:'前任',value:-20},source);const n=s.npcs.find(n=>n.id===s.partner.id);if(n)n.role='前任';s.partner=null;s.relationshipStatus='离婚';s.stats.happiness-=15;}
    else if(s.partner)s.partner.relationship+=e.value??0;break;
   }
   case 'child':s.children.push({name:s.name[0]+['小满','小禾','小雨'][s.children.length%3],age:0,city:s.city});remember(s,{type:'count',key:'children',value:1},source);s.stats.happiness+=10;break;
   case 'club':if(!s.clubs.includes(e.name)){s.clubs.push(e.name);run({type:'hobby',key:e.hobby,value:15});run({type:'hidden',key:e.ability,value:3});remember(s,{type:'npc',id:'club_'+e.name,name:'周予安',role:'同学',value:15},source);remember(s,{type:'tag',key:e.name==='电竞社'?'竞技经历':e.name==='骑行社'?'骑行赛事经历':'社团经历'},source);}break;
   case 'education':s.education=e.level;s.major=e.major??s.major;s.schoolHistory.push({age:s.age,city:s.city,text:e.text});remember(s,{type:'memory',text:e.text},source);break;
   case 'qualification':if(!s.qualifications.includes(e.id))s.qualifications.push(e.id);remember(s,{type:'social',kind:'职业资格',text:careerById(e.id).name+'相关资格通过'},source);break;
   case 'settleDebt':{const v=Math.min(Math.max(0,s.cash),s.debt);s.cash-=v;s.debt-=v;if(s.debt===0){remember(s,{type:'tag',key:'赌博负债',remove:true},source);run({type:'credit',value:10});}break;}
   default:throw Error('无法识别的状态变化');
  }
  if(['stat','hidden','hobby','cash','income','credit','personality','set','add','invest','property','level'].includes(e.type)&&!['audit','debugLogs','frame','history','pending'].some(p=>e.path?.startsWith(p)))s.audit.push({age:s.age,source,effect:structuredClone(e),before,after:e.type==='stat'?s.stats[e.key]:e.type==='cash'?s.cash:e.path?structuredClone(at(s,e.path)):null});
 };
 effects.forEach(run);if(s.partner){const n=s.npcs.find(n=>n.id===s.partner.id);if(n){n.city=s.partner.city;n.age=s.partner.age;n.relationship=s.partner.relationship;n.distance=n.city===s.city?'同城':'异地';}}if(!Number.isFinite(netWorth(s)))throw Error('财富结算出现异常，请重试');return s;
}
