#!/usr/bin/env bash
# ==============================================================================
# AI Business Analyst (BA) Skill Installer for Claude Code & AI Agents
# Repository: https://github.com/phamanhduc/ba-knowledge-hub
# ==============================================================================

set -e

echo "🏛️ Installing AI Business Analyst Skill..."

# Define destination directory
TARGET_DIR="${HOME}/.claude/skills/ai-business-analyst"
mkdir -p "${TARGET_DIR}"

# Source URL
RAW_URL="https://raw.githubusercontent.com/phamanhduc/ba-knowledge-hub/master"

# If running locally inside repo
if [ -f "./.claude/skills/ai-business-analyst/SKILL.md" ]; then
    echo "📦 Copying from local repository..."
    cp ./.claude/skills/ai-business-analyst/SKILL.md "${TARGET_DIR}/SKILL.md"
else
    echo "🌐 Downloading from GitHub repository..."
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "${RAW_URL}/.claude/skills/ai-business-analyst/SKILL.md" -o "${TARGET_DIR}/SKILL.md"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "${TARGET_DIR}/SKILL.md" "${RAW_URL}/.claude/skills/ai-business-analyst/SKILL.md"
    else
        echo "❌ Error: Neither curl nor wget found."
        exit 1
    fi
fi

# Also configure Cursor / Windsurf rules if in a workspace
if [ -d "./.cursor" ] && [ ! -f "./.cursor/rules/ai-business-analyst.mdc" ]; then
    echo "⚙️ Adding Cursor rule to current workspace..."
    mkdir -p .cursor/rules
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "${RAW_URL}/.cursor/rules/ai-business-analyst.mdc" -o "./.cursor/rules/ai-business-analyst.mdc"
    fi
fi

echo "✅ AI Business Analyst Skill installed successfully to: ${TARGET_DIR}/SKILL.md"
echo "🚀 You can now invoke the skill in Claude Code using: /ai-business-analyst"
