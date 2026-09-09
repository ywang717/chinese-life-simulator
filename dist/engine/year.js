import {applyEffects} from './effect.js';
import {draw,weighted} from './probability.js';
import {candidates,scheduledEvent,validScheduled,materialize} from './event.js';
import {eventById} from '../data/events.js';
import {annualFinance,netWorth} from './finance.js';
import {careerById} from '../data/careers.js';
import {cityById} from '../data/cities.js';
const set=(path,value)=>({type:'set',path,value}),add=(path,value)=>({type:'add',path,value});
const snap=s=>{const {debugLogs,audit,history,frame,...rest}=s;return structuredClone(rest);};
export function mortality(s){const ageRisk=.00012*Math.exp((s.age-25)/10);const healthRisk=1+Math.max(0,60-s.stats.health)/40;const illness=s.tags.includes('严重疾病')?1.7:1;const job=s.retired?0:(careerById(s.career)?.risk??0)*.004;return Math.min(1,ageRisk*healthRisk*illness+job+.00003);}
function closeYear(s,event,choiceText=null){
 const effects=s.audit.slice(s.frame.auditStart);const d=draw(s.rng);const dead=d.value<mortality(s);
 const row={age:s.age,year:s.birthYear+s.age,city:s.city,eventId:event.id,category:event.category,title:event.title,text:event.text,choice:choiceText,background:s.frame.notes,finance:s.frame.finance,effects:effects.filter(e=>['stat','cash','credit','income','hobby','hidden'].includes(e.effect.type)),key:!!event.options};
 s=applyEffects(s,[set('rng',d.rng),set('pending',null),set('dead',dead),set('deathReason',dead?(s.age>=75?'在晚年走完了这一生':s.tags.includes('严重疾病')?'因疾病离世':'因突发意外或健康原因离世'):''),{type:'append',path:'history',value:row},set('totals.peak',Math.max(s.totals.peak,netWorth(s))),add('totals.happiness',s.stats.happiness),add('totals.health',s.stats.health),add('totals.years',1)],'年末记录');
 if(s.dead){const cityHistory=structuredClone(s.cityHistory);cityHistory.at(-1).endAge=s.age;s=applyEffects(s,[set('cityHistory',cityHistory)],'人生终点');}
 if(s.debug){const log={age:s.age,start:s.frame.start,finance:s.frame.finance,candidates:s.frame.candidates,finalEvent:event.id,reasons:s.frame.reasons,choice:choiceText,effects:effects.map(e=>e.effect),longTerm:s.memories.filter(m=>m.age===s.age),end:snap(s)};s=applyEffects(s,[{type:'append',path:'debugLogs',value:log}],'开发记录');}
 return applyEffects(s,[set('frame',null)],'年度关闭');
}
export function advanceYear(state){
 if(state.dead)throw Error('这一生已经结束');if(state.pending)throw Error('请先完成当前选择');
 let s=applyEffects(state,[set('frame',{start:state.debug?snap(state):null,auditStart:state.audit.length,notes:[],finance:null,candidates:[],reasons:[]}),add('age',1)],'年龄增长');
 let d=draw(s.rng);const market=d.value<.2?'bear':d.value>.8?'bull':'normal';let h=draw(d.rng);
 s=applyEffects(s,[set('rng',h.rng),set('world',{market,housing:h.value<.2?'adjust':h.value>.75?'rise':'normal',year:s.birthYear+s.age})],'世界环境');
 const finance=annualFinance(s);s=applyEffects(s,[...finance.effects,set('frame.finance',finance.summary)],'年度财务结算');
 const natural=[{type:'stat',key:'health',value:s.age<30?.2:s.age<50?-.2:s.age<70?-1:-2},...Object.keys(s.hobbies).map(key=>({type:'hobby',key,value:-.3}))];
 if(s.career&&!s.retired){const effort={slack:[1,2,0],balanced:[0,0,2],hard:[-1,-1,4],extreme:[-3,-3,6]}[s.effort];natural.push({type:'stat',key:'health',value:effort[0]},{type:'stat',key:'happiness',value:effort[1]},{type:'hidden',key:'professional',value:effort[2]},add('careerYears',1));if(s.partner&&s.effort==='extreme')natural.push({type:'partner',value:-4});if(s.personality.workaholic>=15)natural.push({type:'hidden',key:'professional',value:1});}
 if(s.age<=18)for(const p of s.parents.filter(p=>p.alive))natural.push({type:'hobby',key:p.hobby,value:.8});
 if(s.sideJob)natural.push(add('sideJob.years',1),add('sideJob.income',6000),{type:'stat',key:'health',value:-.5},{type:'hobby',key:'内容创作',value:5});
 if(s.cash<0)natural.push({type:'credit',value:-2});
 s=applyEffects(s,natural,'人物自然变化');
 const family=[];
 s.parents.forEach((p,i)=>{if(!p.alive)return;family.push(add(`parents.${i}.age`,1),add(`parents.${i}.health`,p.age>65?-1.8:-.4));if(p.age+1===60)family.push(set(`parents.${i}.retired`,true),set(`parents.${i}.income`,Math.round(p.income*.4)),{type:'note',text:p.role+'退休了。'});family.push({type:'roll',chance:p.age>55?.035:.008,success:[add(`parents.${i}.health`,-15),{type:'note',text:p.role+'今年生了场病。'}],failure:[]});family.push({type:'roll',chance:Math.min(1,.0002*Math.exp((p.age-30)/10)*(1+Math.max(0,50-p.health)/30)),success:[set(`parents.${i}.alive`,false),set(`parents.${i}.income`,0),{type:'cash',value:p.estate},{type:'stat',key:'happiness',value:-20},{type:'memory',text:p.role+'去世，留下遗产'+p.estate+'元。'},{type:'note',text:p.role+'去世了。你整理了遗物，也接收了留下的财产。'}],failure:[]});});
 s.npcs.forEach((n,i)=>{if(!n.alive)return;family.push(add(`npcs.${i}.age`,1));if(n.age+1===25)family.push(set(`npcs.${i}.city`,'shanghai'),set(`npcs.${i}.career`,'sales'),set(`npcs.${i}.distance`,s.city==='shanghai'?'同城':'异地'));if(n.age>80)family.push({type:'roll',chance:.06,success:[set(`npcs.${i}.alive`,false),{type:'memory',text:n.name+'离世'}],failure:[]});});
 s.children.forEach((c,i)=>family.push(add(`children.${i}.age`,1)));
 if(s.partner){family.push(add('partner.age',1));if(s.partner.city!==s.city)family.push({type:'partner',value:-2});}
 s=applyEffects(s,family,'家庭与关系更新');
 s=applyEffects(s,[set('familiarity',Math.min(100,s.familiarity+15)),set('adaptation',Math.max(0,s.adaptation-1)),...(s.adaptation>0?[{type:'stat',key:'happiness',value:-1},{type:'note',text:'你还在熟悉这座城市，生活逐渐安顿下来。'}]:[])],'城市适应');
 s=applyEffects(s,[set('scheduled',s.scheduled.filter(q=>q.age>s.age||validScheduled(s,q)))],'清理失效预约');
 let selected=scheduledEvent(s);const pool=candidates(s);
 const milestone=pool.find(x=>x.event.milestone===s.age);if(selected&&milestone&&selected.event.id!==milestone.event.id)s=applyEffects(s,[{type:'schedule',eventId:milestone.event.id,after:1,ignoreAge:true,priority:30}],'顺延人生节点');
 if(!selected){selected=pool.find(x=>x.event.milestone===s.age);}
 if(!selected){const keys=pool.filter(x=>x.event.options),auto=pool.filter(x=>!x.event.options);const previous=s.history.filter(x=>x.key).length;const keyProbability=Math.min(.55,Math.max(.08,.2+(.25*s.age-previous)*.22));d=draw(s.rng);h=draw(d.rng);s=applyEffects(s,[set('rng',h.rng)],'事件随机抽取');const group=d.value<keyProbability&&keys.length?keys:auto;selected=weighted(group,h.value);}
 if(!selected)selected={event:materialize(eventById('quiet_year'),s),weight:1,reasons:['无匹配事件，日常兜底']};
 if(selected.scheduled)s=applyEffects(s,[set('scheduled',s.scheduled.filter(q=>!(q.eventId===selected.scheduled.eventId&&q.age===selected.scheduled.age)))],'处理预约');
 s=applyEffects(s,[set('frame.candidates',s.debug?pool.map(p=>({id:p.event.id,weight:p.weight,reasons:p.reasons})):[]),set('frame.reasons',selected.reasons)],'事件筛选');
 if(selected.event.options)return applyEffects(s,[set('pending',selected.event)],'等待人生选择');
 s=applyEffects(s,selected.event.effects,selected.event.title);return closeYear(s,selected.event);
}
export function choose(state,index){if(!state.pending)throw Error('当前没有待选事件');if(!Number.isInteger(index)||!state.pending.options[index])throw Error('请选择有效选项');const event=state.pending,o=event.options[index];let s=applyEffects(state,o.effects,event.title+'：'+o.text);s=applyEffects(s,[{type:'memory',text:'选择了：'+o.text}],'人生选择');return closeYear(s,event,o.text);}
export function rewind(state,checkpoint){if(state.rewindUsed)throw Error('本局时光倒流已经用过');if(!checkpoint?.pending||checkpoint.id!==state.id)throw Error('还没有可回退的关键选择');return applyEffects(checkpoint,[set('rewindUsed',true)],'时光倒流');}
