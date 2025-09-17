# Safe Line Ending and Quote Fix Script
param(
    [string]$TargetDir = "src"
)

Write-Host "Starting safe ESLint fixes..." -ForegroundColor Green

$fixedFiles = 0

# Get all TypeScript files
$files = Get-ChildItem -Path $TargetDir -Filter "*.ts" -Recurse

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Fix 1: Convert CRLF to LF line endings
    $content = $content -replace "`r`n", "`n"
    
    # Fix 2: Convert single quotes to double quotes (but be careful with nested quotes)
    # Only replace single quotes that are clearly string delimiters
    $content = $content -replace "([^a-zA-Z_])\'([^'`n]+)\'([^a-zA-Z_])", '$1"$2"$3'
    
    # Fix 3: Ensure newline at end of file
    if (-not $content.EndsWith("`n")) {
        $content += "`n"
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $fixedFiles++
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "  No changes: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "`nSafe fixes completed!" -ForegroundColor Green
Write-Host "Files processed: $($files.Count)" -ForegroundColor Cyan
Write-Host "Files modified: $fixedFiles" -ForegroundColor Cyan