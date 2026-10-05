---
phase: 3
title: "Smart Logistics & Automated WMS/TMS Spec"
status: completed
priority: P2
effort: "5h"
dependencies: []
---

# Phase 3: Smart Logistics & Automated WMS/TMS Master Spec

## Overview
Author an end-to-end technical BA specification for Warehouse Management (WMS) and Transport Management (TMS): inventory allocation, wave planning and pick-path routing, packing, carrier dispatch, last-mile e-POD, and cold-chain IoT telemetry with excursion management.

Follows the **Spec Authoring Standard** in [plan.md](./plan.md). REQ prefixes: `REQ-WMS-nn`, `REQ-TMS-nn`.

## Scope
- **In-Scope (MVP):** multi-warehouse inventory (bin-level), receiving & putaway (summary level), allocation (FIFO/FEFO/LIFO rules), wave/batch planning, pick-path routing, pack & ship, carrier assignment, driver dispatch, e-POD, failed delivery & return-to-origin, COD reconciliation, cold-chain telemetry and excursion handling.
- **Non-Goals:** AGV/robot fleet control internals (only the WMS ⇄ WES/robot interface contract), vehicle routing solver algorithm internals (specify inputs/outputs/constraints only), yard management, labor management, customs/cross-border.
- Cross-link (do not duplicate) order lifecycle content in `docs/05-domain-knowledge/ecommerce-retail/ECOMMERCE-RETAIL-SYSTEMS-GUIDE.md` and COD/3PL context in `CASE-STUDY-VIETNAM-PAYMENTS.md`.

## Requirements
- **Functional:**
  - **Allocation (what stock):** FIFO / FEFO / LIFO per SKU policy, minimum remaining shelf-life per customer, lot/serial tracking, quarantine exclusion, stockout ➔ substitution or backorder rules.
  - **Wave planning (which orders together):** grouping by carrier cut-off, zone, priority, temperature class; wave release rules.
  - **Pick-path routing (how to walk):** routing heuristic (S-shape / largest-gap / optimized) as configurable strategy; picker vs. AGV/goods-to-person task interface.
  - Inventory concurrency: reservation with optimistic locking / atomic decrement so the same unit is never allocated twice.
  - Cross-docking: inbound-to-outbound flow without putaway, with time window.
  - Cold chain: telemetry ingestion (temperature/humidity/door-open/GPS), per-product temperature range (e.g., 2–8°C), excursion = out-of-range beyond allowed duration, cumulative excursion budget / Mean Kinetic Temperature, sensor offline (gap) detection, quarantine of affected lots.
  - Dispatch: carrier selection (rate, SLA, cut-off), driver assignment state transitions, route manifest.
  - e-POD: GPS coordinates + geofence check, signature/photo, timestamp, **offline capture with idempotent sync**, recipient identity rules for high-value/pharma.
  - Failed delivery: attempt reasons, retry policy (max attempts, rescheduling), return-to-origin, COD amount reconciliation with 3PL (e.g., GHN, GHTK, Viettel Post).
- **Non-Functional (proposed defaults):**
  - Telemetry ingestion: 10,000 events/sec sustained, 30,000 burst; at-least-once delivery with dedup by (device_id, sequence/timestamp); tolerate out-of-order events up to 5 min.
  - **Excursion alert latency:** P95 < 60s from sensor reading to alert.
  - Allocation + pick-list generation: P95 < 500ms for a wave of up to 500 orders / 5,000 order lines against ≥ 100,000 bin-SKU records.
  - Inventory accuracy ≥ 99.5% (cycle count); 0 double allocations.
  - e-POD sync: offline queue up to 72h, sync P95 < 30s after reconnect.
  - Availability: WMS 99.9% during operating hours; RPO ≤ 5 min.

## Architecture
- Visual Diagrams:
  - `flowchart TD`: allocation decision (FEFO, shelf-life check, quarantine, substitution/backorder branches).
  - `sequenceDiagram` (`autonumber`): OMS Order Ingestion ➔ Allocation ➔ Wave Generation ➔ Picker/AGV Task ➔ Packing ➔ Carrier Booking ➔ Dispatch ➔ e-POD webhook; include carrier API timeout and short-pick `alt` branches.
  - `stateDiagram-v2` for **Shipment**: `CREATED ➔ ALLOCATED ➔ PICKED ➔ PACKED ➔ HANDED_OVER ➔ IN_TRANSIT ➔ OUT_FOR_DELIVERY ➔ DELIVERED`; exceptions `ON_HOLD_TEMP_EXCURSION`, `DELIVERY_ATTEMPT_FAILED ➔ OUT_FOR_DELIVERY` (retry) / `RETURNING_TO_ORIGIN ➔ RETURNED`, `EXCEPTION_DAMAGED`, `LOST`, `CANCELLED` (only before `HANDED_OVER`).
  - `stateDiagram-v2` for **Inventory unit/lot**: `AVAILABLE ⇄ RESERVED ➔ ALLOCATED ➔ PICKED`, `AVAILABLE ➔ QUARANTINED ➔ AVAILABLE | DISPOSED`.
  - `erDiagram`: Warehouse, Zone, Bin, SKU, Lot, InventoryBalance, Order, OrderLine, Wave, PickTask, Shipment, Package, Carrier, CarrierSLA, Waybill, Device, TelemetryReading, Excursion, DeliveryAttempt, PODRecord.
