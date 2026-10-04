#!/usr/bin/env node
/**
 * ba-hub CLI Installer & Generator
 * Zero external dependencies.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0] || 'help';

function copyFileSafe(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✅ Installed: ${dest}`);
}

function installSkills() {
  console.log('🏛️ Installing AI Business Analyst Skill into your workspace/environment...\n');

  const cwd = process.cwd();
  const homeDir = os.homedir();

  // 1. Install Claude Code Global Skill
  const globalClaudeSkillDir = path.join(homeDir, '.claude', 'skills', 'ai-business-analyst');
  const sourceSkill = path.join(rootDir, '.claude', 'skills', 'ai-business-analyst', 'SKILL.md');
  if (fs.existsSync(sourceSkill)) {
    copyFileSafe(sourceSkill, path.join(globalClaudeSkillDir, 'SKILL.md'));
  }

  // 2. Install Cursor rule into current workspace
  const sourceCursorMdc = path.join(rootDir, '.cursor', 'rules', 'ai-business-analyst.mdc');
  if (fs.existsSync(sourceCursorMdc)) {
    copyFileSafe(sourceCursorMdc, path.join(cwd, '.cursor', 'rules', 'ai-business-analyst.mdc'));
  }

  // 3. Install Windsurf .cursorrules into current workspace
  const sourceCursorrules = path.join(rootDir, '.cursorrules');
  if (fs.existsSync(sourceCursorrules)) {
    copyFileSafe(sourceCursorrules, path.join(cwd, '.cursorrules'));
  }

  console.log('\n🎉 Setup Complete!');
  console.log('👉 Claude Code: Type `/ai-business-analyst [topic]`');
  console.log('👉 Cursor / Windsurf: Rules are active in your AI Composer / Chat.');
}

function showHelp() {
  console.log(`
🏛️ Business Analyst Hub CLI (ba-hub)

Usage:
  npx @phamanhduc/ba-hub init       Install skill into Claude Code (~/.claude) & current workspace (.cursor/.cursorrules)
  npx @phamanhduc/ba-hub mcp        Show Claude Desktop MCP Server configuration JSON
  npx @phamanhduc/ba-hub --version  Show version
  npx @phamanhduc/ba-hub --help     Show this help message
`);
}

function showMcpConfig() {
  const mcpPath = path.resolve(rootDir, 'mcp-server', 'index.js').replace(/\\/g, '/');
  console.log(`
Add this snippet to your Claude Desktop config (claude_desktop_config.json):

{
  "mcpServers": {
    "business-analyst-hub": {
      "command": "node",
      "args": ["${mcpPath}"]
    }
  }
}
`);
}

switch (command) {
  case 'init':
  case 'install':
    installSkills();
    break;
  case 'mcp':
    showMcpConfig();
    break;
  case '-v':
  case '--version':
    console.log('1.0.0');
    break;
  case 'help':
  case '--help':
  default:
    showHelp();
    break;
}
