import fs from 'fs';
import path from 'path';

console.log('🧪 Running Comprehensive AI BA Skill Test Suite...\n');

let failedTests = 0;
let passedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// 1. Check Skill file existence & Frontmatter
console.log('1️⃣ Testing Claude Code Skill Package Format:');
const skillPath = path.join(process.cwd(), '.claude/skills/ai-business-analyst/SKILL.md');
assert(fs.existsSync(skillPath), 'SKILL.md exists in .claude/skills/ai-business-analyst/');

const skillContent = fs.readFileSync(skillPath, 'utf8');
assert(skillContent.includes('name: ai-business-analyst'), 'Skill frontmatter contains valid name');
assert(skillContent.includes('description:'), 'Skill frontmatter contains description');
assert(skillContent.includes('user-invocable: true'), 'Skill is user-invocable');
assert(skillContent.includes('EARS'), 'Skill enforces EARS specification');
assert(skillContent.includes('Gherkin BDD'), 'Skill enforces Gherkin BDD acceptance criteria');
assert(skillContent.includes('Mermaid'), 'Skill includes Mermaid.js visual modeling');

// 2. Check Cursor & Windsurf rules
console.log('\n2️⃣ Testing Cursor / Windsurf Rules Compatibility:');
const cursorRulePath = path.join(process.cwd(), '.cursor/rules/ai-business-analyst.mdc');
const cursorRulesPath = path.join(process.cwd(), '.cursorrules');

assert(fs.existsSync(cursorRulePath), '.cursor/rules/ai-business-analyst.mdc exists');
assert(fs.existsSync(cursorRulesPath), '.cursorrules exists for universal IDE support');

// 3. Check Installer Scripts
console.log('\n3️⃣ Testing Installer Scripts:');
const shPath = path.join(process.cwd(), 'install.sh');
const ps1Path = path.join(process.cwd(), 'install.ps1');

assert(fs.existsSync(shPath), 'install.sh exists');
assert(fs.existsSync(ps1Path), 'install.ps1 exists');

const shContent = fs.readFileSync(shPath, 'utf8');
assert(shContent.includes('.claude/skills/ai-business-analyst'), 'install.sh targets standard ~/.claude/skills location');

// 4. Validate Template Dependencies
console.log('\n4️⃣ Testing Required BA Templates & Guidelines:');
const templates = [
  '01-elicitation/CHECKLIST-ELICITATION.md',
  '02-templates/prd/PRD-TEMPLATE.md',
  '02-templates/frd-srs/SRS-FRD-TEMPLATE.md',
  '02-templates/rtm/RTM-TEMPLATE.md',
  '03-modeling-and-specs/mermaid-diagrams/MERMAID-MODELING-GUIDE.md',
  '03-modeling-and-specs/gherkin-bdd/GHERKIN-BDD-GUIDELINES.md',
  '04-data-dictionary/DATA-DICTIONARY-TEMPLATE.md'
];

templates.forEach(t => {
  const p = path.join(process.cwd(), t);
  assert(fs.existsSync(p), `Template exists: ${t}`);
});

// 5. Test Mermaid Diagram Syntaxes in guides
console.log('\n5️⃣ Testing Mermaid Diagram Syntaxes in Docs:');
const mermaidGuide = fs.readFileSync(path.join(process.cwd(), '03-modeling-and-specs/mermaid-diagrams/MERMAID-MODELING-GUIDE.md'), 'utf8');
assert(mermaidGuide.includes('flowchart TD'), 'Flowchart syntax present');
assert(mermaidGuide.includes('sequenceDiagram'), 'Sequence diagram syntax present');
assert(mermaidGuide.includes('erDiagram'), 'ER diagram syntax present');
assert(mermaidGuide.includes('stateDiagram-v2'), 'State diagram syntax present');

// 6. Test Elicitation Simulation
console.log('\n6️⃣ Simulating Skill Output Consistency:');
const prdTemplate = fs.readFileSync(path.join(process.cwd(), '02-templates/prd/PRD-TEMPLATE.md'), 'utf8');
assert(prdTemplate.includes('WHEN'), 'EARS Event-driven syntax verified in PRD template');
assert(prdTemplate.includes('Scenario:'), 'Gherkin Scenario syntax verified in PRD template');
assert(prdTemplate.includes('RTM'), 'RTM section present in PRD template');

console.log(`\n========================================`);
console.log(`Total: ${passedTests + failedTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log(`========================================`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Skill Package tests passed with 0 errors!\n');
}
