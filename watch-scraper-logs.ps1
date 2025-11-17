# Watch EV Events Scraper Logs
# This script continuously monitors the Cloud Functions logs for the scraper

param(
    [int]$RefreshSeconds = 5,
    [string]$Filter = ""
)

Write-Host "Monitoring EV Events Scraper Logs..." -ForegroundColor Cyan
Write-Host "Refresh interval: $RefreshSeconds seconds" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$lastTimestamp = Get-Date

while ($true) {
    $currentTime = Get-Date
    
    # Get logs since last check
    $logs = gcloud functions logs read scrapeEquestrianEvents `
        --limit=50 `
        --project=ponycloud-events `
        --region=asia-east1 `
        --format='table(timestamp,severity,log)' 2>$null
    
    if ($logs) {
        # Parse and display new logs
        $logLines = $logs -split "`n"
        
        foreach ($line in $logLines) {
            if ($line -match '^\s*$') { continue }
            if ($line -match '^TIMESTAMP') { continue }
            
            # Apply filter if specified
            if ($Filter -and $line -notmatch $Filter) { continue }
            
            # Color code by severity
            if ($line -match '\bERROR\b|\bE\b') {
                Write-Host $line -ForegroundColor Red
            }
            elseif ($line -match '\bWARNING\b|\bW\b') {
                Write-Host $line -ForegroundColor Yellow
            }
            elseif ($line -match '\bINFO\b|\bI\b') {
                Write-Host $line -ForegroundColor Green
            }
            elseif ($line -match '\bDEBUG\b|\bD\b') {
                Write-Host $line -ForegroundColor Gray
            }
            else {
                Write-Host $line
            }
        }
    }
    
    Write-Host ""
    Write-Host "-------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "Last check: $currentTime | Next check in $RefreshSeconds seconds..." -ForegroundColor DarkGray
    Write-Host "-------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
    
    Start-Sleep -Seconds $RefreshSeconds
}
