# 🚚 Master Specification: Smart Logistics, Automated WMS/TMS & Cold Chain IoT

> **Purpose:** Production-grade technical specification for enterprise Warehouse Management (WMS) and Transportation Management (TMS): dynamic bin-level inventory allocation (FEFO/FIFO), wave planning, pick-path heuristic routing, carrier dispatch, last-mile electronic Proof of Delivery (e-POD), and cold-chain IoT telemetry with automated excursion quarantine.
>
> 📜 **Referenced Standards:** GS1 General Specifications (Barcode/EPCIS), GDP (Good Distribution Practice for Pharmaceutical Products - EU Guidelines 2013/C 343/01 & US 21 CFR Part 11/205), Vietnam Circular 03/2018/TT-BYT (Good Distribution Practice for medicines) and Circular 36/2018/TT-BYT (Good Storage Practice for medicines), Vietnam Law on Personal Data Protection No. 91/2025/QH15 (effective 1 Jan 2026) with Decree No. 356/2025/NĐ-CP, ASTM D3103 Standard Test Method for Thermal Insulation Performance, MQTT v5.0 IoT Protocol Specification.
>
> ⚖️ *Regulatory references are informational, not legal advice; product temperature limits must come from each product's approved stability data.*

---

## 1. Business Context, KPIs & Scope Boundaries

### 1.1 Business Problem & Supply Chain Complexity
High-velocity omnichannel distribution operations struggle with stockout misallocations, sub-optimal picker travel paths, carrier cut-off misses, and cold-chain compliance failures. Without unified, real-time coordination between warehouse floor operations (WMS) and transportation fleets (TMS), high-value pharmaceuticals and perishables face degradation, leading to regulatory quarantine penalties and high customer churn.

### 1.2 Target Business KPIs
* **Order Fulfillment Cycle Time:** $< 45\text{ minutes}$ from OMS order ingestion to sealed carrier staging pallet.
* **Picker Travel Efficiency:** $\ge 35\%$ reduction in warehouse travel distance via heuristic pick-path optimization.
* **Inventory Allocation Accuracy:** $99.99\%$ accuracy with zero double-allocations under high concurrency ($> 1,000\text{ concurrent orders}$).
* **Cold-Chain Excursion Alert Latency:** Alert propagation and lot quarantine $< 60\text{ seconds}$ after an excursion is confirmed (duration threshold crossed, or the first freeze reading for freeze-sensitive products).
* **First-Attempt Delivery Rate (FADR):** $\ge 94\%$ across last-mile urban delivery fleets.
* **Cash-on-Delivery (COD) Reconciliation Cycle:** Automated settlement matching with 3PLs within $24\text{ hours}$.

### 1.3 Scope Boundaries
* **In-Scope (MVP):**
  - Bin-level multi-warehouse inventory management, receiving, quarantine, and putaway logic.
  - Multi-rule inventory allocation engine: First-Expired-First-Out (FEFO), First-In-First-Out (FIFO), customer shelf-life thresholds, and cross-docking bypass.
  - Dynamic wave release and batch grouping by carrier cut-off, shipping zone, and temperature class.
  - S-Shape and Largest-Gap pick-path optimization heuristics for RF gun pickers and Warehouse Execution Systems (WES).
  - Multi-carrier dynamic dispatch engine, rate shopping, automated waybill generation, and fallback rerouting.
  - Offline-first mobile e-POD capture: GPS geofencing, biometric signature/photo, recipient validation, and idempotent sync.
  - Cold-chain IoT ingestion (MQTT/Kafka), cumulative excursion budget tracking, Mean Kinetic Temperature (MKT), and automated shipment holds.
  - Last-mile failed delivery workflows (retry, RTO) and 3PL COD reconciliation (GHN, GHTK, Viettel Post).
* **Non-Goals / Out-of-Scope (Phase 2+):**
  - Autonomous Mobile Robot (AMR) motor controller firmware internals (governed via standard WES/AGV API contracts).
  - Cross-border customs declaration and maritime freight container booking.

---

## 2. 10-Point Technical Risk & Failure Mode Audit

| Risk Dimension | Failure Scenario | Technical Mitigation Strategy | Linked REQ-ID |
| :--- | :--- | :--- | :--- |
| **1. Concurrency** | Dual picking waves simultaneously allocate the final 10 units of high-demand SKU from same bin location. | Single atomic conditional update on the bin-lot balance row in the primary database (`UPDATE … SET qty_reserved = qty_reserved + :q WHERE qty_on_hand - qty_reserved - qty_allocated >= :q`); the row count decides the winner. A Redis/Redlock lock is not used as the correctness mechanism because it cannot guarantee mutual exclusion under clock drift or GC pauses. | `REQ-WMS-02` |
| **2. Idempotency** | Driver mobile app reconnects to 4G in intermittent signal area, submitting e-POD payload 3 times. | Deduplication gateway evaluating idempotent key `delivery_attempt_id` + `client_uuid`, caching successful receipt response. | `REQ-TMS-05` |
| **3. Timeouts** | Primary 3PL carrier booking API (e.g., GHTK/GHN) times out during peak 11.11 dispatch cut-off window. | Circuit breaker (5s timeout, 3 failures open); fallback routing engine selects secondary carrier within SLA window. | `REQ-TMS-02` |
| **4. Consistency** | Picker discovers bin physical stock is empty during pick wave ("short-pick" discrepancy against system balance). | Immediate inventory adjustment workflow: marks bin as discrepancy, locks bin from active waves, and routes picker to reserve bin. | `REQ-WMS-03` |
| **5. State Machine** | Consignee attempts to cancel order after package is loaded and vehicle departs warehouse (`IN_TRANSIT`); or a pre-handover cancellation leaves units stranded in RESERVED state. | Strict state transition guard: cancellation rejected from `HANDED_OVER` onward; pre-handover cancellation releases reservations and creates return-to-stock tasks. | `REQ-TMS-03`, `REQ-WMS-08` |
| **6. Rate Limiting** | 5,000 IoT refrigerated container sensors emit telemetry readings simultaneously post-network reconnection, including duplicates and late, out-of-order readings. | High-throughput Kafka message bus with partitioning by `device_id` and consumer backpressure smoothing writes to time-series DB; per-device flood detection; dedup by sequence number and event-time ordering. | `REQ-TMS-08`, `REQ-TMS-12` |
| **7. Security & RBAC** | Rogue driver submits fake e-POD signature and marks order as delivered 2km away from customer destination. | GPS geofencing verification: e-POD submission accepted only if device coordinates lie within 100m radius of delivery address. | `REQ-TMS-01` |
| **8. Audit Trail** | Regulatory FDA/MOH auditor demands continuous temperature log for temperature-sensitive oncology drug lot. | Append-only immutable telemetry ledger storing raw sensor reading, calibration ID, and calculation timestamps for 7 years. | `REQ-TMS-09` |
| **9. Degradation** | WMS warehouse Wi-Fi network drops across cold-storage freezer vaults; or a cold-chain sensor stops reporting mid-route. | RF terminal client offline caching: stores current pick-list locally, validates barcode scans via client SQLite, and syncs upon reconnection; sensor-gap detection marks unverified intervals. | `REQ-WMS-07`, `REQ-TMS-11` |
| **10. Compliance** | Perishable food lot dispatched to retail client with remaining shelf-life below contractual threshold ($< 70\%$); a freeze-sensitive vaccine is exposed to sub-zero temperature; recipient personal data (name, signature, photo, location) is over-retained. | Allocation engine pre-filtering: evaluates `(expiry_date - current_date) / total_shelf_life >= customer_min_threshold`; immediate freeze excursion handling; PII classification and retention per Vietnam PDP Law 91/2025/QH15. | `REQ-WMS-01`, `REQ-TMS-10` |

