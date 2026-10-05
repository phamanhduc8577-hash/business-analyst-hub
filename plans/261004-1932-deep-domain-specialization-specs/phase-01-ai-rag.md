---
phase: 1
title: "AI Systems & Enterprise RAG Spec"
status: completed
priority: P1
effort: "5h"
dependencies: []
---

# Phase 1: AI Systems & Enterprise RAG Master Specification

## Overview
Develop a production-grade BA specification for Enterprise Retrieval-Augmented Generation (RAG) and Multi-Agent Orchestration: ingestion & indexing, permission-aware hybrid retrieval, re-ranking, grounded generation with citations, guardrails, evaluation, deterministic fallbacks, and cost/latency SLOs.

Follows the **Spec Authoring Standard** in [plan.md](./plan.md). REQ prefix: `REQ-RAG-nn`.

## Scope
- **In-Scope (MVP):** document ingestion (PDF/DOCX/HTML/Confluence-like sources), chunking, embedding, hybrid search (vector + BM25), re-ranking, answer synthesis with citations, input/output guardrails, semantic cache, fallback routing, human escalation, evaluation & observability, multi-agent orchestration (planner ➔ retriever ➔ tool executor ➔ synthesizer ➔ verifier) with bounded loops.
- **Non-Goals:** model training/fine-tuning, vendor selection of LLM/vector DB, end-user chat UI design, voice/multimodal input.

## Requirements
- **Functional:**
  - Ingestion: connector sync (full + incremental), parsing, chunking strategy (size/overlap/structure-aware, parameters as proposed defaults), embedding with **model version stamped on every chunk**, re-index on source change.
  - **Permission-aware retrieval:** document ACLs copied at ingestion and enforced as a pre-filter at query time; ACL changes propagated to the index within a defined SLA.
  - **Deletion propagation:** source deletion / data-subject erasure removes chunks, embeddings, cache entries, and logs referencing them within a defined SLA.
  - Query pipeline: query rewriting, hybrid search, re-ranking, context window budgeting, context injection.
  - Answer synthesis with citations: every factual claim maps to ≥ 1 retrieved chunk ID; citations verified to exist and be accessible to the requesting user.
  - Guardrails: direct prompt injection, **indirect prompt injection via ingested documents**, jailbreak detection, PII detection/masking on input, context, and output, topic/denylist policy.
  - Multi-agent: max iterations per task, per-request token/cost budget, tool allow-list per agent role, timeout per tool call, loop/deadlock detection.
  - Semantic cache: similarity threshold, TTL, invalidation on source document update or ACL change, cache scoped per permission set (no cross-user leakage).
  - Fallback & escalation: define the trigger signal precisely (see Review Corrections), fallback to rule-based triage / "I don't know" response / human handoff.
  - Asynchronous citation tracking and token/cost metering per tenant, user, and agent.
- **Non-Functional (proposed defaults):**
  - Latency, measured separately per mode: single-turn RAG — P95 time-to-first-token < 1.5s and P95 full answer < 4s; multi-agent tasks — P95 < 15s with streamed progress events.
  - Retrieval quality on a versioned golden evaluation set: context recall ≥ 0.85, faithfulness/groundedness ≥ 0.90, answer relevancy ≥ 0.85.
  - PII: 0 confirmed PII leaks in production audit; PII detector recall ≥ 0.98 on red-team test set of ≥ 500 prompts.
  - Prompt-injection red-team pass rate ≥ 95% (OWASP Top 10 for LLM Applications categories).
  - Freshness: source change searchable within 15 min; ACL revocation enforced within 5 min; erasure completed within 72h.
  - Cost: hard cap per request (tokens) and per tenant per day; alert at 80% budget.
  - Availability 99.9%; graceful degradation to BM25-only search if vector store unavailable.

## Architecture
- Visual Diagrams:
  - `flowchart TD`: query pipeline with guardrail decision diamonds and reject/fallback branches.
  - `sequenceDiagram` (`autonumber`): User ➔ Gateway ➔ Orchestrator ➔ Retriever (Vector + BM25) ➔ Re-ranker ➔ LLM ➔ Verifier ➔ Citation store; include timeout and fallback `alt` blocks.
  - `stateDiagram-v2` for Agent task: `PENDING ➔ GUARDRAIL_INPUT ➔ PLANNING ➔ RETRIEVING ➔ TOOL_CALLING ⇄ RETRIEVING ➔ SYNTHESIZING ➔ GUARDRAIL_OUTPUT ➔ COMPLETED`; plus `FALLBACK`, `ESCALATED_TO_HUMAN`, `BLOCKED`, `BUDGET_EXCEEDED`, `TIMED_OUT`, `FAILED`. All terminal states explicit; transition guards for max-iteration and budget.
  - `erDiagram`: Source, Document, Chunk, Embedding (model_version), DocumentACL, QueryLog, Citation, EvalRun, EvalResult, CacheEntry.