- Data Dictionary: Bin Locations, Inventory Balances (by bin/lot), Wave Batches, Pick Tasks, Telemetry Readings, Excursions, Waybills, Delivery Attempts/POD, Carrier SLAs.

## 10-Point Risk Audit — domain-specific prompts
| Dimension | Must address |
|-----------|--------------|
| Concurrency | Two waves allocating the last unit; picker and cycle count touching same bin |
| Idempotency | Duplicate carrier webhooks; e-POD re-sync after offline; duplicate telemetry |
| Timeouts | Carrier booking API timeout before cut-off ➔ fallback carrier |
| Consistency | WMS vs. ERP stock; short-pick reconciliation |
| State machine | No `CANCELLED` after handover; `DELIVERED` requires valid POD |
| Rate limiting | Device flood / malfunctioning sensor |
| Security / RBAC | Driver can only see assigned stops; POD tamper protection; GPS spoofing detection |
| Audit / observability | Immutable temperature record and e-signature audit trail (21 CFR Part 11 / EU GDP where pharma) |
| Degradation | Telemetry pipeline lag ➔ local gateway buffering; WES down ➔ manual pick lists |
| Compliance | EU GDP 2013/C 343/01 and/or US 21 CFR Part 11 for pharma cold chain, PII of recipients (Vietnam PDP rules), COD cash handling |

## Related Code Files
- Create: `docs/05-domain-knowledge/logistics-supply-chain/SMART-WMS-TMS-SPEC.md`
- Shared-file integration (`.vitepress/config.mjs`, `mcp-server/index.js` key `smart_wms_tms`, `mcp-server/test.js`): **owned by Phase 4**

## Implementation Steps
1. Write §0–§2: KPIs (order cycle time, pick rate lines/hour, on-time-in-full, excursion rate, first-attempt delivery rate), scope/Non-Goals, 10-Point Risk Audit.
2. Draw the Mermaid diagrams (§3): flowchart, sequence, shipment + inventory state machines, ER diagram for multi-warehouse inventory topology.
3. Draft ≥ 12 EARS requirements across allocation, wave, routing, concurrency, cold chain, dispatch, e-POD, failed delivery, COD.
4. Write ≥ 6 Gherkin scenarios: FEFO allocation (happy path); shelf-life rule rejects lot (`Scenario Outline` by customer threshold); concurrent allocation of last unit; temperature excursion ➔ `ON_HOLD_TEMP_EXCURSION` + lot quarantine; sensor offline gap alert; failed delivery retry ➔ return-to-origin after max attempts; offline e-POD sync without duplicate `DELIVERED` events.
5. NFR table, Data Dictionary, RTM, open questions, glossary (FIFO/FEFO, wave, cross-dock, WES, MKT, e-POD, RTO).
6. Self-check against G1 and G2 before handing to Phase 4.

## Review Corrections (vs. original draft)
- **FIFO/FEFO are allocation rules, not pick-path optimization**; allocation, wave planning, and routing are now separate requirement groups.
- **"< 500ms for 5,000 SKUs" was ambiguous** (catalog size vs. wave size); restated with wave size, line count, and data volume.
- **Throughput alone is insufficient for cold chain**; added alert latency, dedup, out-of-order, sensor-gap detection, excursion duration/budget.
- **Shipment state machine missed** failed attempts, return-to-origin, on-hold, lost, cancelled; inventory state machine added.
- **Inconsistency fixed:** Architecture listed sequence + state diagrams while Step 3 asked for an ER diagram; all 4 types now required.
- **Scope too broad for one spec**; AGV control, VRP solver internals, yard and labor management moved to Non-Goals.
- **Vietnam relevance:** COD reconciliation with local 3PLs added, linking to the existing payments case study.

## Success Criteria
- [ ] Spec complies with the Spec Authoring Standard (11 sections, ≥ 4 diagrams, ≥ 12 EARS, ≥ 6 BDD incl. 1 Scenario Outline).
- [ ] All performance NFRs specify workload size and percentile.
- [ ] Ready for Phase 4 gates G1–G3.
