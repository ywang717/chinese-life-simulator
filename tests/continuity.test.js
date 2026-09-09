import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';
import {materialize,continuityScore,candidates} from '../dist/engine/event.js';
import {applyEffects} from '../dist/engine/effect.js';
import {eventById} from '../dist/data/events.js';
import {validateSave} from '../dist/state/storage.js';

let continuityByEventId={};
try{({continuityByEventId}=await import('../dist/data/continuity.js'));}catch{}

const sameSeedName=name=>createPlayer({seed:'姓名连续性',city:'zhengzhou',name});
const employable=()=>{
  const s=createPlayer({seed:'求职连续性',city:'hangzhou'});
  s.age=26;s.education=5;s.major='通用';
  Object.keys(s.hidden).forEach(k=>s.hidden[k]=85);
  Object.keys(s.hobbies).forEach(k=>s.hobbies[k]=80);
  return s;
};
const historyRow=(eventId,age,category='职业',title=eventId)=>({age,year:2000+age,city:'hangzhou',eventId,category,title,text:title,choice:null,background:[],effects:[],key:false});
const followUpEvent=()=>({id:'synthetic_follow_up',title:'后续事件',text:'后来又发生了一件事。',category:'家庭',conditions:[],effects:[],options:[{text:'继续',effects:[]},{text:'停下',effects:[]}],followUpOf:['romance'],followUpMultiplier:3,echoText:'从{years}年前的“{title}”走到今天，'});
const romanceReady=()=>{const s=employable();s.relationshipStatus='恋爱';s.partner={id:'p',name:'林安宁',age:26,city:s.city,career:'teacher',income:60000,personality:'温和',relationship:70};return s;};
const marriageWeight=(years,used=0)=>{const s=romanceReady();s.age=40;s.history.push(historyRow('romance',40-years,'家庭','有人走近你的生活'));s.echoUsage={[`romance:${40-years}`]:used};return candidates(s).find(x=>x.event.id==='marriage')?.weight;};

test('自定义中文姓名让父亲跟随玩家姓氏，母亲保持独立随机姓氏',()=>{
  const wang=sameSeedName('王小明');
  const zhao=sameSeedName('赵小明');
  assert.ok(wang.parents[0].name.startsWith('王'));
  assert.ok(zhao.parents[0].name.startsWith('赵'));
  assert.equal(wang.parents[1].name,zhao.parents[1].name);
});

test('无法识别中文姓氏时父亲回退随机姓氏且人物仍可创建',()=>{
  const s=sameSeedName('John');
  assert.equal(s.name,'John');
  assert.match(s.parents[0].name,/^[王李张刘陈杨赵周徐孙]/);
});

test('新人物初始化轻量回声计数',()=>{
  const s=sameSeedName('王小明');
  assert.deepEqual(s.echoUsage,{});
});

test('旧版存档缺少 echoUsage 仍可读取并在首次回声时初始化',()=>{
  const old=sameSeedName('王小明');
  delete old.echoUsage;
  const save={version:1,current:old,checkpoint:null,past:[],unlocked:[]};
  assert.equal(validateSave(save).current.name,'王小明');
  const next=applyEffects(old,[{type:'echo',key:'romance:25'}],'兼容旧存档');
  assert.equal(next.echoUsage['romance:25'],1);
});

test('第一次求职与再次求职使用不同语义',()=>{
  const first=employable();
  const a=materialize(eventById('job_search'),first);
  assert.equal(a.title,'第一份工作的方向');
  const again=employable();
  again.careerHistory=[{career:'programmer',startAge:22,endAge:25,highest:1,city:'hangzhou'}];
  const b=materialize(eventById('job_search'),again);
  assert.equal(b.title,'重新寻找工作');
  assert.doesNotMatch(b.text,/第一份工作/);
  assert.match(b.text,/程序员/);
});

test('上一份职业的相邻转型进入再次求职前列但仍保留其他方向',()=>{
  const s=employable();
  s.careerHistory=[{career:'programmer',startAge:22,endAge:25,highest:1,city:'hangzhou'}];
  const e=materialize(eventById('job_search'),s);
  const names=e.options.slice(0,4).map(o=>o.text);
  assert.ok(names.some(n=>['产品经理','游戏策划'].includes(n)));
  assert.ok(new Set(names).size>1);
});

test('相关历史会提高连续性评分',()=>{
  const event={historyLinks:[{eventIds:['graduate'],within:3,add:50}]};
  const plain=employable();
  const linked=employable();linked.history.push(historyRow('graduate',25,'教育','毕业'));
  assert.equal(continuityScore(event,plain),0);
  assert.ok(continuityScore(event,linked)>=40);
});

