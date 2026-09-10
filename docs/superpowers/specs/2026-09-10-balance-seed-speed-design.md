# Balance Seed Speed Design

## Goal
在不减少种子数量、不改变 RNG、事件概率或平衡判定标准的前提下，提高 0–10000 种子批量验证速度，并让失败种子更快定位。

## Approved approach
1. 每 1000 seeds 从 20×50 shards 改为 8×125 shards，减少 runner 初始化、checkout、Node setup 和 artifact 次数。
2. shard 默认走 fast scan：遍历全部 seeds，成功种子只累计汇总数据，不写逐人生结果；失败 seed 只记录 seed/index/city/error。
3. fast scan 结束输出 `Seeds / Elapsed / Throughput / Failed`。
4. 失败时只对失败 seeds 做 detailed diagnostic，输出 pending event、option、职业/教育/信用/标签等上下文。
5. `npm test` 与 `npm run build` 放到单独 gate job，只执行一次；batch jobs 只负责 seeds。
6. checkpoint 从 shard summary 合并，不依赖完整 `lives` 数组；保留原有 choice ratio、分类占比、事件计数、城市统计、死亡校验等指标。
7. 不引入 worker_threads；先优化 runner 编排和 I/O。

## Constraints
- 玩家游戏逻辑和 RNG 不变。
- 100% 扫描全部 seeds，不抽样。
- 失败 seed 必须可复现、可单独诊断。
- 改动限定在 balance scripts/tests/workflows。