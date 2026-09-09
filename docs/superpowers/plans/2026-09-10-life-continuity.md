# Life Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让年度事件明显承接玩家过去的人生经历，同时修复自定义姓名父亲姓氏和重复求职“第一份工作”文案问题。

**Architecture:** 保留现有 `year -> event -> effect -> memory` 主循环，在 `event.js` 增加集中式连续性评分、强后续前置判断和动态求职物化；事件数据只通过可选元数据声明关联，不把历史逻辑散落到各事件。强回声通过新的轻量 `echoUsage` 状态计数，并由效果引擎统一递增，旧存档缺失该字段时按空对象处理。

**Tech Stack:** 原生 JavaScript ES modules、Node.js 22+、`node:test`、原生浏览器 IndexedDB。

**Spec:** `docs/superpowers/specs/2026-09-10-life-continuity-design.md`

## Global Constraints

- 所有面向玩家的文案使用简体中文，不泄漏内部字段。
- 不调用运行时 AI API。
- 不改变属性不封顶、固定种子随机、每年一个主事件、关键选择不能跳过等现有核心规则。
- 复用 `history / memories / tags / npcs / careerHistory / cityHistory / scheduled`，只增加轻量 `echoUsage`。
- 新连续性字段必须可选，旧存档缺失 `echoUsage` 时必须继续运行。
- 第一版只改 20～30 个高价值事件，不扩充大型事件图，不做无关重构。
- `dist/` 是源码并被 Git 跟踪。

---

### Task 1: 自定义姓名与父亲姓氏

**Files:**
- Modify: `dist/state/player.js`
- Create: `tests/continuity.test.js`

**Interfaces:**
- Consumes: `createPlayer({seed, city, gender, name, birthYear, debug})`
- Produces: 新人物状态包含 `echoUsage: {}`；可识别中文自定义姓名的第一个汉字成为父亲姓氏，母亲随机姓氏不受玩家姓氏强制影响。

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';

const sameSeedName=name=>createPlayer({seed:'姓名连续性',city:'zhengzhou',name});

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
```

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/continuity.test.js`
Expected: FAIL because custom Chinese name does not currently control the father surname and `echoUsage` does not exist.

- [ ] **Step 3: Implement minimal surname logic**

In `createPlayer`, always draw the original random surname first to preserve RNG consumption, then select the family surname:

```js
const randomSurname=pick(['王','李','张','刘','陈','杨','赵','周','徐','孙']);
const inputName=name.trim().slice(0,12);
const surname=/^[\u3400-\u9fff]/u.test(inputName)?inputName[0]:randomSurname;
```

Keep father generation using `surname`, mother generation using her existing independent surname pool. Use `inputName || surname + generatedGivenName` as final player name. Add `echoUsage:{}` to initial player state.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/continuity.test.js`
Expected: PASS for the three tests above.

- [ ] **Step 5: Commit**

```bash
git add dist/state/player.js tests/continuity.test.js
git commit -m "feat: align family surname with custom player name"
```

---

### Task 2: 动态求职语义与上一职业加权

**Files:**
- Modify: `dist/engine/event.js`
- Modify: `tests/continuity.test.js`

**Interfaces:**
- Consumes: `materialize(eventById('job_search'), state)` and `careerHistory`.
- Produces: `job_search` 初次求职标题固定为 `第一份工作的方向`；再次求职固定为 `重新寻找工作`；上一职业及其 `transitions` 参与岗位排序。

- [ ] **Step 1: Add failing tests**

```js
import {materialize} from '../dist/engine/event.js';
import {eventById} from '../dist/data/events.js';

const employable=()=>{
  const s=createPlayer({seed:'求职连续性',city:'hangzhou'});
  s.age=26;s.education=5;s.major='通用';
  Object.keys(s.hidden).forEach(k=>s.hidden[k]=85);
  Object.keys(s.hobbies).forEach(k=>s.hobbies[k]=80);
  return s;
};

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
```

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/continuity.test.js`
Expected: FAIL because `job_search` is currently hard-coded as “第一份工作的方向” and `scoredJobs()` ignores the previous career.

