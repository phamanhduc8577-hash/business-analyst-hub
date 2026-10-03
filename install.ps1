# ==============================================================================
# AI Business Analyst (BA) Skill Installer for Windows PowerShell
# Repository: https://github.com/phamanhduc8577-hash/business-analyst-hub
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "🏛️ Installing AI Business Analyst Skill for Claude Code..." -ForegroundColor Cyan

$TargetDir = Join-Path $HOME ".claude\skills\ai-business-analyst"
if (!(Test-Path -Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$LocalSkill = ".\.claude\skills\ai-business-analyst\SKILL.md"
$RawUrl = "https://raw.githubusercontent.com/phamanhduc8577-hash/business-analyst-hub/master/.claude/skills/ai-business-analyst/SKILL.md"
$Destination = Join-Path $TargetDir "SKILL.md"

if (Test-Path -Path $LocalSkill) {
    Write-Host "📦 Copying from local repository..." -ForegroundColor Yellow
    Copy-Item -Path $LocalSkill -Destination $Destination -Force
} else {
    Write-Host "🌐 Downloading from GitHub repository..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $RawUrl -OutFile $Destination -UseBasicParsing
}

Write-Host "✅ AI Business Analyst Skill installed successfully to: $Destination" -ForegroundColor Green
Write-Host "🚀 You can now invoke the skill in Claude Code using: /ai-business-analyst" -ForegroundColor Cyan
