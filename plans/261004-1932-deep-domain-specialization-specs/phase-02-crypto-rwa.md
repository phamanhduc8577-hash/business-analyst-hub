---
phase: 2
title: "Crypto & Real-World Assets (RWA) Tokenization Spec"
status: completed
priority: P1
effort: "5h"
dependencies: []
---

# Phase 2: Crypto, Web3 & Real-World Asset (RWA) Tokenization Spec

## Overview
Develop a deep domain specification for Real-World Asset (RWA) tokenization: asset onboarding and legal custody, permissioned token issuance (ERC-3643), identity/KYC/AML-gated transfers, Proof of Reserve, corporate actions (distributions), redemption, and finality-aware on-chain/off-chain reconciliation.

Follows the **Spec Authoring Standard** in [plan.md](./plan.md). REQ prefix: `REQ-RWA-nn`.

## Scope
- **In-Scope (MVP):** single asset class as the worked example (proposed: tokenized fund units or real-estate SPV shares — decide in Open Questions), primary issuance, secondary transfer between verified wallets, distributions, redemption, freeze/forced transfer/wallet recovery, PoR, reconciliation.
- **Non-Goals:** DEX/AMM liquidity, cross-chain bridging, DeFi lending against tokens, smart-contract source code, tax calculation engine, legal structuring advice.
- **Jurisdiction must be declared.** Note: Vietnam's crypto-asset pilot under Resolution 05/2025/NQ-CP (effective 9 Sep 2025) explicitly excludes security tokens; most RWA tokens are securities. The spec must therefore state the target regime (e.g., EU MiFID II/DLT Pilot Regime, MAS Project Guardian-style, US securities law) and mark Vietnam applicability as an open legal question. Verify all regulatory references at authoring time.

## Requirements
- **Functional:**
  - Token standard: **ERC-3643 (T-REX)** as primary — Identity Registry (ONCHAINID claims), Compliance module (country, holder-count, max-balance, lock-up rules), `canTransfer` pre-check. ERC-1400 mentioned only as historical/alternative (it never reached final EIP status).
  - Minting guarded by: legal attestation complete, custodian confirmation, PoR ≥ outstanding supply + mint amount, multi-sig approval.
  - Proof of Reserve / NAV oracle: heartbeat, staleness threshold, deviation threshold, and **circuit breaker** (pause mint/redeem when stale or reserve < supply).
  - Multi-sig / governance: approval thresholds per action (e.g., mint, burn, pause, forced transfer, contract upgrade = M-of-N, proposed defaults), timelock on upgrades, key custody (HSM/MPC), signer rotation.
  - Agent operations: wallet-level freeze/partial freeze, token-level pause, forced transfer (court order), lost-wallet recovery to new verified identity.
  - KYC/AML: onboarding, continuous sanctions re-screening, claim expiry ➔ automatic transfer block, FATF Travel Rule data for transfers involving VASPs.
  - Corporate actions: distribution with **record-date snapshot**, pro-rata calculation, withholding flag, unclaimed distribution handling.
  - Redemption: request ➔ lock tokens ➔ off-chain settlement (fiat/stablecoin) ➔ burn; atomic or escrow-based with timeout and reversal.
  - Reconciliation: on-chain supply vs. register of holders vs. custodian/fund-admin records; cadence, break detection, break resolution workflow.
- **Non-Functional (proposed defaults):**
  - 0 transfers settled to wallets failing compliance (enforced on-chain, verified by reconciliation).
  - **Finality per chain**, not a fixed block count: Ethereum L1 — act on `finalized` block tag; L2 — distinguish sequencer soft-confirmation vs. L1 finality; reorg handling for any event consumed before finality.
  - PoR staleness ≤ 24h (or per asset class NAV cycle); reconciliation breaks detected within 1h of finality.
  - Indexer/event-ingestion lag P95 < 60s after finality; RPC provider failover across ≥ 2 providers.
  - Audit trail retention aligned with securities record-keeping rules of the declared jurisdiction.

## Architecture
- Visual Diagrams:
  - `flowchart TD`: investor onboarding ➔ KYC ➔ identity claim issuance ➔ eligibility decision (reject branches).
  - `sequenceDiagram` (`autonumber`): Asset Onboarding ➔ Legal/SPV ➔ Custodian ➔ PoR Oracle ➔ Multi-sig ➔ Token Contract ➔ Indexer ➔ Registry; include oracle-stale and multi-sig-timeout `alt` branches.
  - `stateDiagram-v2` for **Asset/Token issuance lifecycle**: `DRAFT ➔ UNDER_DUE_DILIGENCE ➔ ATTESTED ➔ TOKENIZED ⇄ PAUSED ➔ REDEMPTION_IN_PROGRESS ➔ REDEEMED ➔ BURNED`, plus `REJECTED`; guards on each transition.
  - Separate `stateDiagram-v2` for **Holder wallet status**: `PENDING_KYC ➔ VERIFIED ⇄ FROZEN`, `VERIFIED ➔ CLAIM_EXPIRED ➔ VERIFIED`, `VERIFIED ➔ RECOVERED (forced transfer)`.
  - `erDiagram`: Asset, LegalWrapper/SPV, CustodyRecord, TokenContract, Identity, Claim, Wallet, ComplianceRule, TransferEvent, Distribution, DistributionPayout, RedemptionRequest, PoRReading, ReconciliationBreak.
