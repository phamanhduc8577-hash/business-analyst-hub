#!/usr/bin/env node
/**
 * Spec linter (zero dependencies).
 *
 * All markdown under docs/:
 *   - every requirement row (| **REQ-XXX-01** | *Pattern* | `statement` |) is valid EARS,
 *     its declared pattern label matches the detected pattern, and IDs are unique per file.
 *
 * Master specs (files containing a "10-Point ... Risk" section) additionally must have:
 *   - all required sections and the 4 Mermaid diagram types (sequenceDiagram with autonumber),
 *   - 10 risk rows, each linked to existing REQ IDs,
 *   - no references to undefined REQ IDs anywhere in the file,
 *   - an RTM covering every REQ, with a coverage note whose count matches,
 *   - ≥ 6 Gherkin scenarios, each tagged @TC-*, tags unique and present in the RTM,
 *     and every RTM test case backed by a scenario unless marked "non-BDD",
 *   - an audit_prd_quality score ≥ 85.
 *
 * Usage: node scripts/lint-specs.mjs [file-or-dir ...]   (default: docs)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  auditPrdQuality,
  validateEars,
  extractRequirementRows,
  extractSection,
  extractScenarios
} from '../mcp-server/lib.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_SCENARIOS = 6;
const MIN_AUDIT_SCORE = 85;

const REQUIRED_SECTIONS = [
  ['Business Context & Scope', /Business Context/i],
  ['10-Point Risk Audit', /10-Point.*Risk/i],
  ['Visual Models', /Visual Models/i],
  ['EARS Requirements', /EARS/i],
  ['Gherkin BDD', /Gherkin/i],
  ['Non-Functional Requirements', /Non-Functional/i],
  ['Data Dictionary', /Data Dictionary/i],
  ['Traceability Matrix', /Traceability/i],
  ['Open Elicitation Questions', /Open Elicitation/i],
  ['Glossary & Cross-References', /Glossary/i]
];
const REQUIRED_DIAGRAMS = [
  ['flowchart', /```mermaid\s+flowchart/],
  ['sequenceDiagram with autonumber', /```mermaid\s+sequenceDiagram\s+autonumber/],
  ['stateDiagram-v2', /```mermaid\s+stateDiagram-v2/],
  ['erDiagram', /```mermaid\s+erDiagram/]
];

function collectMarkdown(target) {
  const abs = path.resolve(repoRoot, target);
  if (!fs.existsSync(abs)) throw new Error(`Path not found: ${target}`);
  if (fs.statSync(abs).isFile()) return [abs];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(abs, e.name);
    if (e.isDirectory()) return collectMarkdown(p);
    return e.name.endsWith('.md') ? [p] : [];
  });
}

function lintRequirements(text) {
  const errors = [];
  const rows = extractRequirementRows(text);
  const seen = new Set();
  for (const { id, label, statement } of rows) {
    if (seen.has(id)) errors.push(`${id}: duplicate requirement ID`);
    seen.add(id);
    const r = validateEars(statement);
    if (!r.isValidEARS) errors.push(`${id}: not valid EARS — "${statement.slice(0, 70)}…"`);
    else if (label && r.patternLabel !== label) errors.push(`${id}: labeled "${label}" but statement is ${r.patternLabel}`);
  }
  return { rows, errors };
}

function lintMasterSpec(text, rows) {
  const errors = [];
  const reqIds = rows.map((r) => r.id);

  for (const [name, re] of REQUIRED_SECTIONS) {
    if (!extractSection(text, re)) errors.push(`missing section: ${name}`);
  }
  for (const [name, re] of REQUIRED_DIAGRAMS) {
    if (!re.test(text)) errors.push(`missing Mermaid diagram: ${name}`);
  }

  const dangling = [...new Set([...text.matchAll(/\bREQ-[A-Z]+-\d+\b/g)].map((m) => m[0]))].filter((id) => !reqIds.includes(id));
  if (dangling.length) errors.push(`references to undefined requirements: ${dangling.join(', ')}`);

  const risk = extractSection(text, /10-Point.*Risk/i);
  const riskRows = risk.split(/\r?\n/).filter((l) => /^\|\s*\*\*\d+\./.test(l));
  if (riskRows.length !== 10) errors.push(`risk audit has ${riskRows.length} rows (expected 10)`);
  riskRows.forEach((l, i) => {
    if (!/REQ-[A-Z]+-\d+/.test(l)) errors.push(`risk row ${i + 1} has no linked REQ-ID`);
  });

  const rtm = extractSection(text, /Traceability/i);
  const untraced = reqIds.filter((id) => !rtm.includes(id));
  if (untraced.length) errors.push(`requirements missing from RTM: ${untraced.join(', ')}`);
  const coverage = rtm.match(/all (\d+) requirements/);
  if (!coverage) errors.push('RTM has no "all N requirements" coverage note');
  else if (Number(coverage[1]) !== reqIds.length) errors.push(`RTM coverage note says ${coverage[1]} requirements, spec defines ${reqIds.length}`);

  const scenarios = extractScenarios(extractSection(text, /Gherkin/i));
  if (scenarios.length < MIN_SCENARIOS) errors.push(`${scenarios.length} Gherkin scenarios (minimum ${MIN_SCENARIOS})`);
  const tags = scenarios.flatMap((s) => s.tags.filter((t) => /^TC-/.test(t)));
  scenarios.filter((s) => !s.tags.some((t) => /^TC-/.test(t))).forEach((s) => errors.push(`untagged scenario: "${s.title}"`));
  const dupTags = tags.filter((t, i) => tags.indexOf(t) !== i);
  if (dupTags.length) errors.push(`duplicate scenario tags: ${[...new Set(dupTags)].join(', ')}`);

  const rtmTcs = new Set([...rtm.matchAll(/\bTC-[A-Z]+-\d+\b/g)].map((m) => m[0]));
  const nonBdd = new Set([...rtm.matchAll(/(TC-[A-Z]+-\d+)`?\s*\([^)]*non-BDD/g)].map((m) => m[1]));
  tags.filter((t) => !rtmTcs.has(t)).forEach((t) => errors.push(`scenario tag ${t} not referenced in RTM`));
  [...rtmTcs].filter((t) => !tags.includes(t) && !nonBdd.has(t)).forEach((t) => errors.push(`RTM test case ${t} has no tagged scenario (mark it "non-BDD" if intentional)`));

  const audit = auditPrdQuality(text);
  if (audit.score < MIN_AUDIT_SCORE) errors.push(`audit_prd_quality score ${audit.score} < ${MIN_AUDIT_SCORE}: ${audit.issues.join(' | ')}`);

  return { errors, scenarios: scenarios.length, audit: audit.score };
}

const targets = process.argv.slice(2);
const files = (targets.length ? targets : ['docs']).flatMap(collectMarkdown);
let failedFiles = 0;
let checkedReqs = 0;
let masterSpecs = 0;

for (const file of files) {
  const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  const { rows, errors } = lintRequirements(text);
  checkedReqs += rows.length;
  const isMaster = Boolean(extractSection(text, /10-Point.*Risk/i));
  let summary = rows.length ? `${rows.length} REQ` : '';

  if (isMaster) {
    masterSpecs++;
    const m = lintMasterSpec(text, rows);
    errors.push(...m.errors);
    summary += `, ${m.scenarios} scenarios, audit ${m.audit}`;
  }
  if (!rows.length && !isMaster) continue;

  if (errors.length) {
    failedFiles++;
    console.error(`❌ ${rel} (${summary})`);
    errors.forEach((e) => console.error(`   - ${e}`));
  } else {
    console.log(`✅ ${rel} (${summary}${isMaster ? ', master spec' : ''})`);
  }
}

console.log(`\n${checkedReqs} requirements in ${files.length} markdown files checked; ${masterSpecs} master specs; ${failedFiles} file(s) failed.`);
process.exit(failedFiles ? 1 : 0);