---

## 3. Visual Models (Mermaid in Pure Markdown)

### 3.1 Allocation & Inventory Gating Engine (Flowchart)

```mermaid
flowchart TD
    A[Order Line Ingested from OMS] --> B{SKU Policy: FEFO or FIFO?}
    B -- FEFO --> C[Build Candidate Lots Sorted by Expiration Date ASC]
    B -- FIFO --> D[Build Candidate Lots Sorted by Inbound Date ASC]

    C --> E[Take Next Candidate Lot]
    D --> E

    E --> F{Lot QC Status AVAILABLE?}
    F -- No: QUARANTINED / HOLD --> Q{More Candidate Lots?}
    F -- Yes --> G{Remaining Shelf-Life >= Customer Minimum?}
    G -- No --> Q
    G -- Yes --> H[Atomic Conditional Reserve on Bin-Lot Balance]

    H --> I{Requested Quantity Fully Reserved?}
    I -- Yes --> J[Units AVAILABLE -> RESERVED, Assign to Wave Pick Task]
    I -- No: Partial --> Q

    Q -- Yes --> E
    Q -- No: Candidates Exhausted --> N{Partial Allocation Allowed?}
    N -- Yes --> O[Keep Reserved Quantity, Create Backorder for Remainder]
    N -- No --> P[Release Partial Reservations, Mark Line BACKORDERED, Trigger Replenishment]
```

### 3.2 End-to-End Fulfillment, Dispatch & Delivery Lifecycle (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Picker as Warehouse Picker (RF Gun)
    participant WMS as Warehouse Management System
    participant WES as WES / Pick-Path Router
    participant TMS as Transport Management System
    participant CarrierAPI as 3PL Carrier API (GHN/GHTK)
    actor Driver as Last-Mile Driver (App)
    participant Telemetry as IoT Cold-Chain Broker

    WMS->>WES: Generate Wave (50 Orders, Zone B, Cold-Chain 2-8°C)
    WES->>WES: Calculate Optimized S-Shape Pick Path
    WES-->>Picker: Dispatch Task List (Bin-by-Bin Sequence)
    
    alt Short-Pick Encountered
        Picker->>WMS: Report Discrepancy (Bin Empty)
        WMS->>WES: Re-route Picker to Alternate Active Bin
    else Normal Pick
        Picker->>WMS: Scan Bin + Scan SKU Barcode (Picked)
    end
    
    WMS->>WMS: Consolidate at Packing Station & Print Shipping Label
    WMS->>TMS: Request Carrier Booking (Dimensions, Weight, SLA)
    
    alt Carrier API Timeout / Failure
        TMS->>TMS: Circuit Breaker Open (Timeout > 5s)
        TMS->>CarrierAPI: Fallback to Secondary Carrier
    else Carrier Success
        TMS->>CarrierAPI: Book Waybill & Fetch Barcode Tracking Number
    end
    
    TMS->>Driver: Assign Route Manifest & Load Truck
    Driver->>TMS: Confirm Handover (IN_TRANSIT)
    
    loop Real-Time In-Transit Monitoring
        Telemetry-)TMS: Sensor Event (Temp=4.2°C, GPS Lat/Lng, Door=Closed)
        alt Excursion Confirmed (above 8°C for over 15 min, or at/below 0°C for freeze-sensitive SKU)
            Telemetry-)TMS: Alert: Temperature Excursion Triggered
            TMS->>TMS: Mark Shipment ON_HOLD_TEMP_EXCURSION
            TMS->>WMS: Set Affected Lots to QC Status QUARANTINED
            TMS-->>Driver: Halt Delivery & Return Lot to Cold Depot
        end
    end
    
    Driver->>TMS: Arrive at Customer (Geofence Check Passed)
    Driver->>TMS: Submit e-POD (Biometric Signature + Customer OTP + Photo)
    TMS-->>Driver: Delivery Confirmed (DELIVERED)
    TMS-)WMS: Update Order State & Trigger COD Reconciliation
