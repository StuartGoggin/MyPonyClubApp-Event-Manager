# =========================================================
# Purge Test Emails Script
# =========================================================
# 
# Deletes all emails from the email queue that have 
# stuart.goggin@gmail.com in the 'to' array.
#
# Usage: .\purge-test-emails.ps1
# =========================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🗑️  PURGE TEST EMAILS FROM QUEUE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js script exists
$scriptPath = ".\scripts\purge-test-emails.js"
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Error: Script not found at $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  WARNING: This will permanently delete all emails with stuart.goggin@gmail.com" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host ""
    Write-Host "❌ Operation cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Running purge script..." -ForegroundColor Green
Write-Host ""

# Run the Node.js script
node $scriptPath

Write-Host ""
Write-Host "✅ Purge operation completed!" -ForegroundColor Green
Write-Host ""
