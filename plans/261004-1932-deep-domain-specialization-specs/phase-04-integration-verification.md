---
phase: 4
title: "Integration, Tooling & Verification"
status: completed
priority: P1
effort: "2h"
dependencies: [1, 2, 3]
---

# Phase 4: Integration, Tooling & Verification

## Overview
Single owner of all shared-file edits. Wires the 3 new specs into the docs site, MCP server, tests, and reference docs, then runs verification gates G1–G7 from [plan.md](./plan.md).

## Related Code Files
- Modify: `.vitepress/config.mjs` — sidebar section `🇻🇳 05. Domain Knowledge`
- Modify: `mcp-server/index.js` — `TOOLS[get_ba_template].inputSchema.properties.templateType.enum` **and** `TEMPLATE_MAP`
- Modify: `mcp-server/test.js` — table-driven template tests
- Modify: `README.md` — repository tree under `05-domain-knowledge/`
- Modify: `.claude/skills/ai-business-analyst/SKILL.md` — "Reference Standards in `docs/`" list
- (Optional, per Open Question 1) `mcp-server/index.js` + `README.md` — `WHERE` EARS pattern

## Implementation Steps
1. **VitePress sidebar:** add 3 entries to the Domain Knowledge section:
   - `Enterprise AI RAG & Multi-Agent` ➔ `/docs/05-domain-knowledge/ai-systems-rag/ENTERPRISE-RAG-MULTIAGENT-SPEC`
   - `RWA Tokenization (ERC-3643)` ➔ `/docs/05-domain-knowledge/crypto-web3-rwa/RWA-TOKENIZATION-SPEC`
   - `Smart WMS/TMS & Cold Chain` ➔ `/docs/05-domain-knowledge/logistics-supply-chain/SMART-WMS-TMS-SPEC`
   - Rename section label from `🇻🇳 05. Domain Knowledge` to `📚 05. Domain Knowledge` (content is no longer Vietnam-only).
2. **MCP server:** add `enterprise_rag`, `rwa_tokenization`, `smart_wms_tms` to both the `enum` and `TEMPLATE_MAP` (missing the `enum` makes the key invisible to MCP clients that validate input). Per Open Question 5, also add `ecommerce_retail` and `telecom_saas`.
3. **MCP tests:** the current `test.js` is a hard-coded id-chain. Add a table-driven step that, for every `TEMPLATE_MAP` key, calls `get_ba_template` and asserts (a) no error, (b) content contains a domain marker (e.g., `ERC-3643`, `groundedness`, `FEFO`). Also assert `enum` and `TEMPLATE_MAP` keys are identical. Update the tool-count assertion only if a tool is added.
4. **(Optional) WHERE pattern:** add `^WHERE\s+.+?,\s*THE\s+SYSTEM\s+SHALL\s+.+` to `validate_ears_requirement` and `auditPrdQuality`, plus 1 test; update README EARS list.
5. **README & SKILL.md:** add the 3 folders to the repository tree; add the 3 specs to SKILL.md reference list.
6. **Run gates:**
   - G1: extract all `REQ-(RAG|RWA|WMS|TMS)-\d+` statements, call `validate_ears_requirement` for each; 100% valid.
   - G2: call `audit_prd_quality` with each full spec; score ≥ 85. Fix wording and re-run if lower.
   - G3: validate Mermaid blocks with a pinned `@mermaid-js/mermaid-cli` via `npx` (outputs to a temp dir, deleted afterwards).
   - G4: `npm run docs:build` exits 0.
   - G5: temporarily set `ignoreDeadLinks: false`, build, record dead links from new/edited pages, fix, revert the flag. (Pre-existing dead links, e.g. the missing `CASE-STUDY-VIETNAM-PAYMENTS-VI.md` referenced by the Vietnam case study, are reported but not fixed in this plan.)
   - G6: `npm run test:mcp` passes.
   - G7: manual skeleton checklist per spec.
7. Clean up temp files; update phase/plan `status` fields.

## Success Criteria
- [ ] 3 new sidebar entries resolve; section label updated.
- [ ] `enum` and `TEMPLATE_MAP` in sync; `get_ba_template` returns all 3 new specs.
- [ ] `npm run test:mcp` passes with the new table-driven test.
- [ ] Gates G1–G7 pass; results recorded in plan.md Review Log.
- [ ] No temporary verification files left in the repo; `ignoreDeadLinks` reverted.
