# Mermaid.js Visual Modeling Guide for Business & Systems Analysts

> **Standard:** Render production-grade diagrams directly in Markdown without external drawing tools. Supported natively by GitHub, GitLab, Notion, and AI agent interfaces.

---

## 1. Process Flowchart (`flowchart TD` / `flowchart LR`)
*Use for:* Business workflows, branching decision trees, As-Is vs To-Be process comparisons.

```mermaid
flowchart TD
    Start([1. Customer Submits Order]) --> CheckStock{2. In Stock?}
    
    CheckStock -- Yes --> ReserveStock[3. Reserve Stock in Warehouse]
    CheckStock -- No --> Backorder[3b. Offer Backorder / Notify Email]
    
    ReserveStock --> ProcessPayment{4. Process Payment}
    ProcessPayment -- Success --> UpdateStatus[5. Order Status: PAID]
    ProcessPayment -- Failed --> RetryPayment[5b. Trigger Retry & Notify User]
    
    UpdateStatus --> TriggerFulfillment[6. Push Order to Fulfillment API]
    TriggerFulfillment --> Complete([7. Order Dispatched])
```

---

## 2. System Sequence Diagram (`sequenceDiagram`)
*Use for:* API communication flows, microservice orchestration, third-party webhook handshakes.

```mermaid
sequenceDiagram
    autonumber
    actor User as End User
    participant App as Web Frontend
    participant API as Backend API
    participant DB as Main Database
    participant GW as Payment Gateway (Stripe/VNPAY)

    User->>App: Click 'Pay Now' ($100)
    App->>API: POST /api/v1/orders/checkout
    API->>DB: Check & Lock Inventory
    DB-->>API: Lock Acquired
    API->>GW: Create Payment Intent / Hosted URL
    GW-->>API: Return Checkout URL & Token
    API-->>App: 200 OK (Redirect Payload)
    App->>GW: Redirect User to Payment Page
    User->>GW: Authenticate OTP & Confirm
    GW-->>API: Asynchronous Webhook (Event: payment.success)
    API->>DB: Update Order Status -> 'PAID'
    API-->>User: Push Notification (Order Confirmed)
```

---

## 3. Entity-Relationship Diagram (`erDiagram`)
*Use for:* Database schema definition, domain models, entity mapping for Data Dictionary.

```mermaid
erDiagram
    TENANT ||--o{ USER_ACCOUNT : contains
    USER_ACCOUNT ||--o{ ORDER : places
    ORDER ||--|{ ORDER_LINE_ITEM : includes
    PRODUCT ||--o{ ORDER_LINE_ITEM : referenced_by
    ORDER ||--|| INVOICE : generates

    ORDER {
        uuid id PK
        uuid user_id FK
        varchar order_number UK
        decimal total_amount
        varchar status "PENDING, PAID, SHIPPED, CANCELLED"
        timestamp created_at
    }

    ORDER_LINE_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }
```

---

## 4. State Machine Diagram (`stateDiagram-v2`)
*Use for:* Tracking lifecycle transitions of business objects (Orders, Tickets, Invoices, KYC status).

```mermaid
stateDiagram-v2
    [*] --> Draft: User Creates Order
    Draft --> PendingPayment: Checkout Initiated
    PendingPayment --> Paid: Webhook Received (Success)
    PendingPayment --> Cancelled: Timeout (15 mins) / User Cancel
    Paid --> Processing: Sent to Warehouse
    Processing --> Shipped: Tracking Number Generated
    Shipped --> Delivered: Carrier Webhook (Delivered)
    Delivered --> [*]
    
    Paid --> Refunding: Dispute / Cancellation Requested
    Refunding --> Refunded: Refund Settled
    Refunded --> [*]
```
