import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';
import {materialize,continuityScore,candidates} from '../dist/engine/event.js';
import {applyEffects} from '../dist/engine/effect.js';
import {eventById} from '../dist/data/events.js';

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