```

### 3.3 Shipment & Delivery State Lifecycle (State Diagram)

```mermaid
stateDiagram-v2
    [*] --> CREATED: Order Ingested
    CREATED --> ALLOCATED: Inventory Reserved
    ALLOCATED --> PICKED: Warehouse Pick Complete
    PICKED --> PACKED: Packing & Label Affixed
    PACKED --> HANDED_OVER: Loaded onto Carrier Vehicle
    
    HANDED_OVER --> IN_TRANSIT: Vehicle En Route
    IN_TRANSIT --> OUT_FOR_DELIVERY: Dispatched to Local Delivery Hub
    
    OUT_FOR_DELIVERY --> DELIVERED: Valid e-POD Inside Geofence

    OUT_FOR_DELIVERY --> DELIVERY_ATTEMPT_FAILED: Customer Unavailable or Wrong Address
    DELIVERY_ATTEMPT_FAILED --> OUT_FOR_DELIVERY: Rescheduled Retry (attempts < 3)
    DELIVERY_ATTEMPT_FAILED --> RETURNING_TO_ORIGIN: 3 Attempts Failed
    RETURNING_TO_ORIGIN --> RETURNED: Stock Received Back at Warehouse

    IN_TRANSIT --> ON_HOLD_TEMP_EXCURSION: Cold-Chain Excursion Confirmed
    OUT_FOR_DELIVERY --> ON_HOLD_TEMP_EXCURSION: Cold-Chain Excursion Confirmed
    ON_HOLD_TEMP_EXCURSION --> IN_TRANSIT: QA Release (Stability Data Within Limits)
    ON_HOLD_TEMP_EXCURSION --> RETURNING_TO_ORIGIN: QA Rejection

    IN_TRANSIT --> EXCEPTION_DAMAGED: Damaged in Transit
    IN_TRANSIT --> LOST: Transit Loss Confirmed

    CREATED --> CANCELLED: Cancelled Before Allocation
    ALLOCATED --> CANCELLED: Cancelled, Reservations Released
    PICKED --> CANCELLED: Cancelled, Return-to-Stock Task Created
    PACKED --> CANCELLED: Cancelled, Return-to-Stock Task Created
    
    DELIVERED --> [*]
    RETURNED --> [*]
    EXCEPTION_DAMAGED --> [*]
    LOST --> [*]
    CANCELLED --> [*]
