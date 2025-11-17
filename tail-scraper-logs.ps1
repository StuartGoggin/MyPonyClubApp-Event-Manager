# Tail EV Events Scraper Logs - Simple Version
# Shows the most recent logs and follows new entries

param(
    [int]$Lines = 100,
    [switch]$Follow,
    [string]$Search = ""
)

Write-Host "EV Events Scraper Logs (Latest $Lines entries)" -ForegroundColor Cyan
Write-Host ""

if ($Search) {
    Write-Host "Filtering for: '$Search'" -ForegroundColor Yellow
    Write-Host ""
    
    gcloud functions logs read scrapeEquestrianEvents `
        --limit=$Lines `
        --project=ponyclub-events `
        --region=asia-east1 `
        --format='value(timestamp,severity,log)' | 
        Select-String -Pattern $Search -Context 0 |
        ForEach-Object {
            $line = $_.Line
            if ($line -match 'ERROR|WARN') {
                Write-Host $line -ForegroundColor Red
            } elseif ($line -match 'INFO') {
                Write-Host $line -ForegroundColor Green
            } elseif ($line -match 'DEBUG') {
                Write-Host $line -ForegroundColor Gray
            } else {
                Write-Host $line
            }
        }
} else {
    gcloud functions logs read scrapeEquestrianEvents `
        --limit=$Lines `
        --project=ponyclub-events `
        --region=asia-east1 `
        --format='value(timestamp,severity,log)' |
        ForEach-Object {
            if ($_ -match 'ERROR|WARN') {
                Write-Host $_ -ForegroundColor Red
            } elseif ($_ -match 'INFO') {
                Write-Host $_ -ForegroundColor Green
            } elseif ($_ -match 'DEBUG') {
                Write-Host $_ -ForegroundColor Gray
            } else {
                Write-Host $_
            }
        }
}

Write-Host ""
Write-Host "-------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "  - To search: .\tail-scraper-logs.ps1 -Search 'geocod'" -ForegroundColor Gray
Write-Host "  - More lines: .\tail-scraper-logs.ps1 -Lines 200" -ForegroundColor Gray
Write-Host "  - Watch live: .\watch-scraper-logs.ps1" -ForegroundColor Gray
Write-Host "-------------------------------------------------------------" -ForegroundColor DarkGray
