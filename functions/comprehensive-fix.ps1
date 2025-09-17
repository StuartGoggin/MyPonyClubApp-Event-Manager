# Fix ESLint errors systematically
Write-Host "Starting comprehensive ESLint fixes..."

$functionsSrc = "O:\creations\MyPonyClubApp-Event-Manager-1\functions\src"
$tsFiles = Get-ChildItem -Path $functionsSrc -Filter "*.ts" -Recurse

foreach ($file in $tsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($null -eq $content) { continue }
    
    $original = $content
    
    # 1. Fix object curly spacing: { content } -> {content}
    $content = $content -replace '\{\s+([^}]+?)\s+\}', '{$1}'
    
    # 2. Remove trailing spaces
    $lines = $content -split "`n"
    $content = ($lines | ForEach-Object { $_ -replace '\s+$', '' }) -join "`n"
    
    # 3. Fix quotes - comprehensive
    $content = $content -replace "'([^']*)'", '"$1"'
    
    # 4. Add missing trailing commas in simple cases
    $content = $content -replace '([^,\s\n])\s*\n\s*\}', '$1,`n}'
    $content = $content -replace '([^,\s\n])\s*\n\s*\]', '$1,`n]'
    
    # 5. Fix arrow function parentheses
    $content = $content -replace '\.map\(([a-zA-Z_][a-zA-Z0-9_]*)\s*=>', '.map(($1) =>'
    $content = $content -replace '\.filter\(([a-zA-Z_][a-zA-Z0-9_]*)\s*=>', '.filter(($1) =>'
    $content = $content -replace '\.find\(([a-zA-Z_][a-zA-Z0-9_]*)\s*=>', '.find(($1) =>'
    $content = $content -replace '\.forEach\(([a-zA-Z_][a-zA-Z0-9_]*)\s*=>', '.forEach(($1) =>'
    
    # 6. Fix indentation (basic 2-space to 2-space consistency)
    $lines = $content -split "`n"
    $fixedLines = @()
    foreach ($line in $lines) {
        if ($line -match '^(\s*)(.*)$') {
            $indent = $matches[1]
            $code = $matches[2]
            # Convert tabs to spaces and fix multiples of 4 to multiples of 2
            $spaces = $indent -replace "`t", "  "
            if ($spaces.Length -ge 4 -and $spaces.Length % 4 -eq 0) {
                $spaces = "  " * ($spaces.Length / 2)
            }
            $fixedLines += $spaces + $code
        } else {
            $fixedLines += $line
        }
    }
    $content = $fixedLines -join "`n"
    
    # 7. Ensure file ends with newline
    if (-not $content.EndsWith("`n")) {
        $content += "`n"
    }
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Comprehensive fixes completed!"