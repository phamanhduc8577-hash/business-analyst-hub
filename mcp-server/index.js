#!/usr/bin/env node
/**
 * Business Analyst Hub MCP Server
 * Exposes core BA knowledge tools via Model Context Protocol (STDIO JSON-RPC 2.0)
 * Uses pure Node.js stdlib (Zero external dependencies).
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const TOOLS = [
  {
    name: 'get_ba_template',
    description: 'Retrieve standard production-ready Business Analysis templates (PRD, SRS, BRD, RTM, Data Dictionary, OpenAPI).',
    inputSchema: {
      type: 'object',
      properties: {
        templateType: {
          type: 'string',
          enum: ['prd', 'srs', 'brd', 'rtm', 'data_dictionary', 'elicitation_checklist', 'iso20022_payments', 'credit_risk_lending', 'health_insurance', 'vietnam_payments'],
          description: 'The type of BA template or domain guide to retrieve.'
        }
      },
      required: ['templateType']
    }
  },
  {
    name: 'validate_ears_requirement',
    description: 'Validates if a requirement string strictly adheres to EARS (Easy Approach to Requirements Syntax).',
    inputSchema: {
      type: 'object',
      properties: {
        requirementText: {
          type: 'string',
          description: 'The requirement text to validate against EARS patterns.'
        }
      },
      required: ['requirementText']
    }
  },
  {
    name: 'generate_gherkin_scenarios',
    description: 'Generates a standard Gherkin BDD template for a given feature with Happy Path, Negative Path, and Edge Cases.',
    inputSchema: {
      type: 'object',
      properties: {
        featureName: {
          type: 'string',
          description: 'The feature title or user story description.'
        }
      },
      required: ['featureName']
    }
  },
  {
    name: 'audit_prd_quality',
    description: 'Lints and scores a PRD/SRS requirements text based on BABOK standards: checks for ambiguous words, missing non-functional SLOs, missing edge cases, and EARS compliance.',
    inputSchema: {
      type: 'object',
      properties: {
        documentText: {
          type: 'string',
          description: 'The requirements document text (PRD, SRS, User Stories) to audit.'
        }
      },
      required: ['documentText']
    }
  },
  {
    name: 'export_to_jira_format',
    description: 'Converts User Stories and Acceptance Criteria into clean Jira & Linear importable Markdown format with Epic, Story Points, Components, and BDD Panels.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: { type: 'string', description: 'Jira Key or ID, e.g. PROJ-101' },
        summary: { type: 'string', description: 'One-line Jira issue summary' },
        userStory: { type: 'string', description: 'As a [role], I want [action] so that [benefit]' },
        acceptanceCriteria: { type: 'string', description: 'Gherkin BDD or bulleted criteria' },
        storyPoints: { type: 'number', description: 'Estimated Fibonacci story points (1, 2, 3, 5, 8)' }
      },
      required: ['summary', 'userStory', 'acceptanceCriteria']
    }
  }
];

const TEMPLATE_MAP = {
  prd: 'docs/02-templates/prd/PRD-TEMPLATE.md',
  srs: 'docs/02-templates/frd-srs/SRS-FRD-TEMPLATE.md',
  brd: 'docs/02-templates/brd/BRD-TEMPLATE.md',
  rtm: 'docs/02-templates/rtm/RTM-TEMPLATE.md',
  data_dictionary: 'docs/04-data-dictionary/DATA-DICTIONARY-TEMPLATE.md',
  elicitation_checklist: 'docs/01-elicitation/CHECKLIST-ELICITATION.md',
  iso20022_payments: 'docs/05-domain-knowledge/payments-iso20022/ISO-20022-PAYMENTS-GUIDE.md',
  credit_risk_lending: 'docs/05-domain-knowledge/banking-finance/COMMERCIAL-LENDING-CREDIT-RISK-GUIDE.md',
  health_insurance: 'docs/05-domain-knowledge/insurance-healthcare/HEALTH-INSURANCE-CLAIMS-GUIDE.md',
  vietnam_payments: 'docs/05-domain-knowledge/ecommerce-retail/CASE-STUDY-VIETNAM-PAYMENTS.md'
};

function auditPrdQuality(text) {
  const issues = [];
  const strengths = [];
  let score = 100;

  // 1. Ambiguous buzzword detection
  const vagueWords = [
    { word: 'fast', suggestion: 'Define specific latency SLO (e.g., P99 < 200ms)' },
    { word: 'quick', suggestion: 'Quantify exact response time or duration' },
    { word: 'secure', suggestion: 'Specify encryption standards (e.g., AES-256, TLS 1.3, RBAC)' },
    { word: 'user-friendly', suggestion: 'Define UX metrics (e.g., SUS score > 80, 0-training onboarding)' },
    { word: 'high traffic', suggestion: 'Specify RPS/TPS targets (e.g., 5,000 RPS sustained, 20,000 RPS burst)' },
    { word: 'handle errors', suggestion: 'Define explicit fallback status codes and user error messages' },
    { word: 'scalable', suggestion: 'Specify horizontal scaling limits and resource thresholds' },
    { word: 'as soon as possible', suggestion: 'Define explicit timeout and SLA bounds' },
    { word: 'various', suggestion: 'Enumerate exact allowed types or options' },
    { word: 'etc', suggestion: 'Provide complete enumeration instead of trailing etc.' }
  ];

  for (const { word, suggestion } of vagueWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      score -= matches.length * 4;
      issues.push(`⚠️ Ambiguity detected: "${word}" (${matches.length}x) ➔ ${suggestion}`);
    }
  }

  // 2. Check for EARS syntax
  const hasEars = /WHEN\s+.+?,\s*THE\s+SYSTEM\s+SHALL/i.test(text) ||
                  /WHILE\s+.+?,\s*THE\s+SYSTEM\s+SHALL/i.test(text) ||
                  /IF\s+.+?,\s*THEN\s+THE\s+SYSTEM\s+SHALL/i.test(text) ||
                  /THE\s+SYSTEM\s+SHALL\s+ALWAYS/i.test(text);
  if (hasEars) {
    strengths.push('✅ Uses standard EARS requirements syntax.');
  } else {
    score -= 15;
    issues.push('❌ Missing EARS syntax (WHEN..., THE SYSTEM SHALL... / IF..., THEN THE SYSTEM SHALL...).');
  }

  // 3. Check for BDD Acceptance Criteria
  const hasBdd = /Given\s+.+?When\s+.+?Then\s+/is.test(text);
  if (hasBdd) {
    strengths.push('✅ Contains structured Gherkin BDD scenarios.');
  } else {
    score -= 15;
    issues.push('❌ Missing Given-When-Then BDD acceptance criteria.');
  }

  // 4. Check for Concurrency & Idempotency coverage
  const hasIdempotency = /idempotenc/i.test(text) || /idempotent/i.test(text) || /race condition/i.test(text) || /concurr/i.test(text);
  if (hasIdempotency) {
    strengths.push('✅ Addresses concurrency, race conditions, or idempotency.');
  } else {
    score -= 10;
    issues.push('⚠️ Missing Concurrency & Idempotency specifications (Idempotency-Key, double submit protection).');
  }

  // 5. Check for Visual Modeling
  const hasMermaid = /```mermaid/i.test(text) || /sequenceDiagram/i.test(text) || /flowchart/i.test(text);
  if (hasMermaid) {
    strengths.push('✅ Contains Mermaid architectural/process visual diagrams.');
  } else {
    score -= 10;
    issues.push('⚠️ No Mermaid visual models detected (flowchart TD or sequenceDiagram).');
  }

  // 6. Check for Non-Functional SLOs / Latency
  const hasNfr = /latency/i.test(text) || /slo/i.test(text) || /sla/i.test(text) || /throughput/i.test(text) || /p99|p95/i.test(text);
  if (hasNfr) {
    strengths.push('✅ Defines quantifiable Non-Functional SLOs / Performance metrics.');
  } else {
    score -= 10;
    issues.push('⚠️ Missing quantifiable NFRs / SLOs (P95/P99 latency, RPS, Availability SLA).');
  }

  const finalScore = Math.max(0, Math.min(100, score));
  let rating = '🔴 Needs Significant Refinement (Junior/Draft)';
  if (finalScore >= 85) rating = '🟢 Production-Ready (Principal BA Standard)';
  else if (finalScore >= 70) rating = '🟡 Good Draft (Needs Edge-case hardening)';

  return {
    score: finalScore,
    rating,
    strengths,
    issues: issues.length > 0 ? issues : ['No major issues detected. Document adheres to high-quality standards.']
  };
}

function handleToolCall(name, args) {
  const rootDir = process.cwd();

  if (name === 'get_ba_template') {
    const relPath = TEMPLATE_MAP[args.templateType];
    if (!relPath) {
      throw new Error(`Unknown template type: ${args.templateType}`);
    }
    const fullPath = path.resolve(rootDir, relPath);
    if (!fs.existsSync(fullPath)) {
      // Fallback relative to script location
      const scriptRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
      const fallbackPath = path.resolve(scriptRoot, relPath);
      if (fs.existsSync(fallbackPath)) {
        return { content: [{ type: 'text', text: fs.readFileSync(fallbackPath, 'utf8') }] };
      }
      throw new Error(`Template file not found at: ${fullPath}`);
    }
    return { content: [{ type: 'text', text: fs.readFileSync(fullPath, 'utf8') }] };
  }

  if (name === 'validate_ears_requirement') {
    const text = args.requirementText.trim();
    const isEvent = /^WHEN\s+.+?,\s*THE\s+SYSTEM\s+SHALL\s+.+/i.test(text);
    const isState = /^WHILE\s+.+?,\s*THE\s+SYSTEM\s+SHALL\s+.+/i.test(text);
    const isUnwanted = /^IF\s+.+?,\s*THEN\s+THE\s+SYSTEM\s+SHALL\s+.+/i.test(text);
    const isUbiquitous = /^THE\s+SYSTEM\s+SHALL\s+ALWAYS\s+.+/i.test(text);

    const valid = isEvent || isState || isUnwanted || isUbiquitous;
    let patternType = 'Invalid / Non-EARS';
    if (isEvent) patternType = 'Event-Driven (WHEN..., THE SYSTEM SHALL...)';
    if (isState) patternType = 'State-Driven (WHILE..., THE SYSTEM SHALL...)';
    if (isUnwanted) patternType = 'Unwanted Behavior (IF..., THEN THE SYSTEM SHALL...)';
    if (isUbiquitous) patternType = 'Ubiquitous Invariant (THE SYSTEM SHALL ALWAYS...)';

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          isValidEARS: valid,
          patternType,
          recommendation: valid ? 'Conforms to BABOK & EARS standard.' : 'Refactor to: WHEN <trigger>, THE SYSTEM SHALL <action> OR IF <error>, THEN THE SYSTEM SHALL <fallback>.'
        }, null, 2)
      }]
    };
  }

  if (name === 'generate_gherkin_scenarios') {
    const feat = args.featureName;
    const template = `Feature: ${feat}

  Background:
    Given The system is operating normally
    And User session is active

  Scenario: Happy Path - Normal Success
    Given User has completed valid input preconditions
    When User triggers "${feat}"
    Then The system shall process the request successfully
    And Return HTTP 200 OK with confirmation

  Scenario: Negative Path - Validation Error / Invalid Input
    Given User inputs invalid or missing required fields
    When User triggers "${feat}"
    Then The system shall reject the request with HTTP 400
    And Display user-friendly error message

  Scenario: Edge Case - Network Timeout & Concurrency
    Given Concurrent requests are submitted simultaneously
    When The transaction is being processed
    Then The system shall apply Idempotency Key locking
    And Prevent duplicate processing or state corruption
`;
    return { content: [{ type: 'text', text: template }] };
  }

  if (name === 'audit_prd_quality') {
    const report = auditPrdQuality(args.documentText);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(report, null, 2)
      }]
    };
  }

  if (name === 'export_to_jira_format') {
    const { issueKey, summary, userStory, acceptanceCriteria, storyPoints } = args;
    const pointsText = storyPoints ? `*Story Points:* ${storyPoints}\n` : '';
    const keyHeader = issueKey ? `[${issueKey}] ` : '';

    const jiraFormatted = `h2. ${keyHeader}${summary}

*Type:* Story
${pointsText}*Status:* To Do

h3. 📝 User Story
{panel:bgColor=#F4F5F7}
${userStory}
{panel}

h3. ✅ Acceptance Criteria & Test Scenarios
{code:gherkin}
${acceptanceCriteria}
{code}

h3. 📌 Technical Notes & Architecture
* *Engineered with:* BABOK & EARS Syntax
* *Verification:* Run Automated BDD Suite
`;

    const linearMarkdown = `## ${keyHeader}${summary}

**Type:** Story | **Points:** ${storyPoints || 3}

### 📝 User Story
> ${userStory.replace(/\n/g, '\n> ')}

### ✅ Acceptance Criteria
\`\`\`gherkin
${acceptanceCriteria}
\`\`\`
`;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          jiraMarkup: jiraFormatted,
          linearMarkdown: linearMarkdown
        }, null, 2)
      }]
    };
  }

  throw new Error(`Tool ${name} not found`);
}

// JSON-RPC 2.0 Stdio Handler
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const { id, method, params } = req;

    if (method === 'tools/list') {
      const resp = { jsonrpc: '2.0', id, result: { tools: TOOLS } };
      console.log(JSON.stringify(resp));
      return;
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const res = handleToolCall(name, args || {});
      const resp = { jsonrpc: '2.0', id, result: res };
      console.log(JSON.stringify(resp));
      return;
    }

    if (method === 'initialize') {
      const resp = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'business-analyst-hub-mcp', version: '1.0.0' }
        }
      };
      console.log(JSON.stringify(resp));
      return;
    }

    // Default ACK
    console.log(JSON.stringify({ jsonrpc: '2.0', id, result: {} }));
  } catch (err) {
    console.error(`MCP Error: ${err.message}`);
  }
});