- Data Dictionary: Documents, Chunks/Embeddings, ACLs, Query Logs (with PII-masked prompt), Citations, Agent Task Runs, Evaluation Metrics, Cost Ledger.

## 10-Point Risk Audit — domain-specific prompts
| Dimension | Must address |
|-----------|--------------|
| Concurrency | Re-index running while queries hit a partially updated index (alias/blue-green index swap) |
| Idempotency | Duplicate ingestion events, retried tool calls with side effects (idempotency key per tool call) |
| Timeouts | LLM provider timeout/429 ➔ retry budget, secondary model, or fallback response |
| Consistency | Embedding model upgrade ➔ mixed-version vectors; re-embedding migration plan |
| State machine | Agent loop termination guaranteed (max iterations, budget) |
| Rate limiting | Per user/tenant QPS and token quotas |
| Security / RBAC | ACL pre-filter, tenant isolation, cache partitioning |
| Audit / observability | Trace ID across agents, prompt/response logging with masking, retention period |
| Degradation | Vector DB down ➔ BM25-only; re-ranker down ➔ skip with flag |
| Compliance | EU AI Act (verify current obligations and dates), ISO/IEC 42001, GDPR, Vietnam Law on Personal Data Protection & Decree 13/2023/NĐ-CP (verify effective dates) |

## Related Code Files
- Create: `docs/05-domain-knowledge/ai-systems-rag/ENTERPRISE-RAG-MULTIAGENT-SPEC.md`
- Shared-file integration (`.vitepress/config.mjs`, `mcp-server/index.js` key `enterprise_rag`, `mcp-server/test.js`): **owned by Phase 4**

## Implementation Steps
1. Write §0–§2: purpose, KPIs (e.g., deflection rate, answer acceptance rate, cost per resolved query), scope, 10-Point Risk Audit using the table above.
2. Draw the 4 Mermaid diagrams (§3).
3. Draft ≥ 12 EARS requirements across Ingestion, ACL/Deletion, Query Pipeline, Guardrails, Agent Orchestration, Cache, Fallback, Metering.
4. Write ≥ 6 Gherkin scenarios: grounded answer with citations (happy path); low-groundedness fallback; direct prompt injection blocked; indirect injection in a retrieved document neutralized; user without ACL cannot retrieve or see cached answer of restricted doc; agent hits max iterations / budget ➔ `BUDGET_EXCEEDED`; semantic cache hit and invalidation on document update (`Scenario Outline`).
5. Write NFR/SLO table, Data Dictionary, RTM, open elicitation questions, glossary (RAG, BM25, RRF, re-ranker, groundedness, MCP, etc.).
6. Self-check against G1 (EARS phrasing) and G2 (banned words) before handing to Phase 4.

## Review Corrections (vs. original draft)
- **"LLM confidence < 0.75" is not a well-defined signal.** LLMs do not expose a calibrated confidence. Replaced with an explicit composite: e.g., top re-ranker score < threshold OR verifier groundedness score < threshold OR no citation found. The spec must state which signal(s) and the calibration method.
- **"P95 < 2.5s" for multi-agent flows is unrealistic and ambiguous.** Split into TTFT vs. full answer, and single-turn vs. multi-agent.
- **"PII leak rate = 0%" is not measurable as stated.** Reformulated as detector recall on a red-team set plus zero confirmed incidents in audit.
- **State machine lacked a success terminal state** (`COMPLETED`) and fallback/escalation/budget states; tool loop state added.
- **Missing enterprise-critical requirements:** permission-aware retrieval, deletion propagation, embedding versioning, indirect prompt injection, evaluation metrics, cost budgets, cache isolation.
- **Regulatory:** EU AI Act timeline changed via the Digital Omnibus on AI (Regulation (EU) 2026/1744) — high-risk Annex III obligations moved to 2 Dec 2027. Re-verify at authoring time and cite only as informational.

## Success Criteria
- [ ] Spec complies with the Spec Authoring Standard (11 sections, 4 diagrams, ≥ 12 EARS, ≥ 6 BDD incl. 1 Scenario Outline).
- [ ] Every NFR is quantified and labeled as a proposed default.
- [ ] Ready for Phase 4 gates G1–G3.