- [ ] **Step 3: Implement dynamic job materialization and ranking**

Update `scoredJobs(s)` with previous-career continuity:

```js
const previous=careerById(s.careerHistory.at(-1)?.career);
const continuity=c.id===previous?.id?18:previous?.transitions.includes(c.id)?28:0;
```

Add `continuity` to existing score without removing city, hobby, ability, parent, NPC or controversy terms.

Inside `case 'jobs'`:

```js
const previous=careerById(s.careerHistory.at(-1)?.career);
if(previous){
  out.title='重新寻找工作';
  out.text=`上一份${previous.name}工作结束后，你重新整理了履历。现在人在${C.name}，过去积累的经验仍有价值，但你也不想只按原来的路线继续走。你开始重新评估下一份工作的方向。`;
}else{
  out.title='第一份工作的方向';
}
```

Do not add “第一份工作” anywhere in returning-job copy.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test tests/continuity.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add dist/engine/event.js tests/continuity.test.js
git commit -m "fix: make repeated job searches context aware"
```

---

### Task 3: 连续性评分、强后续前置和回声计数

**Files:**
- Modify: `dist/engine/event.js`
- Modify: `dist/engine/effect.js`
- Modify: `tests/continuity.test.js`

**Interfaces:**
- Produces: `continuityScore(event,state): number` exported from `event.js`.
- Event metadata syntax:
  - `historyLinks: [{eventIds?: string[], category?: string, within?: number, add: number}]`
  - `memoryWeights: [{path: string, equals?: any, includes?: any, min?: number, truthy?: boolean, add: number}]`
  - `followUpOf: string[]`
  - `followUpMultiplier?: number` default `3`
  - `echoText?: string` supporting `{years}`, `{title}`, `{city}`.
- Effect syntax: `{type:'echo',key:'eventId:age'}` increments `state.echoUsage[key]`.

- [ ] **Step 1: Add failing tests for score and preconditions**

```js
import {candidates,continuityScore} from '../dist/engine/event.js';
import {applyEffects} from '../dist/engine/effect.js';

const historyRow=(eventId,age,category='职业',title=eventId)=>({age,year:2000+age,city:'hangzhou',eventId,category,title,text:title,choice:null,background:[],effects:[],key:false});

test('相关历史会提高连续性评分',()=>{
  const event={historyLinks:[{eventIds:['graduate'],within:3,add:50}]};
  const plain=employable();
  const linked=employable();linked.history.push(historyRow('graduate',25,'教育','毕业'));
  assert.equal(continuityScore(event,plain),0);
  assert.ok(continuityScore(event,linked)>=40);
});

test('缺少强前置经历时 followUpOf 事件不能进入候选池',()=>{
  const s=employable();
  s.relationshipStatus='恋爱';
  s.partner={id:'p',name:'林安宁',age:26,city:s.city,career:'teacher',income:60000,personality:'温和',relationship:70};
  assert.ok(!candidates(s).some(x=>x.event.id==='marriage'));
  s.history.push(historyRow('romance',25,'家庭','有人走近你的生活'));
  assert.ok(candidates(s).some(x=>x.event.id==='marriage'));
});

