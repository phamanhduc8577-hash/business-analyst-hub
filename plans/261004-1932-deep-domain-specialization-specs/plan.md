---
title: "Deep Domain Specialization Specs"
description: "Roadmap to author master BA specifications across cutting-edge high-demand domains: Enterprise AI RAG, Crypto RWA Tokenization, and Smart WMS/TMS Logistics."
status: completed
priority: P1
effort: "17h"
tags: [domain-knowledge, specs, ai-rag, rwa-tokenization, logistics-wms, ears, bdd]
created: 2026-10-04
reviewed: 2026-10-04
---

# Deep Domain Specialization Master Plan

## Overview

Transform the Business Analyst Knowledge Hub into the definitive reference repository for deep-domain, high-complexity systems by adding 3 comprehensive master specifications:
1. **Enterprise AI Systems & Multi-Agent RAG** (Permission-aware Retrieval, Guardrails, Evaluation, SLAs)
2. **Crypto & Real-World Asset (RWA) Tokenization** (ERC-3643 Compliance, Proof of Reserve, Finality-aware Reconciliation)
3. **Smart Logistics & Automated WMS/TMS** (Allocation & Wave Picking, Cold Chain IoT Telemetry, Dispatch & e-POD)

Each specification strictly implements the repository's Principal BA standards defined in `.claude/skills/ai-business-analyst/SKILL.md`: 10-Point Risk Audit, EARS Functional Requirements, Executable Gherkin BDD Scenarios, Mermaid Diagrams, NFR/SLOs, Production Data Dictionary, and RTM.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Author Enterprise AI Systems & Multi-Agent RAG Specification | P1 |
| 2 | Author Crypto & Real-World Asset (RWA) Tokenization Specification | P1 |
| 3 | Author Smart Logistics & Automated WMS/TMS Master Specification | P2 |
| 4 | Integrate all new specs into VitePress, MCP Server, tests, README & SKILL references | P1 |

## Phases

| # | Phase | Status | Effort | Depends on |
|---|-------|--------|--------|------------|
| 1 | [Phase 1: AI Systems & Enterprise RAG Spec](./phase-01-ai-rag.md) | completed | 5h | – |
| 2 | [Phase 2: Crypto & RWA Tokenization Spec](./phase-02-crypto-rwa.md) | completed | 5h | – |
| 3 | [Phase 3: Smart Logistics & Automated WMS/TMS Spec](./phase-03-logistics-wms.md) | completed | 5h | – |
| 4 | [Phase 4: Integration, Tooling & Verification](./phase-04-integration-verification.md) | completed | 2h | 1, 2, 3 |

Phases 1–3 only create content files and can run in parallel. All edits to shared files (`.vitepress/config.mjs`, `mcp-server/index.js`, `mcp-server/test.js`, `README.md`, `SKILL.md`) are owned exclusively by Phase 4 to avoid merge conflicts.

## Spec Authoring Standard (applies to Phases 1–3)

Every master spec MUST follow this section skeleton (mirrors the SKILL.md 5-phase lifecycle and the structure of `docs/05-domain-knowledge/ecommerce-retail/CASE-STUDY-VIETNAM-PAYMENTS.md`):

| § | Section | Minimum content |
|---|---------|-----------------|
| 0 | Header & Purpose | Purpose blockquote, target jurisdiction(s), referenced standards |
| 1 | Business Context, KPIs & Scope | Measurable KPIs, In-Scope (MVP), explicit Non-Goals |
| 2 | 10-Point Risk & Failure Mode Audit | Table: `Risk Dimension \| Failure Scenario \| Mitigation \| Linked REQ-ID` — all 10 dimensions from SKILL.md |
| 3 | Visual Models | 4 Mermaid diagrams: `flowchart` (with reject branches), `sequenceDiagram` + `autonumber`, `stateDiagram-v2` (terminal states + guards), `erDiagram` (PK/FK, cardinality) |
| 4 | EARS Functional Requirements | ≥ 12 requirements, table format `REQ-ID \| Pattern \| Specification`, at least 1 of each supported pattern |
| 5 | Gherkin BDD | ≥ 6 scenarios: Happy Path, ≥ 1 `Scenario Outline` with `Examples`, ≥ 2 concurrency/timeout/chaos cases |
| 6 | NFR & SLOs | P50/P95/P99 latency, throughput, availability, RTO/RPO, security, cost (where relevant) |
| 7 | Production Data Dictionary | SKILL.md columns: `Field Name \| Data Type \| Nullability \| Default \| Validation Rule / Constraint \| Sensitive (PII/Secret)` |
| 8 | RTM | `BG-xx ➔ US-xx ➔ REQ-xx ➔ API Endpoint ➔ TC-xx` |
| 9 | Open Elicitation Questions | 3–5 hard stakeholder questions |
| 10 | Glossary & Cross-links | Links to related existing guides (no duplication) |

