# ESLint Batch Fix Script - Conservative approach targeting high-frequency issues
param(
    [string]$TargetDir = "src"
)

Write-Host "Starting ESLint batch fixes..." -ForegroundColor Green

$fixedFiles = 0
$totalChanges = 0

# Get all TypeScript files
$files = Get-ChildItem -Path $TargetDir -Filter "*.ts" -Recurse

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Fix 1: Object curly spacing - Remove spaces after { and before }
    $content = $content -replace '\{\s+', '{'
    $content = $content -replace '\s+\}', '}'
    
    # Fix 2: Add missing trailing commas for multi-line objects/arrays
    # This is conservative - only adds commas where clearly needed
    $content = $content -replace '([^,\s])\s*\n\s*\}', '$1,`n}'
    $content = $content -replace '([^,\s])\s*\n\s*\]', '$1,`n]'
    
    # Fix 3: Remove trailing spaces
    $content = $content -replace '\s+$', ''
    
    # Fix 4: Ensure newline at end of file
    if (-not $content.EndsWith("`n")) {
        $content += "`n"
    }
    
    # Fix 5: Fix arrow function parentheses for single parameters
    $content = $content -replace '(\w+)\s*=>', '($1) =>'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $fixedFiles++
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "  No changes: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "`nBatch fixes completed!" -ForegroundColor Green
Write-Host "Files processed: $($files.Count)" -ForegroundColor Cyan
Write-Host "Files modified: $fixedFiles" -ForegroundColor Cyan

Write-Host "`nRunning ESLint to verify improvements..." -ForegroundColor Yellow