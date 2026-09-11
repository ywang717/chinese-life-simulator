import test from 'node:test';
import assert from 'node:assert/strict';
import * as random from '../dist/engine/probability.js';
test('非安全来源无随机标识接口时仍可生成出生种子',()=>{
 assert.equal(typeof random.generateSeed,'function');
 const cryptoApi={getRandomValues(array){array.set([1,2,3,4]);return array;}};
 assert.equal(random.generateSeed(cryptoApi),'1-2-3-4');
});