```

### 3.4 Multi-Warehouse Logistics Domain Entity Architecture (ER Diagram)

```mermaid
erDiagram
    WAREHOUSE ||--o{ ZONE : contains
    ZONE ||--o{ BIN_LOCATION : encompasses
    BIN_LOCATION ||--o{ INVENTORY_BALANCE : stores
    SKU ||--o{ INVENTORY_BALANCE : quantifies
    SKU ||--o{ LOT_BATCH : categorized_into
    LOT_BATCH ||--o{ INVENTORY_BALANCE : specifies

    ORDER ||--o{ ORDER_LINE : includes
    SKU ||--o{ ORDER_LINE : references
    WAVE_BATCH ||--o{ PICK_TASK : organizes
    ORDER_LINE ||--o{ PICK_TASK : fulfills
    
    SHIPMENT ||--o{ PACKAGE : bundles
    ORDER ||--o{ PACKAGE : ships_in
    PACKAGE ||--o{ PACKAGE_LINE : contains
    LOT_BATCH ||--o{ PACKAGE_LINE : packed_as
    CARRIER ||--o{ CARRIER_SLA : defines
    CARRIER ||--o{ SHIPMENT : transports

    SHIPMENT ||--o{ TELEMETRY_READING : tracks
    ZONE ||--o{ TELEMETRY_READING : monitors
    SHIPMENT ||--o{ EXCURSION_EVENT : records
    SHIPMENT ||--o{ DELIVERY_ATTEMPT : logs
    DELIVERY_ATTEMPT ||--o| POD_RECORD : certifies

    BIN_LOCATION {
        string bin_id PK
        string warehouse_id
        string zone_code
        string aisle
        string rack
        string shelf
        int picking_sequence_index
        string temperature_class
    }

    INVENTORY_BALANCE {
        string balance_id PK
        string bin_id FK
        string sku_id FK
        string lot_number FK
        decimal qty_on_hand
        decimal qty_reserved
        decimal qty_allocated
    }

    LOT_BATCH {
        string lot_number PK
        string sku_id FK
        date manufacturing_date
        date expiration_date
        string qc_status
        boolean is_quarantined
    }

    SHIPMENT {
        string shipment_id PK
        string carrier_id FK
        string tracking_number
        string current_status
        decimal cod_amount_vnd
        timestamp dispatch_timestamp
    }

    PACKAGE_LINE {
        string package_line_id PK
        string package_id FK
        string sku_id FK
        string lot_number FK
        decimal quantity
    }

    TELEMETRY_READING {
        string reading_id PK
        string shipment_id FK
        string zone_id FK
        string device_id
        bigint sequence_no
        decimal temperature_celsius
        decimal humidity_percent
        decimal latitude
        decimal longitude
        timestamp recorded_at
        timestamp received_at
    }

    POD_RECORD {
        string pod_id PK
        string attempt_id FK
        string signature_image_url
        string delivery_photo_url
        decimal latitude
        decimal longitude
        string recipient_name
        timestamp captured_at
    }
```

---

## 4. Formal EARS Functional Requirements

### 4.1 Warehouse Management (WMS)
| Requirement ID | EARS Pattern | Formal Specification |
| :--- | :--- | :--- |
| **REQ-WMS-01** | *Event-Driven* | `WHEN order allocation executes for a perishable SKU, THE SYSTEM SHALL allocate inventory from available non-quarantined lots with the earliest expiration date (FEFO) whose remaining shelf-life percentage is greater than or equal to the customer contractual threshold.` |
| **REQ-WMS-02** | *Ubiquitous* | `THE SYSTEM SHALL ALWAYS reserve inventory through a single atomic conditional update on the bin-lot balance row that succeeds only when unreserved quantity is greater than or equal to the requested quantity, so that concurrent allocations can never reserve the same unit twice.` |
| **REQ-WMS-03** | *Unwanted Behavior* | `IF a warehouse picker reports a physical inventory quantity lower than the pick-task demand (short-pick), THEN THE SYSTEM SHALL allocate the remaining quantity from the next optimal bin location and immediately flag the discrepancy bin for cycle count.` |
| **REQ-WMS-04** | *Event-Driven* | `WHEN the wave planner builds a wave batch, THE SYSTEM SHALL group only orders sharing the same shipping zone, carrier departure cut-off, and storage temperature class.` |
| **REQ-WMS-05** | *Event-Driven* | `WHEN wave pick tasks are released to mobile RF terminals, THE SYSTEM SHALL sequence picking stops using an S-Shape traversal that visits aisles in ascending order and alternates bin direction between consecutive aisles (ascending picking_sequence_index in odd-numbered visits, descending in even-numbered visits).` |
| **REQ-WMS-06** | *State-Driven* | `WHILE an inventory lot is flagged with QC status QUARANTINED, THE SYSTEM SHALL exclude all associated bin balances from wave allocation queries and prevent manual picking release.` |
| **REQ-WMS-07** | *State-Driven* | `WHILE an RF terminal has lost connectivity to the WMS, THE SYSTEM SHALL let the picker continue the locally cached pick list, validate bin and SKU barcode scans on the device, and synchronize confirmed picks idempotently within 30 seconds after reconnection.` |
| **REQ-WMS-08** | *Event-Driven* | `WHEN an order is cancelled before its shipment reaches HANDED_OVER, THE SYSTEM SHALL release all RESERVED and ALLOCATED units of the order back to AVAILABLE, cancel its open pick tasks, and create return-to-stock tasks for units already picked or packed within 5 seconds.` |
| **REQ-WMS-09** | *Event-Driven* | `WHEN a received inbound line matches an open outbound order line due within the 4-hour cross-dock window, THE SYSTEM SHALL route the received units directly to the outbound staging lane of that order without putaway.` |
| **REQ-WMS-10** | *Event-Driven* | `WHEN received units pass receiving inspection and are not cross-docked, THE SYSTEM SHALL direct putaway to a bin whose temperature class matches the SKU and whose free capacity covers the quantity, and record lot number and expiration date on the bin balance.` |

### 4.2 Transportation & Cold-Chain Management (TMS)
| Requirement ID | EARS Pattern | Formal Specification |
| :--- | :--- | :--- |
| **REQ-TMS-01** | *Event-Driven* | `WHEN a delivery driver submits an e-POD confirmation, THE SYSTEM SHALL verify that the mobile device GPS coordinates reside within a 100-meter radius of the delivery address geofence before marking the shipment as DELIVERED.` |
| **REQ-TMS-02** | *Unwanted Behavior* | `IF the primary 3PL carrier booking API fails to respond within 5,000 milliseconds or returns an HTTP 5xx error, THEN THE SYSTEM SHALL automatically divert the dispatch booking request to the designated secondary carrier.` |
| **REQ-TMS-03** | *Ubiquitous* | `THE SYSTEM SHALL ALWAYS reject order cancellation requests once the shipment has reached HANDED_OVER or any later state, namely IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERY_ATTEMPT_FAILED, ON_HOLD_TEMP_EXCURSION, RETURNING_TO_ORIGIN, DELIVERED, RETURNED, EXCEPTION_DAMAGED, or LOST.` |
| **REQ-TMS-04** | *Event-Driven* | `WHEN telemetry readings for a cold-chain shipment stay above 8.0°C or below 2.0°C for longer than 15 continuous minutes, THE SYSTEM SHALL transition the shipment to ON_HOLD_TEMP_EXCURSION, set QC status QUARANTINED on every lot in the shipment, and alert dispatch operations within 60 seconds of that duration threshold being crossed.` |
| **REQ-TMS-05** | *State-Driven* | `WHILE the mobile delivery application operates without cellular connectivity, THE SYSTEM SHALL store completed e-POD records in local encrypted storage and idempotently synchronize queued payloads upon network restoration.` |
| **REQ-TMS-06** | *Event-Driven* | `WHEN a shipment delivery attempt fails due to customer unavailability, THE SYSTEM SHALL reschedule the shipment for retry up to a maximum of 3 attempts before automatically initiating the Return-to-Origin (RTO) workflow.` |
| **REQ-TMS-07** | *Ubiquitous* | `THE SYSTEM SHALL ALWAYS reconcile each 3PL COD remittance within 24 hours of delivery confirmation against the expected net amount, calculated as the order COD invoice balance minus the shipping and COD fees in the carrier's contracted rate card, and flag any difference greater than 0 VND.` |
| **REQ-TMS-08** | *Ubiquitous* | `THE SYSTEM SHALL ALWAYS buffer telemetry in a log partitioned by device_id with consumer backpressure so that reconnection bursts of up to 30,000 events per second are persisted without loss, and flag any device sending more than 10 messages per second as DEVICE_FLOODING.` |
| **REQ-TMS-09** | *Ubiquitous* | `THE SYSTEM SHALL ALWAYS persist raw temperature readings, sensor calibration IDs, and e-POD signature records in an append-only store protected by a SHA-256 hash chain and retained for 7 years.` |
| **REQ-TMS-10** | *Unwanted Behavior* | `IF a telemetry reading for a freeze-sensitive SKU is at or below 0.0°C, THEN THE SYSTEM SHALL immediately, without any duration threshold, transition the shipment to ON_HOLD_TEMP_EXCURSION, quarantine every lot in the shipment, and alert quality assurance within 60 seconds.` |
| **REQ-TMS-11** | *Unwanted Behavior* | `IF no telemetry reading arrives from a device assigned to an in-transit cold-chain shipment for more than 10 minutes, THEN THE SYSTEM SHALL raise a SENSOR_GAP alert and mark the gap interval as unverified in the temperature record.` |
| **REQ-TMS-12** | *Ubiquitous* | `THE SYSTEM SHALL ALWAYS discard telemetry readings whose device_id and sequence number were already stored, and evaluate excursions in recorded_at order, accepting readings that arrive up to 5 minutes late.` |

---

## 5. Executable Gherkin BDD Acceptance Scenarios

```gherkin
Feature: Enterprise WMS Allocation, Cold-Chain IoT, and Last-Mile TMS

  Background:
    Given Warehouse "WH-HANOI-01" has active zones and cold storage vaults
    And SKU "VACCINE-HEPB" requires storage temperature between 2.0 and 8.0 degrees Celsius

  @TC-WMS-01
  Scenario: FEFO allocation selects earliest expiring lot meeting customer shelf-life (Happy Path)
    Given Bin "B-01-01" holds Lot "LOT-A" expiring in 45 days
    And Bin "B-01-02" holds Lot "LOT-B" expiring in 180 days
    And Customer "HOSPITAL-CENTRAL" requires minimum 60 days remaining shelf-life
    When An order for 100 units of "VACCINE-HEPB" is processed for "HOSPITAL-CENTRAL"
    Then The allocation engine shall reject "LOT-A" due to insufficient remaining shelf-life
    And The allocation engine shall allocate 100 units from "LOT-B"
    And "LOT-B" reserved inventory shall increase by 100

  @TC-WMS-02
  Scenario Outline: Customer contractual shelf-life rejection threshold (Validation Matrix)
    Given Customer has a minimum remaining shelf-life policy of "<min_percent>%"
    And Lot "LOT-TEST" has total shelf-life of 300 days and remaining life of "<remaining_days>" days
    When Allocation evaluation executes for the order line
    Then The allocation decision shall be "<decision>"
    Examples:
      | min_percent | remaining_days | decision |
      | 50          | 200            | ACCEPTED |
      | 70          | 200            | REJECTED |
      | 70          | 210            | ACCEPTED |
      | 80          | 250            | ACCEPTED |
      | 85          | 250            | REJECTED |

  @TC-WMS-03
  Scenario: High-concurrency allocation race condition prevents double-allocation (Concurrency Edge Case)
    Given Bin "A-12-04" has exactly 50 available units of SKU "INSULIN-GLARGINE"
    When Wave "WAVE-101" requests allocation for 50 units
    And Wave "WAVE-102" concurrently requests allocation for 50 units within the same millisecond
    Then Exactly one wave's atomic conditional reservation shall succeed and reserve 50 units
    And The competing wave shall receive an INSUFFICIENT_STOCK allocation result
    And Total allocated units in bin "A-12-04" shall not exceed 50

  @TC-WMS-04
  Scenario: Short-pick is re-allocated from the next bin and flagged for cycle count (Consistency Edge Case)
    Given A pick task requires 40 units of SKU "INSULIN-GLARGINE" from bin "A-12-04"
    And Bin "A-12-05" holds 60 allocatable units of the same SKU
    When The picker reports only 25 units physically present in bin "A-12-04"
    Then The system shall allocate the remaining 15 units from bin "A-12-05"
    And Flag bin "A-12-04" for cycle count with status "DISCREPANCY"

  @TC-WMS-05
  Scenario: Wave planner groups orders by zone, carrier cut-off, and temperature class
    Given Orders "ORD-1" and "ORD-2" ship from zone "B" with carrier "GHN" cut-off 15:00 at temperature class "2-8C"
    And Order "ORD-3" ships from zone "B" with carrier "GHN" cut-off 15:00 at temperature class "AMBIENT"
    When The wave planner builds waves
    Then "ORD-1" and "ORD-2" shall be grouped into the same wave
    And "ORD-3" shall be placed in a different wave

  @TC-WMS-06
  Scenario: Released wave is sequenced with an S-Shape traversal
    Given A released wave has pick stops in aisles 1, 2, and 3 with picking sequence indices 10, 20, and 30 in each aisle
    When The pick list is generated for the RF terminal
    Then Aisle 1 stops shall be sequenced 10, 20, 30
    And Aisle 2 stops shall be sequenced 30, 20, 10
    And Aisle 3 stops shall be sequenced 10, 20, 30

  @TC-WMS-07
  Scenario: Quarantined lot is never allocated or manually released (Negative Path)
    Given Lot "LOT-Q7" of SKU "VACCINE-HEPB" has QC status "QUARANTINED"
    And Lot "LOT-Q7" is the earliest-expiring lot with stock on hand
    When An order for 50 units of "VACCINE-HEPB" is allocated
    Then The allocation engine shall not allocate any unit from "LOT-Q7"
    And A supervisor attempt to release a manual pick from "LOT-Q7" shall be rejected

  @TC-WMS-08
  Scenario: RF terminal continues picking offline and syncs idempotently (Degradation Edge Case)
    Given Picker "P-017" has downloaded pick list "PL-5521" with 12 stops
    When The RF terminal loses Wi-Fi connectivity in freezer vault "F-02" after stop 4
    Then The picker shall continue stops 5 to 12 using the cached pick list
    And Each bin and SKU barcode scan shall be validated on the device
    And After reconnection the confirmed picks shall be synchronized within 30 seconds
    And Re-sending the same pick confirmations shall not change inventory a second time

  @TC-WMS-09
  Scenario Outline: Pre-handover cancellation releases inventory (State Guard)
    Given Order "ORD-7781" has 20 units of "INSULIN-GLARGINE" and its shipment is in state "<state>"
    When The consignee cancels the order
    Then The shipment shall transition to "CANCELLED"
    And "<released>" units shall return to AVAILABLE immediately
    And "<return_to_stock>" units shall get return-to-stock tasks
    Examples:
      | state     | released | return_to_stock |
      | ALLOCATED | 20       | 0               |
      | PICKED    | 0        | 20              |
      | PACKED    | 0        | 20              |

  @TC-WMS-10
  Scenario: Inbound units matching an urgent outbound order are cross-docked
    Given Outbound order line "OL-9001" needs 30 units of "VACCINE-HEPB" with dispatch due in 3 hours
    When An inbound receipt of 30 units of "VACCINE-HEPB" passes receiving inspection
    Then The 30 units shall be routed directly to the outbound staging lane of "OL-9001"
    And No putaway task shall be created for those units

  @TC-WMS-11
  Scenario: Putaway is directed only to temperature-compatible bins with capacity
    Given Received lot "LOT-C" of "VACCINE-HEPB" with 120 units and expiry 2027-06-30 is not cross-docked
    And Bin "B-02-01" is "AMBIENT" with free capacity 500
    And Bin "C-01-03" is "2-8C" with free capacity 80
    And Bin "C-01-04" is "2-8C" with free capacity 200
    When The putaway task is generated
    Then The system shall direct the units to bin "C-01-04"
    And Bin "C-01-04" shall record lot "LOT-C" with expiry 2027-06-30

  @TC-TMS-01
  Scenario: Cold-chain temperature excursion triggers automated shipment quarantine (IoT Edge Case)
    Given Shipment "SHP-0000009981" is in transit with 500 vials of "VACCINE-HEPB" from lot "LOT-B"
    And The configured temperature range is between 2.0 and 8.0 degrees Celsius
    When An IoT sensor transmits a temperature reading of 10.5 degrees Celsius sustained for 16 minutes
    Then Within 60 seconds of the 15-minute threshold the shipment status shall be "ON_HOLD_TEMP_EXCURSION"
    And Lot "LOT-B" shall have QC status "QUARANTINED"
    And Emit an urgent alert to the driver to return the container to the nearest cold-storage hub
    And Prevent delivery completion in the driver mobile application

  @TC-TMS-02
  Scenario: Offline e-POD capture and idempotent sync without duplicate delivery events (TMS Edge Case)
    Given The driver arrives at customer location with no cellular signal
    When The driver captures recipient signature and photo confirmation
    And The mobile app generates client UUID "EPOD-UUID-8899"
    And The mobile app syncs the payload 2 times upon reconnecting to 4G
    Then The TMS API shall accept the first sync and record delivery status as "DELIVERED"
    And The second sync shall return HTTP 200 OK with cached idempotency response
    And Exactly one delivery confirmation event shall be published to the message broker

  @TC-TMS-03
  Scenario: e-POD submitted outside the delivery geofence is rejected (Security Negative Path)
    Given Shipment "SHP-0000045122" is "OUT_FOR_DELIVERY" with a 100-meter geofence around the delivery address
    When The driver submits an e-POD from coordinates 2 kilometers away from the delivery address
    Then The system shall reject the e-POD with reason "OUTSIDE_GEOFENCE"
    And The shipment shall remain in "OUT_FOR_DELIVERY"

  @TC-TMS-04
  Scenario: Primary carrier timeout diverts booking to the secondary carrier (Timeout Edge Case)
    Given Primary carrier "GHN" booking API does not respond within 5,000 milliseconds
    And Secondary carrier "GHTK" is designated for zone "HN-URBAN"
    When TMS requests a waybill for package "PKG-77120"
    Then The system shall abort the GHN booking request after 5,000 milliseconds
    And Book the waybill with "GHTK"
    And Record the failover reason "PRIMARY_CARRIER_TIMEOUT" on the shipment

  @TC-TMS-05
  Scenario Outline: Cancellation is rejected once the shipment has been handed over (State Guard)
    Given Shipment "SHP-0000045123" is in state "<state>"
    When The consignee requests order cancellation
    Then The system shall reject the cancellation with reason "SHIPMENT_ALREADY_HANDED_OVER"
    And The shipment shall remain in state "<state>"
    Examples:
      | state            |
      | HANDED_OVER      |
      | IN_TRANSIT       |
      | OUT_FOR_DELIVERY |
      | DELIVERED        |

  @TC-TMS-06
  Scenario: Third failed delivery attempt starts Return-to-Origin
    Given Shipment "SHP-0000045120" has 2 failed delivery attempts due to customer unavailability
    When The third delivery attempt fails due to customer unavailability
    Then The system shall not schedule a fourth attempt
    And Transition the shipment to "RETURNING_TO_ORIGIN"
    And Initiate the Return-to-Origin workflow

  @TC-TMS-07
  Scenario: COD remittance is reconciled net of contracted carrier fees
    Given Shipment "SHP-0000045121" was delivered with a COD invoice balance of 1,250,000 VND
    And The contracted shipping and COD fees of carrier "GHTK" for the shipment total 30,000 VND
    When Carrier "GHTK" remits 1,170,000 VND for the shipment within 24 hours of delivery confirmation
    Then The reconciliation job shall compute an expected net remittance of 1,220,000 VND
    And Flag a discrepancy of 50,000 VND
    And Route the shipment to the COD exception queue

  @TC-TMS-09
  Scenario: Cold-chain audit records are append-only and tamper-evident (Compliance)
    Given Temperature readings for lot "LOT-B" are stored in the append-only telemetry store with a SHA-256 hash chain
    When An operator attempts to modify a stored reading from 9.1 to 7.9 degrees Celsius
    Then The store shall reject the modification
    And A hash-chain verification over a copy containing an altered record shall identify the position of the altered record

  @TC-TMS-10
  Scenario: Single freeze reading for a freeze-sensitive vaccine triggers immediate hold (Compliance Edge Case)
    Given SKU "VACCINE-HEPB" is flagged freeze-sensitive
    And Shipment "SHP-0000009982" is in transit with lot "LOT-D" of "VACCINE-HEPB"
    When An IoT sensor transmits a single reading of -0.5 degrees Celsius
    Then The shipment status shall be "ON_HOLD_TEMP_EXCURSION" without waiting for a duration threshold
    And Lot "LOT-D" shall have QC status "QUARANTINED"
    And Quality assurance shall be alerted within 60 seconds

  @TC-TMS-11
  Scenario: Silent sensor raises a gap alert and marks the interval unverified (Degradation Edge Case)
    Given Device "TL-0042" is assigned to in-transit shipment "SHP-0000009983"
    And Its last reading was recorded at 10:00
    When No further reading arrives from "TL-0042" until 10:11
    Then The system shall raise a "SENSOR_GAP" alert for "SHP-0000009983"
    And The interval starting at 10:00 shall be marked as unverified in the temperature record

  @TC-TMS-12
  Scenario: Duplicate and late telemetry readings are handled deterministically (Idempotency Edge Case)
    Given Device "TL-0042" has stored readings with sequence numbers 100 to 105
    When Reading 103 is delivered again after a broker reconnect
    And Reading 106 arrives 4 minutes after its recorded_at time, after reading 107 has already been stored
    Then Reading 103 shall be discarded as a duplicate
    And Reading 106 shall be accepted and evaluated before reading 107 in recorded_at order
```

---

## 6. Non-Functional Requirements & Performance SLOs

| Dimension | Metric / Parameter | Proposed Default SLO | Verification Method |
| :--- | :--- | :--- | :--- |
| **Allocation Engine Speed** | Wave Batch Processing | P95 $< 500\text{ ms}$ for 500 orders / 5,000 lines against $\ge 100,000$ SKU-bins | K6 load test script |
| **IoT Telemetry Ingestion** | Throughput & Concurrency | 10,000 events/sec sustained, 30,000 events/sec burst | Distributed Kafka benchmark |
| **Excursion Alert Latency**| Excursion Confirmation to Dispatch Alert | P95 $< 60\text{ seconds}$ after the duration threshold is crossed (or after the first freeze reading for freeze-sensitive SKUs) | Synthetic anomaly injector |
| **Sensor Gap Detection** | Silent Device to SENSOR_GAP Alert | Alert when no reading for $> 10\text{ minutes}$; late readings accepted up to 5 minutes | Device silence simulation |
| **Inventory Accuracy** | Cycle Count Variance | $\ge 99.5\%$ physical vs system balance accuracy | Monthly cycle count audit |
| **e-POD Offline Sync** | Sync Queue Ingestion | P95 $< 30\text{ seconds}$ post-reconnection for 72h queue | Network simulation test |
| **Carrier Failover Time** | Booking API Failover | $< 5\text{ seconds}$ to engage secondary 3PL | Chaos engineering network drop |
| **System Availability** | WMS & TMS Operational Uptime | $99.9\%$ during warehouse operating hours (20/7) | Datadog availability monitor |
| **RPO / RTO** | Operational Database Recovery | $\text{RPO} \le 5\text{ mins}$ / $\text{RTO} \le 30\text{ mins}$ | Disaster recovery simulation |

---

## 7. Production Data Dictionary

| Field Name | Data Type | Nullability | Default Value | Business Validation Rules & Constraints | Sensitive (PII/Secret) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bin_id` | `VARCHAR(32)` | NOT NULL | - | Format `WH-ZONE-AISLE-RACK-SHELF` (e.g., `HN1-B-04-02-1`) | No |
| `sku_code` | `VARCHAR(64)` | NOT NULL | - | Alphanumeric SKU identifier matching catalog | No |
| `lot_number` | `VARCHAR(64)` | NOT NULL | - | Manufacturer batch code | No |
| `qty_on_hand` | `DECIMAL(12,3)`| NOT NULL | `0.000` | Current physical units inside bin. Must be $\ge 0$ | No |
| `qty_reserved` | `DECIMAL(12,3)`| NOT NULL | `0.000` | Units allocated to active picking waves | No |
| `expiration_date` | `DATE` | NOT NULL | - | Lot expiry date. Must be valid future date upon receiving | No |
| `temperature_celsius`| `DECIMAL(5,2)` | NOT NULL | - | Valid sensor reading range $-50.00$ to $+70.00$ | No |
| `shipment_id` | `VARCHAR(32)` | NOT NULL | - | Unique fulfillment tracking identifier `^SHP-[0-9]{10}$` | No |
| `sequence_no` | `INT8` | NOT NULL | - | Monotonic per `device_id`; `(device_id, sequence_no)` is unique and used for deduplication (`REQ-TMS-12`) | No |
| `recipient_name` | `VARCHAR(128)` | NULL | - | Name of the person who signed for the delivery | Yes (PII — retain only for the POD dispute period, then pseudonymize) |
| `pod_signature_url` | `VARCHAR(512)`| NULL | - | S3 encrypted pre-signed URL containing PNG signature image | Yes (PII) |
| `delivery_photo_url` | `VARCHAR(512)` | NULL | - | S3 encrypted pre-signed URL of the delivery photo; may contain faces or address details | Yes (PII) |
| `pod_latitude` / `pod_longitude` | `DECIMAL(9,6)` | NULL | - | Device GPS at e-POD capture; WGS84 | Yes (location data linked to a recipient) |
| `cod_amount_vnd` | `DECIMAL(15,0)`| NOT NULL | `0` | Cash-on-delivery currency value in VND | No |

> **Personal data handling:** recipient name, signature, photo, and POD location are personal data under Vietnam PDP Law 91/2025/QH15 and Decree 356/2025/NĐ-CP. Access is restricted to dispute-handling roles; drivers see only their assigned stops.

---

## 8. Requirements Traceability Matrix (RTM)

| Business Goal | User Story ID | EARS Requirement | Target Microservice / API | Test Case (§5 tag or verification type) |
| :--- | :--- | :--- | :--- | :--- |
| **BG-LOG-01** (FEFO Accuracy) | `US-WMS-201` | `REQ-WMS-01` | `POST /api/v1/wms/allocate` | `TC-WMS-01`, `TC-WMS-02` (FEFO & Shelf-Life Validation) |
| **BG-LOG-01** (FEFO Accuracy) | `US-WMS-204` | `REQ-WMS-06` | `POST /api/v1/wms/allocate` | `TC-WMS-07` (Quarantined Lot Exclusion) |
| **BG-LOG-02** (Zero Double-Allocation) | `US-WMS-202` | `REQ-WMS-02` | `POST /api/v1/wms/reserve-lock` | `TC-WMS-03` (Concurrent Allocation Race) |
| **BG-LOG-02** (Zero Double-Allocation) | `US-WMS-203` | `REQ-WMS-03` | `POST /api/v1/wms/pick-tasks/{id}/short-pick` | `TC-WMS-04` (Short-Pick Re-allocation) |
| **BG-LOG-06** (Picking Productivity) | `US-WMS-205` | `REQ-WMS-04` | `POST /api/v1/wms/waves` | `TC-WMS-05` (Wave Grouping) |
| **BG-LOG-06** (Picking Productivity) | `US-WMS-205` | `REQ-WMS-05` | `POST /api/v1/wms/waves/{id}/release` | `TC-WMS-06` (S-Shape Sequencing) |
| **BG-LOG-06** (Picking Productivity) | `US-WMS-206` | `REQ-WMS-07` | `POST /api/v1/wms/pick-confirmations/sync` | `TC-WMS-08` (Offline RF Picking) |
| **BG-LOG-03** (Cold-Chain Quarantine) | `US-TMS-301` | `REQ-TMS-04` | `POST /api/v1/tms/telemetry` | `TC-TMS-01` (Excursion Threshold Alert & Hold) |
| **BG-LOG-03** (Cold-Chain Quarantine) | `US-TMS-304` | `REQ-TMS-08` | `POST /api/v1/tms/telemetry` | `TC-TMS-08` (Kafka burst benchmark — non-BDD) |
| **BG-LOG-03** (Cold-Chain Quarantine) | `US-TMS-305` | `REQ-TMS-09` | Telemetry audit store | `TC-TMS-09` (Append-only Hash Chain) |
| **BG-LOG-04** (Carrier SLA Failover) | `US-TMS-302` | `REQ-TMS-02` | `POST /api/v1/tms/dispatch/book` | `TC-TMS-04` (3PL Timeout Failover) |
| **BG-LOG-05** (Tamper-Proof e-POD) | `US-TMS-303` | `REQ-TMS-01` | `POST /api/v1/tms/pod` | `TC-TMS-03` (Geofence Rejection) |
| **BG-LOG-05** (Tamper-Proof e-POD) | `US-TMS-303` | `REQ-TMS-05` | `POST /api/v1/tms/pod/sync` | `TC-TMS-02` (Offline Idempotent Sync) |
| **BG-LOG-07** (Last-Mile & COD Integrity) | `US-TMS-306` | `REQ-TMS-03` | `POST /api/v1/orders/{id}/cancel` | `TC-TMS-05` (Post-Handover Cancellation Guard) |
| **BG-LOG-07** (Last-Mile & COD Integrity) | `US-TMS-306` | `REQ-TMS-06` | `POST /api/v1/tms/delivery-attempts` | `TC-TMS-06` (Return-to-Origin after 3 Attempts) |
| **BG-LOG-07** (Last-Mile & COD Integrity) | `US-TMS-307` | `REQ-TMS-07` | `POST /api/v1/tms/cod/reconcile` | `TC-TMS-07` (Net COD Reconciliation) |
| **BG-LOG-02** (Zero Double-Allocation) | `US-WMS-207` | `REQ-WMS-08` | `POST /api/v1/orders/{id}/cancel` | `TC-WMS-09` (Pre-Handover Cancellation Release) |
| **BG-LOG-06** (Picking Productivity) | `US-WMS-208` | `REQ-WMS-09` | `POST /api/v1/wms/receipts` | `TC-WMS-10` (Cross-Dock Routing) |
| **BG-LOG-06** (Picking Productivity) | `US-WMS-208` | `REQ-WMS-10` | `POST /api/v1/wms/putaway-tasks` | `TC-WMS-11` (Directed Putaway) |
| **BG-LOG-03** (Cold-Chain Quarantine) | `US-TMS-308` | `REQ-TMS-10` | `POST /api/v1/tms/telemetry` | `TC-TMS-10` (Freeze Excursion Hold) |
| **BG-LOG-03** (Cold-Chain Quarantine) | `US-TMS-309` | `REQ-TMS-11` | Telemetry gap monitor | `TC-TMS-11` (Sensor Gap Alert) |
| **BG-LOG-03** (Cold-Chain Quarantine) | `US-TMS-304` | `REQ-TMS-12` | `POST /api/v1/tms/telemetry` | `TC-TMS-12` (Dedup & Late Readings) |

> **Coverage:** all 22 requirements (`REQ-WMS-01`…`10`, `REQ-TMS-01`…`12`) trace to at least one test case; every TC except `TC-TMS-08` (benchmark) is a tagged scenario in §5.

---

## 9. Open Elicitation Questions for Stakeholders

1. **Mean Kinetic Temperature (MKT) Formula:** For pharmaceutical cold-chain excursions, should the quarantine threshold trigger solely on instantaneous duration (e.g., $> 8^\circ\text{C}$ for 15 minutes) or on calculated Mean Kinetic Temperature (Haynes equation, $\Delta H / R = 83.144\text{ kJ/mol}$)?
2. **Short-Pick Tolerance Rules:** In B2B wholesale orders, if an allocated bin experiences a short-pick and alternate stock is in bulk reserve requiring a forklift replenishment ($> 20\text{ minutes}$ delay), should the wave proceed with partial shipment or hold the entire pallet?
3. **Driver Geofence Override:** In multi-story commercial buildings or underground loading docks where GPS signal degrades, what secondary verification mechanism (e.g., customer SMS OTP or building security badge barcode scan) authorizes e-POD completion?
4. **COD Cash Variance Threshold:** When reconciling 3PL cash collections with banking deposits, what discrepancy margin is handled via automated adjustment voucher versus triggering an operational fraud audit?

---

## 10. Technical Glossary & Cross-References

* **FEFO (First-Expired-First-Out):** Allocation methodology prioritizing inventory batches with the earliest expiration date regardless of receiving date.
* **e-POD (Electronic Proof of Delivery):** Digital documentation of shipment receipt capturing GPS geofencing, digital signatures, photographs, and timestamps.
* **Cross-Docking:** Direct transfer of inbound goods from receiving dock to outbound shipping dock without intermediate warehouse putaway storage.
* **Mean Kinetic Temperature (MKT):** A single calculated temperature that simulates the isothermal degradation effect of temperature fluctuations over a storage/transit period.
* **Cross-Reference:** See the [E-Commerce & Retail Systems Guide](../ecommerce-retail/ECOMMERCE-RETAIL-SYSTEMS-GUIDE.md) for omnichannel OMS order routing and the [Vietnam Payments Case Study](../ecommerce-retail/CASE-STUDY-VIETNAM-PAYMENTS.md) for Vietnam 3PL COD reconciliation dynamics.
