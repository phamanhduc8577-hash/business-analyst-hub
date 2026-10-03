# 🛍️ E-Commerce & Retail Systems Architecture Guide

> **Domain:** E-Commerce OMS (Order Management System), WMS (Warehouse), PIM (Product Information), and Pricing/Promotion Engines.  
> **Target:** E-Commerce BAs, Retail Product Managers, Solutions Architects.

---

## 1. E-Commerce Order Fulfillment & Inventory State Machine

```mermaid
stateDiagram-v2
    [*] --> CartCheckout: Customer Submits Order
    CartCheckout --> InventoryReserved: Stock Locked (15 min TTL)
    InventoryReserved --> PaymentCaptured: Webhook Success (VNPAY / MoMo / Stripe)
    InventoryReserved --> Expired_Cancelled: Payment Timeout (>15 min) -> Stock Released
    
    PaymentCaptured --> OMS_Fulfillment: Order Sent to Warehouse
    OMS_Fulfillment --> Picking_Packing: Warehouse Generates Packing Slip
    Picking_Packing --> HandedToCarrier: Tracking Number Generated (GHN / ViettelPost)
    HandedToCarrier --> InTransit: Carrier Webhook (Picked Up)
    InTransit --> Delivered: Carrier Webhook (Delivered Success)
    Delivered --> [*]
    
    InTransit --> DeliveryFailed: 3 Attempts Failed
    DeliveryFailed --> ReturnedToWarehouse: Stock Restocked & Customer Refunded
    ReturnedToWarehouse --> [*]
```

---

## 2. E-Commerce Core Entities & Data Architecture

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    PRODUCT_VARIANT ||--|{ ORDER_ITEM : ordered_as
    PRODUCT_VARIANT ||--o{ INVENTORY_STOCK : stored_in
    ORDER ||--|| PAYMENT_TRANSACTION : settles
    ORDER ||--|| SHIPMENT : fulfilled_by

    ORDER {
        uuid id PK
        string order_number UK
        uuid customer_id FK
        decimal subtotal
        decimal discount_amount
        decimal shipping_fee
        decimal grand_total
        string status "PENDING, PAID, FULFILLING, SHIPPED, DELIVERED, CANCELLED"
    }

    INVENTORY_STOCK {
        uuid id PK
        uuid variant_id FK
        string warehouse_code
        int on_hand_qty
        int reserved_qty
        int available_qty
    }
```

---

## 3. EARS Requirements & Gherkin Scenarios

### EARS Requirements
* **[REQ-ECOMM-001 - Event-Driven]:** *WHEN* customer initiates checkout, *THE SYSTEM SHALL* reserve inventory stock with a 15-minute Time-To-Live (TTL).
* **[REQ-ECOMM-002 - State-Driven]:** *WHILE* order status is `IN_TRANSIT`, *THE SYSTEM SHALL* poll carrier webhook every 2 hours if no update received.
* **[REQ-ECOMM-003 - Unwanted Behavior]:** *IF* concurrent orders request remaining stock $qty = 1$, *THEN THE SYSTEM SHALL* apply database row-level locking to allow only 1 order.

### Gherkin BDD Scenario
```gherkin
Feature: E-Commerce Inventory Concurrency & Flash Sale

  Scenario: Preventing Overselling during Flash Sale
    Given Product "IPHONE-15-PRO" has available quantity = 1
    When Customer A and Customer B click "Buy Now" at the exact same millisecond
    Then The system shall acquire a row-level lock on inventory table
    And Customer A transaction shall succeed with Order Status "PAID"
    And Customer B transaction shall fail with error "ERR_OUT_OF_STOCK"
    And Final inventory stock shall be exactly 0
```
