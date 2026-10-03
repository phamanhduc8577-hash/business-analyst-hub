# 🏛️ Business Analyst (BA) Knowledge Hub & AI Skill Repository

> **A curated, production-ready Business Analysis & Requirements Engineering Hub.**  
> Designed for modern Human Business Analysts, Product Managers, and AI-driven Engineering Agents.

---

## 🤖 1-Click Skill Installation & AI Agent Usage

### 📥 1. One-Click Install for Claude Code CLI
Run in any terminal to install the skill globally into your `~/.claude/skills/`:

**macOS / Linux / WSL:**
```bash
curl -fsSL https://raw.githubusercontent.com/phamanhduc8577-hash/business-analyst-hub/master/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/phamanhduc8577-hash/business-analyst-hub/master/install.ps1 | iex
```

---

### 💻 2. Integration by IDE & Agent Platform

| AI Agent / IDE | Configuration Path | How to Use |
| :--- | :--- | :--- |
| **Claude Code** | `.claude/skills/ai-business-analyst/SKILL.md` | Type `/ai-business-analyst [problem/feature]` |
| **Cursor IDE** | `.cursor/rules/ai-business-analyst.mdc` or `.cursorrules` | Automatically applies rules during composer / chat |
| **Windsurf IDE** | `.cursorrules` | Automatically enforces EARS, BDD & Mermaid standards |
| **ChatGPT / Claude Projects**| `.claude/skills/ai-business-analyst/SKILL.md` | Paste prompt into Custom Instructions / Project instructions |

---

## 📂 Repository Architecture

```text
.
├── .claude/skills/ai-business-analyst/SKILL.md   # Official Claude Code Skill Package
├── .cursor/rules/ai-business-analyst.mdc         # Cursor IDE rule standard
├── .cursorrules                                  # Universal AI IDE rule
├── install.sh / install.ps1                      # 1-Click Installers
├── 01-elicitation/                               # Requirements Handbooks & Discovery Checklist
├── 02-templates/                                 # PRD, BRD, SRS/FRD, RTM & OpenAPI 3.0 Templates
├── 03-modeling-and-specs/                        # Mermaid.js & Gherkin BDD Modeling Guidelines
├── 04-data-dictionary/                           # Data Dictionary Markdown & Excel Standards
└── 05-domain-knowledge/                          # Banking, Fintech, E-commerce, Healthcare Specs
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

