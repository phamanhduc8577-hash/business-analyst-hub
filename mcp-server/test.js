import { spawn } from 'child_process';
import path from 'path';

/**
 * BA Hub MCP Server test suite (STDIO JSON-RPC 2.0).
 * Each request is matched to its response by id; every test either passes or fails (no soft passes).
 */

const TIMEOUT_MS = 15000;
const REQUEST_TIMEOUT_MS = 5000;

// Content markers for known templates; any other enum key only needs to load non-empty content.
const TEMPLATE_MARKERS = {
  enterprise_rag: 'Enterprise AI Systems',
  rwa_tokenization: 'ERC-3643',
  smart_wms_tms: 'FEFO',
  iso20022_payments: 'pacs.008',
  credit_risk_lending: 'Credit',
  health_insurance: 'Claims',
  ecommerce_retail: 'Order',
  telecom_saas: 'BSS',
  vietnam_payments: 'VietQR',
  prd: 'Product Requirements'
};

console.log('🧪 Testing BA Hub MCP Server (STDIO JSON-RPC 2.0)...\n');

const serverProcess = spawn('node', [path.join(process.cwd(), 'mcp-server/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let passed = 0;
let failed = 0;
let nextId = 1;
let buffer = '';
const pending = new Map();
const unexpectedMessages = [];

function check(condition, label, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${label}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

serverProcess.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      unexpectedMessages.push(line);
      continue;
    }
    const resolver = pending.get(msg.id);
    if (resolver) {
      pending.delete(msg.id);
      resolver(msg);
    } else {
      unexpectedMessages.push(line);
    }
  }
});

