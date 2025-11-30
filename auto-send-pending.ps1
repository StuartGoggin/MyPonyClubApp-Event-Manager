# Auto-Send Pending Emails Script
# This script processes all pending emails in the queue and attempts to send them

Write-Host "🚀 Auto-Send Pending Emails Utility" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
$devServerRunning = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*9002*" -or $_.CommandLine -like "*dev*" }

if (-not $devServerRunning) {
    Write-Host "⚠️  Warning: Development server does not appear to be running on port 9002" -ForegroundColor Yellow
    Write-Host "   Please start the dev server first: npm run dev" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📧 Processing pending emails..." -ForegroundColor Cyan
Write-Host ""

# Run the Node.js script
node scripts/auto-send-pending-emails.js

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green
