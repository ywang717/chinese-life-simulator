# Life Continuity Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen life-history continuity without reducing route variety or breaking old saves.

**Architecture:** Extend the existing continuity scorer with time-decayed strong follow-ups plus dedicated city-history, career-history, and NPC-history sources. Keep event definitions data-driven, preserve scheduled-event priority, and stop mutating the global `events` dataset at module load.

**Tech Stack:** Native ES modules, Node `node:test`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-10-life-continuity-design.md`

## Global Constraints

- No runtime AI.
- Player-facing copy remains Chinese.
- Existing seven route tests and deterministic seeds must remain valid.
- Scheduled consequences remain higher priority than probabilistic continuity weighting.
- New continuity fields are optional; old saves without `echoUsage` must remain playable.

---

### Task 1: Lock old-save compatibility

**Files:**
- Modify: `tests/continuity.test.js`

**Interfaces:**
- Consumes: `validateSave(save)`, `applyEffects(state,effects,source)`.
- Produces: regression coverage proving a version-1 player without `echoUsage` still validates and initializes the counter on first echo.

- [ ] Add a regression test that creates a player, deletes `echoUsage`, validates a save containing it, applies one `echo` effect, and asserts the key becomes `1`.
- [ ] Run `node --test tests/continuity.test.js`; this test is expected to pass immediately because compatibility already exists. Treat it as characterization coverage; do not change production code for this task.
- [ ] Commit the test.

### Task 2: Add time decay to strong follow-ups

**Files:**
- Modify: `tests/continuity.test.js`
- Modify: `dist/engine/event.js`

**Interfaces:**
- Consumes: `followUpOf`, `followUpMultiplier`, `echoUsage`.
- Produces: effective multiplier tiers: age 0–3 = full multiplier, 4–7 = half of the bonus above 1, 8–10 = 15% of the bonus above 1, >10 = 1. Strong echo consumption only happens while multiplier >1.

- [ ] Add a failing test using the real `marriage` event with romance history at 2, 5, 9, and 12 years ago; assert candidate weights strictly decline and the 12-year case has no strong multiplier advantage over an exhausted echo.
- [ ] Run `node --test tests/continuity.test.js` and confirm RED because current strong follow-up multiplier ignores age.
- [ ] Implement one helper in `dist/engine/event.js` that calculates the age-decayed multiplier and reuse it both in candidate weighting and echo consumption.
- [ ] Re-run the focused test to GREEN.
- [ ] Commit.

### Task 3: Add city-history continuity and remove global event mutation

**Files:**
- Modify: `tests/continuity.test.js`
- Modify: `dist/engine/event.js`
- Modify: `dist/data/continuity.js`

**Interfaces:**
- Produces: optional `cityHistoryLinks: [{within,add}]` rules; city-category events receive a default recent-move rule without modifying raw `events` objects.
- `continuityScore(event,state)` must work when passed raw `eventById(...)` output.

- [ ] Add failing tests: a player who moved to the current city one year ago scores higher for that city's `city_<id>` event than a lifelong resident; importing `event.js` does not permanently add continuity fields to raw `events` entries.
- [ ] Run focused tests and confirm RED.
- [ ] Add a pure `configuredEvent(event)` merge helper that combines raw event + `continuityByEventId[event.id]` + implicit city defaults; remove the module-level `Object.assign` loop.
- [ ] Extend `continuityScore` to read recent `cityHistory` entries excluding the birth entry and apply the existing 1–3 / 4–10 year decay.
- [ ] Re-run focused tests to GREEN.
- [ ] Commit.

### Task 4: Add career-history and NPC-history continuity

**Files:**
- Modify: `tests/continuity.test.js`
- Modify: `dist/engine/event.js`
- Modify: `dist/data/continuity.js`

**Interfaces:**
- Produces: `careerHistoryLinks: [{within,add,careerIds?}]` and `npcLinks: [{within,add,minTrust?,roles?,careerIds?}]`.
- Career recency uses `endAge ?? startAge`; NPC recency uses the most recent matching `npc.experiences[].age`.

- [ ] Add failing tests showing a recent ended career boosts `job_search` continuity but a career ending >10 years ago does not; a trusted NPC with a recent shared experience boosts `old_friend`, while an NPC with no experiences does not.
- [ ] Run focused tests and confirm RED.
- [ ] Implement career/NPC source scoring in the shared `continuityScore` path.
- [ ] Replace broad `careerHistory.length` / `npcs.length` boosts in `continuity.js` with the new recency-aware rules for `job_search`, `external_offer`, `old_friend`, and `friend_business`.
- [ ] Re-run focused tests to GREEN.
- [ ] Commit.

### Task 5: Full verification

**Files:**
- No production changes unless a regression is found.

- [ ] Run `npm test` in CI and require 0 failures.
- [ ] Run `npm run build` and require exit 0.
- [ ] Confirm seven-city lifetime route test remains continuous and key-choice ratio remains within its existing accepted range.
- [ ] Compare this branch against `feature/life-continuity` and review only changed functional files for unintended scope expansion.
