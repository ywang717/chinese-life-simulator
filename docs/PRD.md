# V0.1 验收对照

以本项目会话中用户确认的完整 PRD 为需求依据，本文是源码导航，不重新定义产品。

| 要求 | 实现 |
| --- | --- |
| 全中文、手机优先、纯文字 | `dist/app.js`、`dist/style.css`、`dist/data/catalog.js` |
| 状态、年度、效果、长期记忆 | `dist/state/player.js`、`dist/engine/` |
| 13 城市、21 职业、父母、爱好与天赋 | `dist/data/cities.js`、`dist/data/careers.js`、`dist/state/player.js` |
| 教育、社团、资格、人物关系与职业机会 | `dist/data/events.js`、`dist/engine/event.js` |
| 硬条件、软概率、冷却、类别抑制、预约 | `dist/engine/event.js`、`dist/engine/probability.js` |
| 迁居、成本、城市履历、原房产保留 | `dist/engine/effect.js`、`dist/engine/finance.js` |
| 工资、副业、转行、投资、创业、房贷与赌博 | `dist/engine/effect.js`、`dist/engine/event.js` |
| 家庭、健康、衰老、死亡 | `dist/engine/year.js` |
| 本地存档、检查点、一次倒流、历史 | `dist/state/storage.js`、`dist/app.js` |
| 多维人生报告与中文称号 | `dist/engine/report.js` |
| 七条重点因果路线 | `tests/routes.test.js` |
| 七座城市完整人生、选择比例 | `tests/lifetimes.test.js` |
| 数据/资格/退休顺延/预约等边界 | `tests/edge-cases.test.js` |

## 有意保留的第一阶段简化

- 107 条样例事件，未扩充到 500～700 条。
- 21 职业都有条件、等级、收入、风险、转行关联与工作事件；深度分支集中于指定七条路线。
- 继续教育、创业经营及金融模型均做低复杂度抽象；不做完整学制、企业管理或真实行情。
- 无登录、云存档、多人、地图、立绘、实时 AI、商城、支付与复杂家族继承。

## 验证边界

自动验证不是手机真机验收。当前覆盖引擎、完整人生抽样、关键路线、数据引用、存档结构和静态入口；已在桌面 Chrome 及 375 像素有效视口验证主要交互、刷新续档和回退。手机真机与 Safari 尚未验证。
