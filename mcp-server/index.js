#!/usr/bin/env node
/**
 * Business Analyst Hub MCP Server
 * Exposes core BA knowledge tools via Model Context Protocol (STDIO JSON-RPC 2.0)
 * Uses pure Node.js stdlib (Zero external dependencies).
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { auditPrdQuality, validateEars } from './lib.js';

/** Protocol-level error, returned as a JSON-RPC `error` object (not a tool result). */
class RpcError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const JSONRPC_PARSE_ERROR = -32700;
const JSONRPC_INVALID_REQUEST = -32600;
const JSONRPC_METHOD_NOT_FOUND = -32601;
const JSONRPC_INVALID_PARAMS = -32602;

const TOOLS = [
  {
    name: 'get_ba_template',
    description: 'Retrieve standard production-ready Business Analysis templates (PRD, SRS, BRD, RTM, Data Dictionary, OpenAPI).',
    inputSchema: {
      type: 'object',
      properties: {
        templateType: {
          type: 'string',
          enum: [
            'prd',
            'srs',
            'brd',
            'rtm',
            'data_dictionary',
            'elicitation_checklist',
            'enterprise_rag',
            'rwa_tokenization',
            'smart_wms_tms',
            'iso20022_payments',
            'credit_risk_lending',
            'health_insurance',
            'ecommerce_retail',
            'telecom_saas',
            'vietnam_payments'
          ],
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
    description: 'Lints and scores a PRD/SRS requirements text based on BABOK standards: ambiguous words, EARS compliance per requirement ID, traceability matrix coverage, BDD scenario depth, NFR/SLOs, data dictionary, and scope boundaries.',
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
  enterprise_rag: 'docs/05-domain-knowledge/ai-systems-rag/ENTERPRISE-RAG-MULTIAGENT-SPEC.md',
  rwa_tokenization: 'docs/05-domain-knowledge/crypto-web3-rwa/RWA-TOKENIZATION-SPEC.md',
  smart_wms_tms: 'docs/05-domain-knowledge/logistics-supply-chain/SMART-WMS-TMS-SPEC.md',
  iso20022_payments: 'docs/05-domain-knowledge/payments-iso20022/ISO-20022-PAYMENTS-GUIDE.md',
  credit_risk_lending: 'docs/05-domain-knowledge/banking-finance/COMMERCIAL-LENDING-CREDIT-RISK-GUIDE.md',
  health_insurance: 'docs/05-domain-knowledge/insurance-healthcare/HEALTH-INSURANCE-CLAIMS-GUIDE.md',
  ecommerce_retail: 'docs/05-domain-knowledge/ecommerce-retail/ECOMMERCE-RETAIL-SYSTEMS-GUIDE.md',
  telecom_saas: 'docs/05-domain-knowledge/telecom-saas-esg/TELECOM-SAAS-SYSTEMS-GUIDE.md',
  vietnam_payments: 'docs/05-domain-knowledge/ecommerce-retail/CASE-STUDY-VIETNAM-PAYMENTS.md'
};

/** Throws a tool error (surfaced as isError result) when any listed argument is not a non-empty string. */
function requireStringArgs(args, names) {
  for (const n of names) {
    if (typeof args[n] !== 'string' || !args[n].trim()) {
      throw new Error(`Missing required argument: ${n} (non-empty string)`);
    }
  }
}

function handleToolCall(name, args) {
  const rootDir = process.cwd();

  if (name === 'get_ba_template') {
    requireStringArgs(args, ['templateType']);
    const relPath = Object.hasOwn(TEMPLATE_MAP, args.templateType) ? TEMPLATE_MAP[args.templateType] : undefined;
    if (!relPath) {
      throw new Error(`Unknown template type: ${args.templateType}`);
    }
    const fullPath = path.resolve(rootDir, relPath);
    if (!fs.existsSync(fullPath)) {
      // Fallback relative to script location (fileURLToPath decodes %20 etc. and handles Windows drive letters)
      const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
      const fallbackPath = path.resolve(scriptRoot, relPath);
      if (fs.existsSync(fallbackPath)) {
        return { content: [{ type: 'text', text: fs.readFileSync(fallbackPath, 'utf8') }] };
      }
      throw new Error(`Template file not found at: ${fullPath}`);
    }
    return { content: [{ type: 'text', text: fs.readFileSync(fullPath, 'utf8') }] };
  }

  if (name === 'validate_ears_requirement') {
    requireStringArgs(args, ['requirementText']);
    const { isValidEARS, patternType, recommendation } = validateEars(args.requirementText);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          isValidEARS,
          patternType,
          recommendation
        }, null, 2)
      }]
    };
  }

  if (name === 'generate_gherkin_scenarios') {
    requireStringArgs(args, ['featureName']);
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
    requireStringArgs(args, ['documentText']);
    const report = auditPrdQuality(args.documentText);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(report, null, 2)
      }]
    };
  }

  if (name === 'export_to_jira_format') {
    requireStringArgs(args, ['summary', 'userStory', 'acceptanceCriteria']);
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

  throw new RpcError(JSONRPC_INVALID_PARAMS, `Unknown tool: ${name}`);
}

// JSON-RPC 2.0 Stdio Handler
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function send(msg) {
  console.log(JSON.stringify({ jsonrpc: '2.0', ...msg }));
}

function sendError(id, code, message) {
  send({ id: id ?? null, error: { code, message } });
}

rl.on('line', (line) => {
  if (!line.trim()) return;

  let req;
  try {
    req = JSON.parse(line);
  } catch (err) {
    sendError(null, JSONRPC_PARSE_ERROR, `Parse error: ${err.message}`);
    return;
  }

  if (!req || typeof req !== 'object' || typeof req.method !== 'string') {
    sendError(req?.id, JSONRPC_INVALID_REQUEST, 'Invalid Request: "method" must be a string');
    return;
  }

  const { id, method, params } = req;
  // JSON-RPC notifications (no "id", e.g. notifications/initialized) must never receive a response.
  const isNotification = id === undefined;

  try {
    let result;

    if (method === 'initialize') {
      result = {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'business-analyst-hub-mcp', version: '1.0.0' }
      };
    } else if (method === 'tools/list') {
      result = { tools: TOOLS };
    } else if (method === 'tools/call') {
      const name = params?.name;
      if (typeof name !== 'string') {
        throw new RpcError(JSONRPC_INVALID_PARAMS, 'Invalid params: "name" is required');
      }
      try {
        result = handleToolCall(name, params.arguments || {});
      } catch (toolErr) {
        if (toolErr instanceof RpcError) throw toolErr;
        // Tool execution failure: reported inside the result so the model can see and react to it (MCP isError convention).
        result = { content: [{ type: 'text', text: `Error: ${toolErr.message}` }], isError: true };
      }
    } else if (method === 'ping') {
      result = {};
    } else if (method.startsWith('notifications/')) {
      return; // Acknowledged silently
    } else {
      throw new RpcError(JSONRPC_METHOD_NOT_FOUND, `Method not found: ${method}`);
    }

    if (!isNotification) send({ id, result });
  } catch (err) {
    console.error(`MCP Error: ${err.message}`);
    if (!isNotification) {
      const code = err instanceof RpcError ? err.code : -32603;
      sendError(id, code, err.message);
    }
  }
});
