import test from 'node:test';import assert from 'node:assert/strict';
import {createPlayer} from '../dist/state/player.js';import {emptySave,updateSave,validateSave} from '../dist/state/storage.js';import {getReport} from '../dist/engine/report.js';
import {applyEffects} from '../dist/engine/effect.js';
test('完整存档包含检查点、历史与解锁，序列化不丢种子',()=>{let s=createPlayer({seed:'存档'});const save=updateSave(emptySave(),s,s);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(save))),save);s=applyEffects(s,[{type:'set',path:'dead',value:true}],'测试');const finished=updateSave(save,s);assert.equal(finished.past.length,1);assert.equal(updateSave(finished,s).past.length,1);assert.equal(updateSave(finished,{...s,dead:false}).past.length,0);});
test('不兼容存档不会静默重置',()=>{assert.throws(()=>validateSave({version:99}));});
test('中文报告没有空内部值且覆盖八类信息',()=>{const r=getReport(createPlayer({seed:'报告'}));assert.equal(r.sections.length,8);assert.equal(r.dimensions.length,6);for(const section of r.sections)for(const [k,v]of section.rows){assert.equal(typeof k,'string');assert.equal(typeof v,'string');assert.ok(!/undefined|null|health|careerLevel|currentCity/.test(v));}});
test('损坏的人物和检查点在读取时被拒绝',()=>{assert.throws(()=>validateSave({...emptySave(),current:{id:'a',version:1,history:[],rng:1}}));assert.throws(()=>validateSave({...emptySave(),checkpoint:{id:'a',pending:{}}}));});