Authoring rules:
- **REQ-ID prefixes:** `REQ-RAG-nn`, `REQ-RWA-nn`, `REQ-WMS-nn` / `REQ-TMS-nn`; test cases `TC-RAG-nn`, etc.
- **EARS phrasing must be machine-checkable** by `validate_ears_requirement`: start the statement with `WHEN` / `WHILE` / `IF … , THEN` / `THE SYSTEM SHALL ALWAYS`, and use the literal subject `THE SYSTEM SHALL` (not "THE RAG SERVICE SHALL"). `WHERE` (Optional Feature) is only allowed if Phase 4 adds validator support (see Open Questions).
- **Avoid words penalized by `audit_prd_quality`** in prose: `fast`, `quick`, `secure`, `scalable`, `user-friendly`, `various`, `etc`, `as soon as possible`, `high traffic`, `handle errors`. Replace with quantified statements.
- **All numeric targets are proposed defaults** and must be labeled as such ("Proposed SLO — validate with stakeholders").
- **Language:** English (consistent with existing master specs). Vietnamese versions are out of scope for this plan.
- **Regulatory content is informational, not legal advice**; each regulation cited must include its identifier and effective date as verified at authoring time.

## Verification Gates (executed in Phase 4)

| Gate | Method | Pass condition |
|------|--------|----------------|
| G1 EARS | Extract every `REQ-*` statement, run through `validate_ears_requirement` | 100% `isValidEARS: true` |
| G2 PRD lint | Run `audit_prd_quality` on full spec text | Score ≥ 85 (🟢 Production-Ready) per spec |
| G3 Mermaid | Validate each spec with pinned `@mermaid-js/mermaid-cli` (temporary output, deleted after) | 0 parse errors |
| G4 Docs build | `npm run docs:build` | Exit 0 |
| G5 Links | Temporarily set `ignoreDeadLinks: false` and build (revert afterwards) | 0 dead links originating from new/edited pages |
| G6 MCP | `npm run test:mcp` with table-driven template test | All tests pass, incl. 3 new keys |
| G7 Skeleton | Manual checklist against the Spec Authoring Standard | All 11 sections present, minimum counts met |

## Success Criteria

- [x] 3 master domain specifications created under `docs/05-domain-knowledge/`, each complying with the Spec Authoring Standard.
- [x] Gates G1–G7 pass (now automated: `npm test`, `npm run docs:build`, CI Mermaid + OpenAPI steps).
- [x] `get_ba_template` resolves `enterprise_rag`, `rwa_tokenization`, `smart_wms_tms` (present in both `inputSchema.enum` and `TEMPLATE_MAP`).
- [x] New specs appear in the VitePress sidebar, README repository tree, and SKILL.md "Reference Standards".

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mermaid diagrams are not rendered on the docs site — VitePress has no Mermaid support by default and `vitepress-plugin-mermaid` is not installed | "Render cleanly" cannot be verified visually; readers see raw code blocks | **Resolved:** `vitepress-plugin-mermaid@2.0.17` + `mermaid@11.17.2` installed; headless-browser check rendered 14/14 spec diagrams |
| `ignoreDeadLinks: true` in config makes the build pass regardless of broken links | False "zero dead links" claim | **Resolved:** `ignoreDeadLinks: false` permanently; README `./LICENSE` link fixed |
| CI (`ci.yml`) only echoes file names; it does not validate Markdown, links, or Mermaid | Regressions not caught on PR | **Resolved:** CI runs MCP tests, `lint:specs`, CLI smoke test, strict docs build, Mermaid CLI on all docs, and Redocly lint (no longer masked by an `or true` fallback) |
| Fast-moving regulation (EU AI Act Digital Omnibus, Vietnam crypto pilot, MiCA) | Outdated/incorrect compliance statements | Cite identifier + effective date; verify at authoring time |
| Phase 3 scope (WMS + TMS + IoT + AGV) too broad for one spec | Shallow coverage | Explicit Non-Goals defined in Phase 3 |
| Parallel phases editing shared files | Merge conflicts | Shared-file edits centralized in Phase 4 |

