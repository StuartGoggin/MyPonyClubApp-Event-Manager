# PowerShell script to fix remaining linting issues

$functionsSrc = "O:\creations\MyPonyClubApp-Event-Manager-1\functions\src"

# Get all TypeScript files recursively
$tsFiles = Get-ChildItem -Path $functionsSrc -Filter "*.ts" -Recurse

foreach ($file in $tsFiles) {
    Write-Host "Processing: $($file.FullName)"
    
    # Read file content
    $content = Get-Content -Path $file.FullName -Raw
    
    if ($null -eq $content) {
        Write-Host "  Skipping empty file"
        continue
    }
    
    $originalContent = $content
    
    # Fix more quote patterns
    $content = $content -replace "`": '([^']*)'", '": "$1"'
    $content = $content -replace "= '([^']*)'", '= "$1"'
    $content = $content -replace "\('([^']*)'\)", '("$1")'
    $content = $content -replace "catch \(([^)]*)\) \{`n\s*throw new Error\('([^']*)'\)", 'catch ($1) {`n    throw new Error("$2")'
    $content = $content -replace "throw new Error\('([^']*)'\)", 'throw new Error("$1")'
    $content = $content -replace "console\.(log|error|warn|info)\('([^']*)'\)", 'console.$1("$2")'
    
    # Fix object spacing issues
    $content = $content -replace "\{ ([^}]+) \}", '{$1}'
    
    # Fix trailing commas in simple cases
    $content = $content -replace "([^,\s])\s*\n\s*\}", '$1,`n}'
    
    # Fix arrow function parentheses
    $content = $content -replace "=> ([a-zA-Z_][a-zA-Z0-9_]*) =>", '=> ($1) =>'
    $content = $content -replace "\.map\(([a-zA-Z_][a-zA-Z0-9_]*) =>", '.map(($1) =>'
    $content = $content -replace "\.filter\(([a-zA-Z_][a-zA-Z0-9_]*) =>", '.filter(($1) =>'
    $content = $content -replace "\.find\(([a-zA-Z_][a-zA-Z0-9_]*) =>", '.find(($1) =>'
    
    # Remove trailing spaces (simple pattern)
    $content = $content -replace " +`r?`n", "`n"
    
    # Ensure file ends with newline
    if (-not $content.EndsWith("`n")) {
        $content += "`n"
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed issues in: $($file.Name)"
    }
}

Write-Host "Additional fixes completed!"