- Data Dictionary: off-chain legal asset ID ⇄ chain ID + contract address + token ID mapping, identities/claims (PII stays off-chain), smart contract events (tx hash, block number, log index, finality status), distributions, PoR readings.

## 10-Point Risk Audit — domain-specific prompts
| Dimension | Must address |
|-----------|--------------|
| Concurrency | Transfer submitted while freeze/claim revocation pending; nonce management for operator wallets |
| Idempotency | Event indexer replay after reorg; duplicate distribution payouts (unique key = distribution ID + holder) |
| Timeouts | Redemption fiat leg fails after tokens locked ➔ unlock/reversal |
| Consistency | Off-chain register vs. on-chain balances; source of truth declared per field |
| State machine | No mint while `PAUSED`; no transfer for `FROZEN`/`CLAIM_EXPIRED` |
| Rate limiting | Operator API, mint size limits per period |
| Security / RBAC | Roles: issuer, agent, custodian, compliance officer, investor; key compromise runbook |
| Audit / observability | Every on-chain action linked to off-chain approval record |
| Degradation | Oracle down ➔ circuit breaker; RPC down ➔ failover |
| Compliance | KYC/AML, sanctions, Travel Rule, securities regime of declared jurisdiction, data protection (no PII on-chain) |

## Related Code Files
- Create: `docs/05-domain-knowledge/crypto-web3-rwa/RWA-TOKENIZATION-SPEC.md`
- Shared-file integration (`.vitepress/config.mjs`, `mcp-server/index.js` key `rwa_tokenization`, `mcp-server/test.js`): **owned by Phase 4**

## Implementation Steps
1. Write §0–§2 including declared jurisdiction, asset class, KPIs (e.g., issuance cycle time, reconciliation break rate, investor onboarding time), Non-Goals, and the 10-Point Risk Audit.
2. Draw the Mermaid diagrams (§3) — 4 required types plus the holder-status state machine.
3. Draft ≥ 12 EARS requirements: issuance guards, compliance transfer hooks, PoR circuit breaker, finality handling, freeze/forced transfer, distributions, redemption, reconciliation.
4. Write ≥ 6 Gherkin scenarios: compliant transfer (happy path); non-verified / sanctioned / expired-claim wallet rejected (`Scenario Outline`); oracle staleness pauses minting; reorg reverts an indexed transfer before finality; redemption fiat leg timeout ➔ token unlock; duplicate distribution job does not double-pay.
5. Build the Data Dictionary with explicit off-chain ⇄ on-chain ID mapping, NFR table, RTM, open questions, glossary (ERC-3643, ONCHAINID, PoR, NAV, record date, finality, Travel Rule).
6. Self-check against G1 and G2 before handing to Phase 4.

## Review Corrections (vs. original draft)
- **"12 block confirmations" is a PoW-era convention** and chain-dependent; replaced with finality-based rules per chain.
- **ERC-3643 vs. ERC-1400 left undecided**; ERC-3643 selected as primary, its real mechanics (Identity Registry, Compliance modules, forced transfer, recovery) now required.
- **State machine was ambiguous:** `FROZEN` had no exit, `REDEEMED`/`BURNED` ordering unclear, wallet-level vs. token-level freeze conflated. Split into asset lifecycle and holder-status machines.
- **Missing:** PoR circuit breaker thresholds, record-date snapshot for dividends, sanctions re-screening, Travel Rule, key management, upgrade timelock, reconciliation break workflow, declared jurisdiction.
- **Vietnam context:** the Vietnamese pilot excludes security tokens — the spec must not imply RWA securities tokenization is permitted under it.
- **Success criteria lacked quantities and the MCP check** — aligned with the common standard.

## Success Criteria
- [ ] Spec complies with the Spec Authoring Standard (11 sections, ≥ 4 diagrams, ≥ 12 EARS, ≥ 6 BDD incl. 1 Scenario Outline).
- [ ] Jurisdiction and asset class declared; every regulation cited with identifier + effective date.
- [ ] Ready for Phase 4 gates G1–G3.
