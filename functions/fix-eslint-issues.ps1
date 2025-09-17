# Comprehensive ESLint fixes for TypeScript files

Write-Host "=== Comprehensive ESLint Fix Script ===" -ForegroundColor Green

$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix object curly spacing - remove spaces after { and before }
    $content = $content -replace '{\s+', '{'
    $content = $content -replace '\s+}', '}'
    
    # Fix trailing spaces
    $content = $content -replace '\s+$', ''
    
    # Fix missing trailing commas in objects and arrays (be conservative)
    $content = $content -replace '([^,\s])\s*\n\s*([}\]])', '$1,$2'
    
    # Fix single quotes to double quotes (conservative)
    $content = $content -replace "([^a-zA-Z_])\'([^'`n]*?)\'([^a-zA-Z_])", '$1"$2"$3'
    
    # Fix arrow function parentheses
    $content = $content -replace '(\w+)\s*=>\s*', '($1) => '
    
    # Convert CRLF to LF
    $content = $content -replace "`r`n", "`n"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Modified" -ForegroundColor Green
    } else {
        Write-Host "  - No changes" -ForegroundColor Gray
    }
}

Write-Host "=== Fix completed ===" -ForegroundColor Green