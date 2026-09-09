import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const css=await readFile(new URL('../dist/style.css',import.meta.url),'utf8');

test('普通年份不再渲染下一年按钮，并启用自动推进',()=>{
  assert.doesNotMatch(app,/button\('下一年','next','primary'\)/);
  assert.match(app,/scheduleAutoAdvance/);
});

test('年度经历使用纵向分页容器和滚动吸附',()=>{
  assert.match(app,/year-feed/);
  assert.match(app,/year-slide/);
  assert.match(css,/scroll-snap-type:\s*y mandatory/);
  assert.match(css,/scroll-snap-align:\s*start/);
});

test('关键选择和死亡状态会停止自动推进',()=>{
  assert.match(app,/s\.pending\s*\|\|\s*s\.dead/);
  assert.match(app,/cancelAutoAdvance/);
});
