# 🤝 Contributing to Business Analyst Knowledge Hub

Thank you for your interest in contributing to the **Business Analyst (BA) Knowledge Hub & AI Skill Repository**!

We welcome contributions from Technical Business Analysts, Product Managers, Software Engineers, and AI Prompt Engineers around the globe.

---

## 🎯 How Can You Contribute?

You can contribute in several ways:
1. **Domain Knowledge Guides:** Add new banking, fintech, healthcare, AI architecture, or supply chain specifications to `docs/05-domain-knowledge/`.
2. **Templates & Checklists:** Improve our PRD, SRS, BRD, or RTM templates in `docs/02-templates/`.
3. **MCP Tools:** Expand zero-dependency tools in `mcp-server/index.js` (e.g., Jira export, EARS validator, OpenAPI generator).
4. **Translations:** Add translated documentation guides into `docs/` with standard naming conventions.

---

## 📐 Standards & Quality Gates

All contributions must strictly follow our core engineering standards:

### 1. Requirements Syntax (EARS)
All functional requirements must use standard **EARS** templates:
* *Event-Driven:* `WHEN <trigger>, THE SYSTEM SHALL <action>`
* *State-Driven:* `WHILE <state>, THE SYSTEM SHALL <behavior>`
* *Unwanted Behavior:* `IF <failure/error>, THEN THE SYSTEM SHALL <fallback>`
* *Ubiquitous:* `THE SYSTEM SHALL ALWAYS <invariant constraint>`

### 2. Acceptance Criteria (Gherkin BDD)
User stories must include executable Gherkin scenarios with:
* **Happy Path Scenario**
* **Validation / Negative Path Scenario**
* **Concurrency / Timeout / Network Partition Edge Cases**

### 3. Visual Modeling (Mermaid.js)
Diagrams must be pure Markdown Mermaid blocks (`flowchart TD`, `sequenceDiagram`, `stateDiagram-v2`, `erDiagram`).

### 4. Zero-Dependency MCP Server
Tools added to `mcp-server/` must use **pure Node.js standard library** (no external npm dependencies).

---

## 🧪 Local Validation & Testing

Before submitting a Pull Request, run the automated test suite:

```bash
# 1. Test CLI Help & Init
node bin/cli.js --help

# 2. Test MCP Server (Stdio JSON-RPC)
npm run test:mcp

# 3. Lint specifications (EARS, Risk ➔ REQ ➔ RTM ➔ TC traceability, BDD coverage)
npm run lint:specs

# 4. Build & Validate Documentation Site (fails on dead links)
npm run docs:build
```

Master specifications (any doc with a `10-Point ... Risk` section) must pass `npm run lint:specs`: every requirement is valid EARS with a matching pattern label, every risk row links to an existing REQ-ID, the RTM covers every REQ, and every Gherkin scenario carries a `@TC-...` tag listed in the RTM.

---

## 📬 Submitting a Pull Request

1. Fork the repository.
2. Create your feature branch (`git checkout -b feat/new-fintech-guide`).
3. Commit your changes following Conventional Commits (`git commit -m 'feat(domain): add ISO 8583 card processing guide'`).
4. Push to the branch (`git push origin feat/new-fintech-guide`).
5. Open a Pull Request on GitHub.

Thank you for building the open standard for AI-powered Business Analysis!