test('缺少强前置经历时 followUpOf 事件不可物化',()=>{
  const s=employable();
  assert.equal(materialize(followUpEvent(),s),null);
  s.history.push(historyRow('romance',25,'家庭','有人走近你的生活'));
  const e=materialize(followUpEvent(),s);
  assert.ok(e);
  assert.match(e.text,/1年前/);
  assert.ok(e.options.every(o=>o.effects.some(x=>x.type==='echo'&&x.key==='romance:25')));
});

test('强回声使用三次后不再附加强回声消费',()=>{
  const s=employable();
  s.history.push(historyRow('romance',25,'家庭','有人走近你的生活'));
  s.echoUsage={'romance:25':3};
  const e=materialize(followUpEvent(),s);
  assert.ok(e);
  assert.ok(e.options.every(o=>!o.effects.some(x=>x.type==='echo')));
});

test('echo 效果递增对应历史回声次数',()=>{
  let s=employable();
  s=applyEffects(s,[{type:'echo',key:'romance:25'}],'测试回声');
  assert.equal(s.echoUsage['romance:25'],1);
});

test('强后续倍率随前置经历年份衰减，十年后不再享受强倍率',()=>{
  const near=marriageWeight(2),middle=marriageWeight(5),old=marriageWeight(9),veryOld=marriageWeight(12),spent=marriageWeight(12,3);
  assert.ok(near>middle&&middle>old&&old>veryOld,{near,middle,old,veryOld});
  assert.equal(veryOld,spent);
});

test('第一版二十到三十个关键事件声明人生连续性',()=>{
  const count=Object.keys(continuityByEventId).length;
  assert.ok(count>=20&&count<=30,count);
});

test('真实婚姻事件需要恋爱历史，且强回声耗尽后权重下降',()=>{
  const noHistory=romanceReady();
  assert.ok(!candidates(noHistory).some(x=>x.event.id==='marriage'));
  const fresh=romanceReady();fresh.history.push(historyRow('romance',25,'家庭','有人走近你的生活'));
  const freshWeight=candidates(fresh).find(x=>x.event.id==='marriage')?.weight;
  assert.ok(freshWeight>0);
  const spent=structuredClone(fresh);spent.echoUsage={'romance:25':3};
  const spentWeight=candidates(spent).find(x=>x.event.id==='marriage')?.weight;
  assert.ok(spentWeight>0&&freshWeight>spentWeight,{freshWeight,spentWeight});
});

test('近期迁居提高当前城市事件连续性，长期居住不会获得迁居加分',()=>{
  const settled=createPlayer({seed:'城市连续性',city:'hangzhou'});settled.age=30;
  const moved=structuredClone(settled);moved.cityHistory=[{city:'zhengzhou',startAge:0,endAge:29,reason:'出生与成长'},{city:'hangzhou',startAge:29,endAge:null,reason:'工作迁居'}];
  const event=eventById('city_hangzhou');
  assert.equal(continuityScore(event,settled),0);
  assert.ok(continuityScore(event,moved)>0);
});

test('连续性配置不会污染原始事件数据对象',()=>{
  assert.equal(Object.hasOwn(eventById('job_search'),'historyLinks'),false);
  assert.equal(Object.hasOwn(eventById('marriage'),'followUpOf'),false);
});

test('近期职业履历提高重新求职连续性，十年前职业不再加分',()=>{
  const recent=employable();recent.age=40;recent.careerHistory=[{career:'programmer',startAge:32,endAge:38,highest:1,city:'hangzhou'}];
  const old=employable();old.age=40;old.careerHistory=[{career:'programmer',startAge:20,endAge:25,highest:1,city:'hangzhou'}];
  const event=eventById('job_search');
  assert.ok(continuityScore(event,recent)>0);
  assert.equal(continuityScore(event,old),0);
});

test('可信 NPC 的近期共同经历提高老友事件连续性，没有共同经历则不加分',()=>{
  const linked=employable();linked.age=35;linked.npcs=[{id:'oldmate',name:'周予安',role:'同学',age:20,city:'hangzhou',career:'teacher',relationship:70,trust:70,experiences:[{age:31,text:'一起参加活动'}],alive:true}];
  const empty=structuredClone(linked);empty.npcs[0].experiences=[];
  const event=eventById('old_friend');
  assert.ok(continuityScore(event,linked)>0);
  assert.equal(continuityScore(event,empty),0);
});
