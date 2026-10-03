# 🏛️ Business Analyst (BA) Knowledge Hub & AI Skill Repository

> **A curated, production-ready Business Analysis & Requirements Engineering Hub.**  
> Designed for modern Human Business Analysts, Product Managers, and AI-driven Engineering Agents.

---

## 🤖 AI Skill Integration & Usage

### 📥 1. Claude Code CLI Integration
To add this skill to your global Claude Code environment:
```bash
mkdir -p ~/.claude/skills/ai-business-analyst
curl -fsSL https://raw.githubusercontent.com/phamanhduc8577-hash/business-analyst-hub/master/.claude/skills/ai-business-analyst/SKILL.md -o ~/.claude/skills/ai-business-analyst/SKILL.md
```
Then invoke inside Claude Code: `/ai-business-analyst`

---

### 💻 2. IDE & Agent Platforms

| Agent / IDE | Rule File | How to Use |
| :--- | :--- | :--- |
| **Claude Code** | `.claude/skills/ai-business-analyst/SKILL.md` | Run `/ai-business-analyst [topic]` |
| **Cursor IDE** | `.cursor/rules/ai-business-analyst.mdc` | Automatically active in Composer / Chat |
| **Windsurf IDE** | `.cursorrules` | Automatically enforces EARS, BDD & Mermaid specs |
| **ChatGPT / Custom GPT** | `.claude/skills/ai-business-analyst/SKILL.md` | Paste content into Project Instructions |

---

## 📂 Repository Architecture

```text
.
├── .claude/skills/ai-business-analyst/SKILL.md   # Official Claude Code Skill
├── .cursor/rules/ai-business-analyst.mdc         # Cursor IDE Rule
├── .cursorrules                                  # Universal IDE Rules
├── 01-elicitation/                               # Discovery Handbooks & Questionnaires
├── 02-templates/                                 # PRD, BRD, SRS/FRD, RTM & OpenAPI Specs
├── 03-modeling-and-specs/                        # Mermaid.js & Gherkin BDD Standards
├── 04-data-dictionary/                           # Data Dictionary Templates
└── 05-domain-knowledge/                          # Banking, Fintech, Retail, Healthcare Docs
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

