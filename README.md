# 🏛️ Business Analyst (BA) Knowledge Hub & AI Skill Repository

<p align="center">
  <a href="https://github.com/phamanhduc8577-hash/business-analyst-hub/actions"><img src="https://github.com/phamanhduc8577-hash/business-analyst-hub/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <a href="https://github.com/phamanhduc8577-hash/business-analyst-hub/actions"><img src="https://github.com/phamanhduc8577-hash/business-analyst-hub/actions/workflows/deploy-docs.yml/badge.svg" alt="Docs Deploy" /></a>
  <a href="https://www.npmjs.com/package/@phamanhduc/ba-hub"><img src="https://img.shields.io/badge/npm-v1.0.0-blue.svg" alt="npm package" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://phamanhduc8577-hash.github.io/business-analyst-hub/"><img src="https://img.shields.io/badge/Live_Docs-VitePress-646cff.svg" alt="Live Docs" /></a>
</p>

> **A curated, lightweight, production-ready Business Analysis & Requirements Engineering Hub.**  
> Designed for modern Technical Business Analysts, Product Managers, and AI Engineering Agents (Claude Code, Cursor, Windsurf, Claude Desktop MCP).

---

## ⚡ 1-Click Fast Installation (CLI)

Install the skill across all your IDEs and Claude Code environment instantly:

```bash
# Initialize skill into Claude Code (~/.claude) & current workspace (.cursor/.cursorrules)
npx @phamanhduc/ba-hub init
```

---

## 🤖 Multi-Platform AI Skill Integration

| Platform / Agent | Rule / Configuration | How to Use |
| :--- | :--- | :--- |
| **Claude Code CLI** | `.claude/skills/ai-business-analyst/SKILL.md` | Run `/ai-business-analyst [topic]` |
| **Cursor IDE** | `.cursor/rules/ai-business-analyst.mdc` | Automatically active in Composer & Chat |
| **Windsurf IDE** | `.cursorrules` | Automatically enforces EARS, BDD & Mermaid specs |
| **Claude Desktop (MCP)**| `mcp-server/index.js` | Direct Tool calling (EARS linter, Jira exporter) |
| **ChatGPT / Custom GPT** | `.claude/skills/ai-business-analyst/SKILL.md` | Paste into Project Instructions |

---

## 🔌 Zero-Dependency MCP Server (Model Context Protocol)

Provides 5 standalone MCP tools for AI Agents and Claude Desktop:

1. `get_ba_template`: Fetch production-ready PRD, SRS, BRD, RTM, and domain guides.
2. `validate_ears_requirement`: Validate EARS syntax (*Event, State, Unwanted, Ubiquitous*).
3. `generate_gherkin_scenarios`: Generate Happy Path, Negative Path, and Concurrency test scenarios.
4. `audit_prd_quality`: Lints PRDs for vague buzzwords, missing SLOs, and edge cases.
5. `export_to_jira_format`: Convert User Stories into Jira markup & Linear markdown.

### Add to Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "business-analyst-hub": {
      "command": "node",
      "args": ["<path-to-repo>/mcp-server/index.js"]
    }
  }
}
```

---

## 📂 Pure Markdown Repository Architecture

```text
.
├── bin/cli.js                                    # Zero-dependency CLI installer (ba-hub)
├── .claude/skills/ai-business-analyst/SKILL.md   # Official Claude Code Skill
├── .cursor/rules/ai-business-analyst.mdc         # Cursor IDE Rule
├── .cursorrules                                  # Universal IDE Rules
├── mcp-server/                                   # Standalone Zero-Dependency MCP Server
└── docs/                                         # Structured Knowledge & Specifications:
    ├── 01-elicitation/                           # Discovery Handbooks & Elicitation Checklist
    ├── 02-templates/                             # PRD, BRD, SRS/FRD, RTM & OpenAPI 3.0 Specs
    ├── 03-modeling-and-specs/                    # Mermaid.js & Gherkin BDD Standards
    ├── 04-data-dictionary/                       # Markdown Data Dictionary & Glossary Standards
    └── 05-domain-knowledge/                      # Deep Domain Master Specifications:
        ├── ai-systems-rag/                       # Enterprise AI RAG & Multi-Agent Systems
        ├── crypto-web3-rwa/                      # RWA Tokenization (ERC-3643) & Proof of Reserve
        ├── logistics-supply-chain/               # Smart WMS/TMS, Allocation (FEFO) & Cold Chain
        ├── payments-iso20022/                    # ISO 20022 Financial Messaging & SEPA Guide
        ├── banking-finance/                      # Commercial Lending & Credit Risk (LOS/LMS)
        ├── insurance-healthcare/                 # Healthcare Claims Adjudication (EDI 837/835)
        ├── ecommerce-retail/                     # OMS, State Machine & Vietnam Payments Spec
        └── telecom-saas-esg/                     # Telecom BSS/OSS Architecture & SaaS Billing
```

---

## 🚀 Specification & Modeling Standards

### 1. Requirements Syntax (EARS)
* **Event-Driven:** `WHEN <trigger>, THE SYSTEM SHALL <action>`
* **State-Driven:** `WHILE <state>, THE SYSTEM SHALL <behavior>`
* **Unwanted Behavior:** `IF <failure/error>, THEN THE SYSTEM SHALL <fallback>`
* **Optional Feature:** `WHERE <feature/condition>, THE SYSTEM SHALL <behavior>`
* **Ubiquitous:** `THE SYSTEM SHALL ALWAYS <invariant constraint>`

### 2. Acceptance Criteria (Gherkin BDD)
```gherkin
Scenario: [Happy Path / Concurrency Edge Case]
  Given [Precondition]
  When [Trigger Event]
  Then [Expected Result]
  And [Atomic State Verified]
```

### 3. Visual Modeling (Mermaid in Markdown)
* Process Flows: `flowchart TD`
* API Webhooks: `sequenceDiagram` with `autonumber`
* Lifecycle State Machine: `stateDiagram-v2`
* Data Domain Models: `erDiagram`

---

## 🤝 Contributing & License

Contributions are warmly welcomed! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on code of conduct and submitting pull requests.

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for more information.
