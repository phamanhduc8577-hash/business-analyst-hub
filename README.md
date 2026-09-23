# 🏛️ Business Analyst (BA) Knowledge Hub & AI Skill Repository

> **A curated, production-ready Business Analysis & Requirements Engineering Hub.**  
> Designed for modern Human Business Analysts, Product Managers, and AI-driven Engineering Agents.

---

## 📂 Repository Architecture

```text
C:\BA\
├── README.md                           # Master Documentation & Navigation Index
├── skills/
│   └── ai-business-analyst.md          # Complete AI Agent / Skill Prompt & Protocol
├── 01-elicitation/                     # 18+ Handbooks & Questionnaires for Requirements Discovery
├── 02-templates/
│   ├── prd/
│   │   └── PRD-TEMPLATE.md             # Production-Ready Markdown PRD Template (AI & Human)
│   ├── brd/                            # Business Requirements Documents & Business Cases
│   ├── frd-srs/                        # Functional & Technical Specs (API, HRMS, Travel App...)
│   └── rtm/
│       └── RTM-TEMPLATE.md             # Requirements Traceability Matrix Standard
├── 03-modeling-and-specs/
│   ├── mermaid-diagrams/
│   │   └── MERMAID-MODELING-GUIDE.md   # Flowcharts, Sequence Diagrams, ERDs in Markdown
│   ├── gherkin-bdd/
│   │   └── GHERKIN-BDD-GUIDELINES.md   # BDD Acceptance Criteria (Given-When-Then) Standard
│   └── bpmn-uml/                       # BPMN 2.0 & UML Guides (Activity, Class, State diagrams)
├── 04-data-dictionary/                 # Standard Excel Templates: Data Catalog, Data Dictionary
└── 05-domain-knowledge/                # 70+ Domain Specifications & Standards
    ├── banking-finance/                # Commercial Lending, Credit Risk, Capital Markets
    ├── payments-iso20022/              # ISO 20022, SEPA Rulebooks, SWIFT, Clearing & Settlement
    ├── ecommerce-retail/               # OMS, Catalog, Pricing & Promotion Engines, BRD samples
    ├── insurance-healthcare/           # Policy Lifecycle, Claims Processing, Medicare specs
    └── telecom-saas-esg/               # Telecom Billing (OSS/BSS), Salesforce, ServiceNow, ESG
```

---

## 🚀 Quick Reference Guides

### 1. Document Taxonomy (Which document to write?)
| Stage | Document | Target Audience | Primary Content |
| :--- | :--- | :--- | :--- |
| **Discovery** | `BRD` | C-Level, Sponsors | Business Problem, ROI, Scope, Business Case |
| **Product** | `PRD` | PO, Designers, Tech Lead | User Personas, User Journeys, Feature Scope (RICE/MoSCoW) |
| **Engineering** | `FRD / SRS` | Software Developers | Detailed Logic, API Endpoints, EARS syntax, NFRs, SLA |
| **QA / Delivery**| `RTM` | QA, Project Manager | Mapping: `Business Need` $\rightarrow$ `User Story` $\rightarrow$ `API` $\rightarrow$ `Test Case` |

---

### 2. Specification Standards
* **Requirements Syntax (EARS):**
  * *Event-Driven:* `WHEN <trigger>, THE SYSTEM SHALL <action>`
  * *State-Driven:* `WHILE <state>, THE SYSTEM SHALL <behavior>`
  * *Unwanted Behavior:* `IF <failure/error>, THEN THE SYSTEM SHALL <fallback>`
* **Acceptance Criteria (Gherkin BDD):**
  * Format: `Given <Initial State> When <Trigger Event> Then <Expected Result>`

---

### 3. Visual Modeling (Mermaid in Markdown)
Render architecture and business workflows directly without external software:
* Flowcharts: `flowchart TD`
* Sequence Diagrams: `sequenceDiagram` with `autonumber`
* Data Models: `erDiagram`
* Object Lifecycle: `stateDiagram-v2`

---

## 🤖 AI Business Analyst Skill Integration
This repository includes a standalone AI Skill located in [`skills/ai-business-analyst.md`](./skills/ai-business-analyst.md).  
Use this prompt/skill in Claude Code, ChatGPT, or custom Agent frameworks to convert any raw business idea into a full, developer-ready specification.
