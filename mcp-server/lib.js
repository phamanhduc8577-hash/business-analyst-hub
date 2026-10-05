/**
 * Shared, zero-dependency BA quality rules used by the MCP server (index.js)
 * and the repository spec linter (scripts/lint-specs.mjs).
 */

export const EARS_PATTERNS = [
  { label: 'Event-Driven', regex: /^WHEN\s+.+?,\s*THE\s+SYSTEM\s+SHALL\s+.+/i, type: 'Event-Driven (WHEN..., THE SYSTEM SHALL...)' },
  { label: 'State-Driven', regex: /^WHILE\s+.+?,\s*THE\s+SYSTEM\s+SHALL\s+.+/i, type: 'State-Driven (WHILE..., THE SYSTEM SHALL...)' },
  { label: 'Unwanted Behavior', regex: /^IF\s+.+?,\s*THEN\s+THE\s+SYSTEM\s+SHALL\s+.+/i, type: 'Unwanted Behavior (IF..., THEN THE SYSTEM SHALL...)' },
  { label: 'Optional Feature', regex: /^WHERE\s+.+?,\s*THE\s+SYSTEM\s+SHALL\s+.+/i, type: 'Optional Feature (WHERE..., THE SYSTEM SHALL...)' },
  { label: 'Ubiquitous', regex: /^THE\s+SYSTEM\s+SHALL\s+ALWAYS\s+.+/i, type: 'Ubiquitous Invariant (THE SYSTEM SHALL ALWAYS...)' }
];

/** Classifies a single requirement statement against the 5 EARS patterns. */
export function validateEars(requirementText) {
  const text = requirementText.trim();
  const match = EARS_PATTERNS.find((p) => p.regex.test(text));
  return {
    isValidEARS: Boolean(match),
    patternLabel: match ? match.label : null,
    patternType: match ? match.type : 'Invalid / Non-EARS',
    recommendation: match
      ? 'Conforms to BABOK & EARS standard.'
      : 'Refactor to: WHEN <trigger>, THE SYSTEM SHALL <action> OR IF <error>, THEN THE SYSTEM SHALL <fallback>.'
  };
}

/**
 * Requirement table rows in the repository format:
 * | **REQ-XXX-01** | *Event-Driven* | `WHEN ..., THE SYSTEM SHALL ...` |
 */