function rpc(method, params, { id = nextId++ } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timeout waiting for response to ${method} (id=${id})`));
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, (msg) => { clearTimeout(timer); resolve(msg); });
    serverProcess.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

function notify(method, params) {
  serverProcess.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

const callTool = (name, args) => rpc('tools/call', { name, arguments: args });
const toolText = (resp) => resp.result?.content?.[0]?.text ?? '';
const toolJson = (resp) => JSON.parse(toolText(resp));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  // 1. initialize + notification handling (notifications must not get a response)
  const init = await rpc('initialize', {});
  check(init.result?.protocolVersion && init.result?.serverInfo?.name, 'initialize returns protocolVersion and serverInfo');
  notify('notifications/initialized', {});
  await sleep(200);
  check(unexpectedMessages.length === 0, 'notifications receive no response', unexpectedMessages.join(' | '));

  // 2. tools/list
  const list = await rpc('tools/list', {});
  const tools = list.result?.tools ?? [];
  check(tools.length === 5, 'tools/list returns 5 tools', `got ${tools.length}`);
  const templateTool = tools.find((t) => t.name === 'get_ba_template');
  const templateKeys = templateTool?.inputSchema?.properties?.templateType?.enum ?? [];
  check(templateKeys.length > 0, 'get_ba_template exposes templateType enum');

  // 3. Every enum key must resolve to an existing, non-empty file (catches enum/TEMPLATE_MAP drift)
  for (const key of templateKeys) {
    const resp = await callTool('get_ba_template', { templateType: key });
    const text = toolText(resp);
    const marker = TEMPLATE_MARKERS[key];
    const ok = !resp.error && !resp.result?.isError && text.length > 200 && (!marker || text.includes(marker));
    check(ok, `get_ba_template "${key}" loads${marker ? ` (marker "${marker}")` : ''}`, resp.error?.message || (resp.result?.isError ? text : ''));
  }
  for (const key of Object.keys(TEMPLATE_MARKERS)) {
    check(templateKeys.includes(key), `enum contains expected key "${key}"`);
  }

  // 4. EARS validator: all 5 patterns valid, non-EARS invalid
  const earsCases = [
    ['WHEN user clicks submit, THE SYSTEM SHALL save the record within 200 ms', true, 'Event-Driven'],
    ['WHILE in MAINTENANCE_MODE, THE SYSTEM SHALL reject requests with HTTP 503', true, 'State-Driven'],
    ['IF the gateway times out, THEN THE SYSTEM SHALL trigger auto-reversal', true, 'Unwanted Behavior'],
    ['WHERE biometric sensor is available, THE SYSTEM SHALL prompt fingerprint authentication', true, 'Optional Feature'],
    ['THE SYSTEM SHALL ALWAYS encrypt PII at rest using AES-256', true, 'Ubiquitous'],
    ['The system should be fast', false, 'Invalid']
  ];
  for (const [text, expectedValid, expectedPattern] of earsCases) {
    const r = toolJson(await callTool('validate_ears_requirement', { requirementText: text }));
    check(r.isValidEARS === expectedValid && r.patternType.includes(expectedPattern), `validate_ears_requirement → ${expectedPattern}`, JSON.stringify(r));
  }

  // 5. audit_prd_quality: strong document scores high, vague document scores low
  const strongDoc = 'WHEN user clicks, THE SYSTEM SHALL send pacs.008. Given valid data When send Then ok with idempotency. P99 latency < 100ms. ```mermaid\nflowchart TD\nA-->B\n```';
  const weakDoc = 'System must be fast and secure and scalable, supporting various channels etc.';
  const strong = toolJson(await callTool('audit_prd_quality', { documentText: strongDoc }));
  check(strong.score >= 85, 'audit_prd_quality rates a complete document ≥ 85', `score ${strong.score}`);
  const weak = toolJson(await callTool('audit_prd_quality', { documentText: weakDoc }));
  check(weak.score < 70 && weak.issues.length >= 5, 'audit_prd_quality rates a vague document < 70', `score ${weak.score}`);

  // 6. generate_gherkin_scenarios
  const gherkin = toolText(await callTool('generate_gherkin_scenarios', { featureName: 'Refund Request' }));
  check(gherkin.includes('Feature: Refund Request') && (gherkin.match(/Scenario:/g) || []).length >= 3, 'generate_gherkin_scenarios returns ≥ 3 scenarios');

  // 7. export_to_jira_format
  const jira = toolJson(await callTool('export_to_jira_format', {
    issueKey: 'RWA-101',
    summary: 'Mint ERC-3643 Token with PoR Check',
    userStory: 'As an issuer, I want to mint tokens backed by physical assets so that investors receive compliant tokens.',
    acceptanceCriteria: 'Given valid PoR When mint is called Then tokens are credited to wallet.',
    storyPoints: 5
  }));
  check(jira.jiraMarkup?.includes('[RWA-101]') && jira.linearMarkdown?.includes('RWA-101'), 'export_to_jira_format returns Jira and Linear payloads');

  // 8. Error handling: every failure must still produce a response
  const badTemplate = await callTool('get_ba_template', { templateType: 'does_not_exist' });
  check(badTemplate.result?.isError === true && toolText(badTemplate).includes('Unknown template type'), 'unknown templateType returns isError result');

  const protoKey = await callTool('get_ba_template', { templateType: '__proto__' });
  check(protoKey.result?.isError === true, 'prototype key "__proto__" is rejected as unknown template');

  const missingArg = await callTool('validate_ears_requirement', {});
  check(missingArg.result?.isError === true, 'missing required argument returns isError result');

  const unknownTool = await callTool('no_such_tool', {});
  check(unknownTool.error?.code === -32602, 'unknown tool returns JSON-RPC error -32602', JSON.stringify(unknownTool.error));

  const unknownMethod = await rpc('no/such/method', {});
  check(unknownMethod.error?.code === -32601, 'unknown method returns JSON-RPC error -32601', JSON.stringify(unknownMethod.error));

  const parseErr = new Promise((resolve) => pending.set(null, resolve));
  serverProcess.stdin.write('{ this is not json\n');
  const parseResp = await Promise.race([parseErr, sleep(REQUEST_TIMEOUT_MS).then(() => ({}))]);
  check(parseResp.error?.code === -32700, 'malformed JSON returns JSON-RPC error -32700');
}

const globalTimer = setTimeout(() => {
  console.error(`\n❌ Test suite timed out after ${TIMEOUT_MS} ms`);
  serverProcess.kill();
  process.exit(1);
}, TIMEOUT_MS);

run()
  .catch((err) => {
    failed++;
    console.error(`  ❌ FAIL: ${err.message}`);
  })
  .finally(() => {
    clearTimeout(globalTimer);
    serverProcess.kill();
    console.log(`\n🎉 MCP Server Test Summary: ${passed} Passed, ${failed} Failed.\n`);
    process.exit(failed > 0 ? 1 : 0);
  });
