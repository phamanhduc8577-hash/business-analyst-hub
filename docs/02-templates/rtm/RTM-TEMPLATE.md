# Requirements Traceability Matrix (RTM) Template

> **Purpose:** Trace every Business Goal $\rightarrow$ Functional Requirement $\rightarrow$ API Endpoint/DB Table $\rightarrow$ QA Test Case to guarantee zero missing requirements and zero scope creep.

---

## 1. Traceability Summary
* **Project Name:** [Project Name]
* **Version:** 1.0
* **Last Updated:** 2026-09-23

---

## 2. Requirements Traceability Matrix (RTM Table)

| Req ID | Business Goal (BRD) | Functional Spec (PRD/FRD) | System Component / API Endpoint | DB Table / Entity | QA Test Scenario / Case | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `REQ-001` | BG-01: Reduce checkout friction | US-01: Guest Checkout without login | `POST /api/v1/orders/guest-checkout` | `orders`, `guest_sessions` | `TC-CHK-001`: Complete guest order with card | `Covered` |
| `REQ-002` | BG-01: Reduce checkout friction | US-02: Auto-fill address via Geolocation | `GET /api/v1/geo/lookup` | `addresses` | `TC-CHK-002`: Auto-populate valid zip code | `Covered` |
| `REQ-003` | BG-02: Prevent inventory overselling | US-03: Real-time inventory reservation lock | `POST /api/v1/cart/reserve` | `inventory_locks` | `TC-INV-005`: Multi-user race condition test | `Covered` |
| `REQ-004` | BG-03: Compliance with ISO 20022 | US-04: Generate pain.001 credit transfer payload | `POST /api/v1/payments/iso20022/transfer` | `payment_transactions` | `TC-PAY-010`: Schema validation on XML output | `In Progress` |

---

## 3. Verification & Coverage Rules
1. **100% Test Coverage for Core Flows**: Every `REQ-xxx` marked as MVP must map to at least one automated integration test.
2. **Orphan Feature Prevention**: Any API or database table that does not map back to a `REQ-xxx` is considered unauthorized scope creep and must be removed.