export function extractRequirementRows(text) {
  const rows = [];
  const re = /^\|\s*\*\*((?:REQ|FR)-[A-Z0-9]+-\d+)\*\*\s*\|\s*\*?([^|*]*?)\*?\s*\|\s*`([^`]+)`\s*\|/gm;
  for (const m of text.matchAll(re)) {
    rows.push({ id: m[1], label: m[2].trim(), statement: m[3].trim() });
  }
  return rows;
}

/** Returns the markdown section whose heading matches `headingRegex`, up to the next heading of the same or higher level. */
export function extractSection(text, headingRegex) {
  const lines = text.split(/\r?\n/);
  let start = -1;
  let level = 0;
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) inFence = !inFence;
    if (inFence) continue;
    const h = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (!h) continue;
    if (start < 0 && headingRegex.test(h[2])) {
      start = i;
      level = h[1].length;
    } else if (start >= 0 && h[1].length <= level) {
      return lines.slice(start, i).join('\n');
    }
  }
  return start >= 0 ? lines.slice(start).join('\n') : '';
}

/** Gherkin scenarios (Scenario / Scenario Outline) with the @tags placed directly above them. */
export function extractScenarios(text) {
  const lines = text.split(/\r?\n/);
  const scenarios = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(Scenario Outline|Scenario):\s*(.*)$/);
    if (!m) continue;
    const tags = [];
    for (let j = i - 1; j >= 0 && /^\s*@/.test(lines[j]); j--) {
      tags.push(...lines[j].trim().split(/\s+/).map((t) => t.replace(/^@/, '')));
    }
    scenarios.push({ kind: m[1], title: m[2].trim(), tags });
  }
  return scenarios;
}

const VAGUE_WORDS = [
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

/**
 * Scores a requirements document (0–100) on wording, EARS/BDD presence, NFRs, modeling,
 * and structural depth: requirement IDs, EARS validity per requirement, traceability,
 * scenario depth, data dictionary, and scope boundaries.
 */
export function auditPrdQuality(text) {
  const issues = [];
  const strengths = [];
  let score = 100;
  const penalize = (points, message) => { score -= points; issues.push(message); };

  // 1. Ambiguous wording
  for (const { word, suggestion } of VAGUE_WORDS) {
    const matches = text.match(new RegExp(`\\b${word}\\b`, 'gi'));
    if (matches) penalize(matches.length * 4, `⚠️ Ambiguity detected: "${word}" (${matches.length}x) ➔ ${suggestion}`);
  }

  // 2. EARS syntax present
  const hasEars = /WHEN\s+.+?,\s*THE\s+SYSTEM\s+SHALL/i.test(text) ||
                  /WHILE\s+.+?,\s*THE\s+SYSTEM\s+SHALL/i.test(text) ||
                  /WHERE\s+.+?,\s*THE\s+SYSTEM\s+SHALL/i.test(text) ||
                  /IF\s+.+?,\s*THEN\s+THE\s+SYSTEM\s+SHALL/i.test(text) ||
                  /THE\s+SYSTEM\s+SHALL\s+ALWAYS/i.test(text);
  if (hasEars) strengths.push('✅ Uses standard EARS requirements syntax.');
  else penalize(15, '❌ Missing EARS syntax (WHEN..., THE SYSTEM SHALL... / IF..., THEN THE SYSTEM SHALL...).');

  // 3. BDD present
  if (/Given\s+.+?When\s+.+?Then\s+/is.test(text)) strengths.push('✅ Contains structured Gherkin BDD scenarios.');
  else penalize(15, '❌ Missing Given-When-Then BDD acceptance criteria.');

  // 4. Concurrency & idempotency
  if (/idempoten|race condition|concurr/i.test(text)) strengths.push('✅ Addresses concurrency, race conditions, or idempotency.');
  else penalize(10, '⚠️ Missing Concurrency & Idempotency specifications (Idempotency-Key, double submit protection).');

  // 5. Visual modeling
  if (/```mermaid|sequenceDiagram|flowchart/i.test(text)) strengths.push('✅ Contains Mermaid architectural/process visual diagrams.');
  else penalize(10, '⚠️ No Mermaid visual models detected (flowchart TD or sequenceDiagram).');

  // 6. Quantified NFRs
  if (/latency|\bslo\b|\bsla\b|throughput|p99|p95/i.test(text)) strengths.push('✅ Defines quantifiable Non-Functional SLOs / Performance metrics.');
  else penalize(10, '⚠️ Missing quantifiable NFRs / SLOs (P95/P99 latency, RPS, Availability SLA).');

  // 7. Requirement IDs
  const reqRows = extractRequirementRows(text);
  const reqIds = reqRows.map((r) => r.id);
  if (reqRows.length > 0) strengths.push(`✅ Defines ${reqRows.length} identified requirements.`);
  else penalize(10, '❌ No identified requirements table (| **REQ-XXX-01** | *Pattern* | `statement` |).');

  // 8. Each identified requirement must be valid EARS
  const nonEars = reqRows.filter((r) => !validateEars(r.statement).isValidEARS).map((r) => r.id);
  if (nonEars.length) penalize(Math.min(15, nonEars.length * 3), `❌ Requirements not in EARS syntax: ${nonEars.join(', ')}.`);
  else if (reqRows.length) strengths.push('✅ Every identified requirement conforms to EARS.');

  // 9. Traceability matrix covering every requirement
  const rtm = extractSection(text, /traceability/i);
  if (!rtm) {
    penalize(10, '❌ Missing Requirements Traceability Matrix (Business Goal ➔ User Story ➔ REQ ➔ API ➔ Test Case).');
  } else {
    const untraced = reqIds.filter((id) => !rtm.includes(id));
    if (untraced.length) penalize(Math.min(15, untraced.length * 2), `⚠️ Requirements missing from the RTM: ${untraced.join(', ')}.`);
    else strengths.push('✅ Traceability matrix present and covers every requirement.');
  }

  // 10. Scenario depth
  const scenarioCount = extractScenarios(text).length;
  if (scenarioCount >= 3) strengths.push(`✅ ${scenarioCount} Gherkin scenarios defined.`);
  else penalize(5, `⚠️ Only ${scenarioCount} named Gherkin scenario(s); define at least Happy Path, Negative Path, and an Edge Case.`);

  // 11. Data dictionary
  if (/\|\s*Field(\s+Name)?\s*\|/i.test(text) && /Data\s+Type/i.test(text)) strengths.push('✅ Contains a data dictionary.');
  else penalize(5, '⚠️ Missing data dictionary (Field Name | Data Type | Nullability | Validation | Sensitive).');

  // 12. Scope boundaries
  if (/non-goals|out-of-scope|out of scope/i.test(text)) strengths.push('✅ Declares explicit scope boundaries / non-goals.');
  else penalize(5, '⚠️ Missing explicit Non-Goals / Out-of-Scope list.');

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
