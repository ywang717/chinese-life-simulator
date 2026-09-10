# Balance Seed Speed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提高大规模种子验证吞吐量，同时保留 100% seed 覆盖和失败复现能力。

**Architecture:** shard 只输出可合并 summary 与失败 seed 列表，不再持久化逐人生 `lives`。聚合器直接合并 summary；GitHub Actions 用 8×125 shards，并在单独 gate job 中只运行一次测试与构建。失败 shard 在同一 runner 内只重跑失败 seeds 生成详细诊断。

**Tech Stack:** Node.js 22, node:test, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-09-10-balance-seed-speed-design.md`

## Global Constraints
- 不改变游戏 RNG、事件概率和事件选择逻辑。
- 每批 1000 seeds 必须 100% 扫描。
- 失败 seed 必须保留 seed/index/city 并可重跑。
- 改动只涉及 balance scripts/tests/workflows。

---

### Task 1: Compact shard summary and throughput

**Files:**
- Modify: `scripts/balance-lib.mjs`
- Modify: `scripts/balance-shard.mjs`
- Create: `tests/balance-speed.test.js`

**Interfaces:**
- Produces: `summarizeBalance(lives)` 增加可跨 shard 精确合并的 `ageCounts`、`cityStats`。
- Produces: shard JSON `{summary,failedSeeds}`，不含 `lives`。

- [ ] **Step 1: Write failing tests**：断言 summary 带 ageCounts/cityStats；断言 compact shard contract 不要求 lives。
- [ ] **Step 2: Verify RED**：运行 `node --test tests/balance-speed.test.js`，应因字段/接口缺失失败。
- [ ] **Step 3: Minimal implementation**：扩展 balance-lib；balance-shard 捕获单 seed 异常、累计失败、输出 elapsed/throughput。
- [ ] **Step 4: Verify GREEN**：运行 targeted test。
- [ ] **Step 5: Commit**。

### Task 2: Summary aggregation and failure-only diagnosis

**Files:**
- Modify: `scripts/balance-aggregate.mjs`
- Modify: `scripts/diagnose-balance-choice.mjs`
- Modify: `tests/balance-speed.test.js`

**Interfaces:**
- Consumes: shard `{summary,failedSeeds}`。
- Produces: exact merged summary and diagnostic exit failure only when failed seeds exist.

- [ ] **Step 1: Write failing tests**：两个 compact summaries 合并后 lives/years/age median/city stats 正确；failedSeeds 可传给诊断器。
- [ ] **Step 2: Verify RED**。
- [ ] **Step 3: Minimal implementation**：aggregate 读取 summary；diagnose 支持 `INPUT=<shard.json>` 并只重跑 failedSeeds。
- [ ] **Step 4: Verify GREEN**。
- [ ] **Step 5: Commit**。

### Task 3: Actions runner reduction

**Files:**
- Modify: `.github/workflows/balance-0-to-5000-latest.yml`
- Modify: `.github/workflows/balance-5000-to-10000.yml`
- Modify: `tests/balance-speed.test.js`

**Interfaces:**
- 每 1000 seeds: matrix shards `[0..7]`, `COUNT=125`。
- 单独 `gate` job 执行 `npm test` 与 `npm run build`。
- shard fast scan 后仅在失败时执行 detailed diagnostic；artifact 使用 `if: always()`。

- [ ] **Step 1: Write failing static workflow tests**：断言 8 shards、COUNT=125、gate、diagnostic、always artifact。
- [ ] **Step 2: Verify RED**。
- [ ] **Step 3: Update both workflows**。
- [ ] **Step 4: Run targeted and full tests/build**。
- [ ] **Step 5: Commit and inspect workflow run throughput**。