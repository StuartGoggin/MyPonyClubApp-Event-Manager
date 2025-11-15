# PowerShell script to sync Equestrian Victoria events from JSON file
# Usage: .\sync-ev-events.ps1

$jsonFile = ".\equestrian_events_2026.json"

# Check if file exists
if (-Not (Test-Path $jsonFile)) {
    Write-Host "Error: JSON file not found at $jsonFile" -ForegroundColor Red
    Write-Host "Please ensure equestrian_events_2026.json is in the current directory" -ForegroundColor Yellow
    exit 1
}

# Read JSON file
Write-Host "Reading EV events from $jsonFile..." -ForegroundColor Cyan
$eventsJson = Get-Content $jsonFile -Raw

# API endpoint (update this to your deployed URL or use localhost for testing)
$apiUrl = "http://localhost:3000/api/admin/sync-ev-events"
# For deployed version, use:
# $apiUrl = "https://your-app.web.app/api/admin/sync-ev-events"

Write-Host "Syncing events to $apiUrl..." -ForegroundColor Cyan

try {
    # Make POST request
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $eventsJson -ContentType "application/json"
    
    Write-Host "`nSync completed successfully!" -ForegroundColor Green
    Write-Host "Results:" -ForegroundColor Cyan
    Write-Host "  Message: $($response.message)" -ForegroundColor White
    Write-Host "  Total events: $($response.stats.total)" -ForegroundColor White
    Write-Host "  Added: $($response.stats.added)" -ForegroundColor Green
    Write-Host "  Updated: $($response.stats.updated)" -ForegroundColor Yellow
    Write-Host "  Deleted: $($response.stats.deleted)" -ForegroundColor Red
    Write-Host "  Unchanged: $($response.stats.unchanged)" -ForegroundColor Gray
    
    if ($response.errors -and $response.errors.Count -gt 0) {
        Write-Host "`nErrors encountered:" -ForegroundColor Yellow
        foreach ($error in $response.errors) {
            Write-Host "  - $error" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "`nError syncing events:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nAPI Response:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
    
    exit 1
}
