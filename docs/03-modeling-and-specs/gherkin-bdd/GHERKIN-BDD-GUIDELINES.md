# Gherkin BDD Specification & Acceptance Criteria Guide

> **Standard:** Behavior-Driven Development (BDD) / Cucumber Standard for Business Analysts, Developers & QA Testers.

---

## 1. Core Principles of BDD for Business Analysts
1. **Ubiquitous Language**: Use domain terms that both business stakeholders and software engineers understand without translation.
2. **Behavior Over Implementation**: Describe **WHAT** happens and **WHY**, never **HOW** buttons are clicked or UI colors look.
3. **Deterministic Scenarios**: Each scenario must have one clear outcome with no ambiguous `OR` logic.

---

## 2. Gherkin Syntax Keywords

| Keyword | Purpose | Example |
| :--- | :--- | :--- |
| `Feature:` | High-level business capability & rationale | `Feature: Dynamic Pricing Engine` |
| `Background:` | Shared preconditions across all scenarios | `Given The exchange rate EUR to USD is 1.08` |
| `Scenario:` | Single specific test case / business rule | `Scenario: Apply discount for VIP tier` |
| `Scenario Outline:` | Parametrized test matrix with data table | `Scenario Outline: Tax calculation by state` |
| `Given` | Initial system state / Context | `Given User has 100 loyalty points in wallet` |
| `When` | Event / Triggering user or system action | `When User redeems 50 loyalty points at checkout` |
| `Then` | Expected outcome / Observable result | `Then System deducts $5.00 from order total` |
| `And` / `But` | Chaining conditions cleanly | `And Remaining wallet balance is 50 points` |

---

## 3. Production-Ready Examples

### Example 1: Standard User Scenario (Payment Authorization)
```gherkin
Feature: Card Payment Processing

  Background:
    Given Merchant account is active and verified
    And Gateway API is online

  Scenario: Customer successfully pays with valid credit card
    Given Customer has an active cart worth 150.00 USD
    And Customer enters a valid Visa card with sufficient balance
    When Customer submits the checkout form
    Then Payment gateway returns "200 Authorized"
    And Order status changes to "PAID"
    And Customer receives an order confirmation email

  Scenario: Payment declined due to insufficient funds
    Given Customer enters a card with balance less than order amount
    When Customer submits the checkout form
    Then Payment gateway returns "402 Insufficient Funds"
    And Order remains in "PENDING_PAYMENT" status
    And System displays error "Your card was declined. Please try another method."
```

### Example 2: Scenario Outline (Volume Discount Matrix)
```gherkin
Feature: Bulk Order Discount

  Scenario Outline: Calculate tiered wholesale discount
    Given A customer adds <quantity> units of SKU "<sku>" to cart
    When Cart total is calculated
    Then The applied discount percentage should be <discount_rate>%

    Examples:
      | sku      | quantity | discount_rate |
      | TSHIRT01 | 5        | 0             |
      | TSHIRT01 | 15       | 5             |
      | TSHIRT01 | 50       | 10            |
      | TSHIRT01 | 200      | 20            |
```
