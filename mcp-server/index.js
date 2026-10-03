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
          enum: ['prd', 'srs', 'brd', 'rtm', 'data_dictionary', 'elicitation_checklist', 'iso20022_payments', 'credit_risk_lending', 'health_insurance'],
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
  }
];

const TEMPLATE_MAP = {
  prd: '02-templates/prd/PRD-TEMPLATE.md',
  srs: '02-templates/frd-srs/SRS-FRD-TEMPLATE.md',
  brd: '02-templates/brd/BRD-TEMPLATE.md',
  rtm: '02-templates/rtm/RTM-TEMPLATE.md',
  data_dictionary: '04-data-dictionary/DATA-DICTIONARY-TEMPLATE.md',
  elicitation_checklist: '01-elicitation/CHECKLIST-ELICITATION.md',
  iso20022_payments: '05-domain-knowledge/payments-iso20022/ISO-20022-PAYMENTS-GUIDE.md',
  credit_risk_lending: '05-domain-knowledge/banking-finance/COMMERCIAL-LENDING-CREDIT-RISK-GUIDE.md',
  health_insurance: '05-domain-knowledge/insurance-healthcare/HEALTH-INSURANCE-CLAIMS-GUIDE.md'
};

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