test('强回声使用三次后不再获得强倍率',()=>{
  const s=employable();
  s.relationshipStatus='恋爱';
  s.partner={id:'p',name:'林安宁',age:26,city:s.city,career:'teacher',income:60000,personality:'温和',relationship:70};
  s.history.push(historyRow('romance',25,'家庭','有人走近你的生活'));
  const fresh=candidates(s).find(x=>x.event.id==='marriage').weight;
  s.echoUsage={'romance:25':3};
  const spent=candidates(s).find(x=>x.event.id==='marriage').weight;
  assert.ok(fresh>spent);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/continuity.test.js`
Expected: FAIL because continuity metadata helpers and follow-up gating do not exist.

- [ ] **Step 3: Implement continuity helpers in `event.js`**

Add helpers with these exact rules:

```js
const historyMatches=(row,link)=>
  (!link.eventIds||link.eventIds.includes(row.eventId))&&
  (!link.category||link.category===row.category);

const stateRuleMatches=(s,rule)=>{
  const v=at(s,rule.path);
  if(rule.equals!==undefined)return v===rule.equals;
  if(rule.includes!==undefined)return v?.includes?.(rule.includes)??false;
  if(rule.min!==undefined)return Number(v)>=rule.min;
  if(rule.truthy!==undefined)return rule.truthy?!!v:!v;
  return false;
};

export function continuityScore(event,s){
  let score=0;
  for(const link of event.historyLinks??[]){
    const within=link.within??10;
    const row=s.history.slice().reverse().find(h=>s.age-h.age<=within&&s.age-h.age>=0&&historyMatches(h,link));
    if(row){
      const years=s.age-row.age;
      const decay=years<=3?1:Math.max(.4,1-(years-3)*.1);
      score+=(link.add??20)*decay;
    }
  }
  for(const rule of event.memoryWeights??[])if(stateRuleMatches(s,rule))score+=rule.add??0;
  return Math.min(90,score);
}
```

Add a `followUpContext(event,s)` helper that finds the latest history row whose `eventId` is in `followUpOf`, generates key `${eventId}:${age}`, reads `s.echoUsage?.[key]??0`, and returns `null` if no source exists.

In `materialize`, return `null` when `followUpOf` exists but no source history exists. If source usage is below 3, append `{type:'echo',key}` to every choice option or to auto-event effects. If `echoText` exists, prepend the rendered template using `{years}`, `{title}`, `{city}` from the matched source.

In `candidates`, after existing city/hobby weighting and before repeat penalties:

```js
const continuity=continuityScore(event,s);
if(continuity){weight+=continuity;reasons.push(`人生连续性 +${continuity.toFixed(1)}`);}
const follow=followUpContext(event,s);
if(follow&&follow.used<3){
  const multiplier=event.followUpMultiplier??3;
  weight*=multiplier;
  reasons.push(`明确后续 ×${multiplier}`);
}
```

- [ ] **Step 4: Add echo effect handling**

In `effect.js` switch:

```js
case 'echo':{
  s.echoUsage??={};
  s.echoUsage[e.key]=(s.echoUsage[e.key]??0)+1;
  break;
}
```

Do not add `echo` to visible audit output.

- [ ] **Step 5: Run tests to verify GREEN**

Run: `node --test tests/continuity.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add dist/engine/event.js dist/engine/effect.js tests/continuity.test.js
git commit -m "feat: add history-based event continuity scoring"
```

---

### Task 4: 给高价值事件加入连续性元数据

**Files:**
- Modify: `dist/data/events.js`
- Modify: `tests/continuity.test.js`

**Interfaces:**
- Consumes Task 3 metadata fields.
- Produces first-wave continuity for 27 existing events without adding new event IDs.

- [ ] **Step 1: Add metadata coverage test**

```js
import {events} from '../dist/data/events.js';

test('第一版至少二十个关键事件声明人生连续性',()=>{
  const linked=events.filter(e=>e.historyLinks?.length||e.followUpOf?.length||e.memoryWeights?.length);
  assert.ok(linked.length>=20,linked.length);
  assert.ok(linked.length<=30,linked.length);
});
```

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/continuity.test.js`
Expected: FAIL because current events do not yet declare those metadata fields.

- [ ] **Step 3: Add metadata to these 27 existing events**

Use the following declarations as the first-wave scope. Keep current hard conditions/effects unchanged unless the declaration below explicitly adds `followUpOf`.

```js
job_search: historyLinks graduate/layoff/game_cancel/injury_transition/startup_result/sport_retirement within 3 +45; memoryWeights careerHistory.length min 1 +20
promotion: historyLinks category 职业 within 3 +18
external_offer: historyLinks category 职业 within 3 +22
layoff: historyLinks career_controversy within 3 +20
side_job: historyLinks category 职业 within 3 +15
side_fulltime: followUpOf ['side_job'], multiplier 2.5
startup: historyLinks side_job/friend_business/invest_choice within 10 +24; memoryWeights counts.startups min 1 +12
startup_result: followUpOf ['startup','friend_business'], multiplier 3
old_friend: historyLinks school_primary/club_join/job_search within 10 +18; memoryWeights npcs.length min 1 +15
friend_business: historyLinks old_friend within 10 +30; memoryWeights npcs.length min 1 +15
romance: historyLinks old_friend/club_join/job_search within 10 +10
marriage: followUpOf ['romance'], multiplier 3, echoText '从{years}年前的“{title}”走到今天，'
child_plan: followUpOf ['marriage'], multiplier 2.5
marital_crisis: historyLinks marriage/child_plan/work_effort within 10 +24
parent_care: historyLinks family_dinner within 10 +10; memoryWeights parents.length min 1 +10
illness: historyLinks work_effort/career_controversy within 3 +12; memoryWeights personality.workaholic min 15 +12
treatment: followUpOf ['illness'], multiplier 3
checkup: followUpOf ['illness','treatment'], multiplier 2
ship_injury: historyLinks shipyard_work within 3 +20
recovery: followUpOf ['ship_injury','sports_injury'], multiplier 3
injury_transition: followUpOf ['ship_injury'], multiplier 3
game_hit: historyLinks game_work within 3 +25
game_cancel: historyLinks game_work/career_controversy within 3 +22
viral: historyLinks rapper_work/comedian_work/creator_work/media_work within 3 +25
fame_pressure: followUpOf ['viral'], multiplier 3
sport_retirement: historyLinks champion/sports_injury/esports_trial/cycling_trial within 10 +25
old_injury: historyLinks ship_injury/sports_injury/illness within 10 +25; memoryWeights tags includes 长期伤病 +15
```

Represent each item with the actual `historyLinks`, `followUpOf`, `followUpMultiplier`, `memoryWeights`, and optional `echoText` fields in the existing event `extra` object. Do not create duplicate events.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/continuity.test.js`
Expected: PASS with 20–30 linked events.

- [ ] **Step 5: Commit**

```bash
git add dist/data/events.js tests/continuity.test.js
git commit -m "feat: connect key life events to prior experiences"
```

---

### Task 5: 旧存档兼容、固定种子和完整人生回归

**Files:**
- Modify: `tests/continuity.test.js`
- Test existing: `tests/core.test.js`
- Test existing: `tests/routes.test.js`
- Test existing: `tests/lifetimes.test.js`
- Test existing: `tests/vertical-year-feed.test.js`

**Interfaces:**
- No new production interface.
- Confirms old states without `echoUsage` and current deterministic flow remain valid.

- [ ] **Step 1: Add backward-compatibility test**

```js
import {advanceYear} from '../dist/engine/year.js';

test('旧存档缺少 echoUsage 时仍可继续人生',()=>{
  let s=createPlayer({seed:'旧存档兼容',city:'zhengzhou'});
  delete s.echoUsage;
  s=advanceYear(s);
  if(s.pending){
    assert.ok(Array.isArray(s.pending.options));
  }else{
    assert.ok(s.history.length>=2);
  }
});
```

Keep the existing `固定种子复现人物和人生` test unchanged; it must still pass after the feature.

- [ ] **Step 2: Run focused tests**

Run:
```bash
node --test tests/continuity.test.js tests/core.test.js tests/routes.test.js
```
Expected: 0 failures.

- [ ] **Step 3: Run full suite**

Run:
```bash
npm test
```
Expected: 0 failures; seven-city lifetime choice ratio remains between `.20` and `.30`.

- [ ] **Step 4: Run build validation**

Run:
```bash
npm run build
```
Expected: exit code 0 with no broken module imports or page-resource errors.

- [ ] **Step 5: Review final diff**

Expected production-file scope:
- `dist/state/player.js`
- `dist/engine/event.js`
- `dist/engine/effect.js`
- `dist/data/events.js`

Expected test/doc scope:
- `tests/continuity.test.js`
- approved spec and this plan.

No changes to `dist/app.js`, `dist/style.css`, `dist/engine/year.js`, finance, report or storage should be necessary.

- [ ] **Step 6: Commit any final test-only changes**

```bash
git add tests/continuity.test.js
git commit -m "test: verify life continuity regressions"
```