## Open Questions (decide before Phase 4)

1. Add `WHERE <feature>, THE SYSTEM SHALL …` support to `validate_ears_requirement`? SKILL.md documents 5 EARS patterns but the validator (and README) only support 4. **Recommended: yes** (small change + 1 test).
2. Install `vitepress-plugin-mermaid` so diagrams render on the docs site? Adds a dev dependency and changes `config.mjs` to `withMermaid(...)`. **Recommended: separate follow-up plan.**
3. Keep the EARS/Mermaid verification script as a committed `npm run lint:specs`, or run it ad hoc and delete it? **Default: ad hoc.**
4. Bump package version (`package.json`, `bin/cli.js --version`, README npm badge are all hard-coded `1.0.0`) since npm ships `docs/`? **Default: leave to release process.**
5. Also register the existing but unmapped guides (`ECOMMERCE-RETAIL-SYSTEMS-GUIDE.md`, `TELECOM-SAAS-SYSTEMS-GUIDE.md`) as MCP template keys? **Default: yes, low cost.**

## Review Log

**2026-10-04 review** — changes vs. original draft:
- Added Phase 4 to own all shared-file edits, MCP test updates, and verification (previously no phase updated `mcp-server/test.js` although the plan required it; the `inputSchema.enum` was also not mentioned).
- Added a common Spec Authoring Standard: the original phases omitted the 10-Point Risk Audit, Scope/Non-Goals, NFR (RTO/RPO), RTM, and `erDiagram`/`flowchart`, although the plan claimed full adherence.
- Replaced unverifiable criteria ("zero dead links", "render cleanly") with executable gates.
- Corrected domain inaccuracies in each phase (see each phase's "Review Corrections" section).
- Re-estimated effort 12h ➔ 17h.

**2026-10-05 post-implementation review** — phases 1–4 were implemented, then hardened in three fix groups:
- **Group 1 (`7069fa2`):** Risk ➔ REQ links were positional (risk N ➔ REQ-N) in all 3 specs — relinked and added the missing REQs; RTM now traces every REQ and every scenario carries a `@TC-*` tag; RAG ACL default changed from `['PUBLIC']` to deny-by-default; RWA "12 block confirmations" replaced by finality-based indexing and impossible "revert + emit event" fixed; MCP server now returns JSON-RPC errors / `isError` results instead of hanging; test suite rewritten (no soft passes); VitePress home page and skill page added.
- **Group 2 (`de784c6`):** domain inconsistencies (state machines, token budgets, timelock vs emergency actions, redemption lifecycle, freeze excursions, sensor gaps, COD net reconciliation, ER cardinality), Vietnam PDP Law 91/2025/QH15, PII classification, clickable cross-references.
- **Group 3:** Mermaid rendering on the site, `plans/**` excluded from the site, strict dead-link builds, `audit_prd_quality` structural checks (REQ IDs, per-REQ EARS, RTM coverage, scenario depth, data dictionary, scope) shared with the new `npm run lint:specs`, real CI, OpenAPI template given security schemes so Redocly lint passes.
- **Open Questions:** Q1 done (WHERE pattern), Q2 done (plugin), Q3 changed to a committed `lint:specs`, Q5 done. Q4 (version bump) remains with the release process.
- **Final gate results:** 62 REQs in the 3 master specs valid EARS with matching labels; audit 100/100/100; 50 tagged scenarios; 34/34 Mermaid diagrams across `docs/` parse; 14/14 spec diagrams render in a headless browser; strict docs build passes; MCP tests 47/47.

<!-- slug: deep-domain-specialization-specs -->
