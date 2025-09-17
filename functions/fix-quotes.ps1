# PowerShell script to fix single quotes to double quotes in TypeScript files

$functionsSrc = "O:\creations\MyPonyClubApp-Event-Manager-1\functions\src"

# Get all TypeScript files recursively
$tsFiles = Get-ChildItem -Path $functionsSrc -Filter "*.ts" -Recurse

foreach ($file in $tsFiles) {
    Write-Host "Processing: $($file.FullName)"
    
    # Read file content
    $content = Get-Content -Path $file.FullName -Raw
    
    # Replace single quotes with double quotes (being careful about escaped quotes and strings)
    # This is a simple replacement - more complex patterns might need regex
    $originalContent = $content
    
    # Replace simple single quotes with double quotes
    # Avoid replacing quotes inside comments or already double-quoted strings
    $content = $content -replace "import \{ (.+?) \} from '(.+?)';", 'import {$1} from "$2";'
    $content = $content -replace "import (.+?) from '(.+?)';", 'import $1 from "$2";'
    $content = $content -replace "from '(.+?)'", 'from "$1"'
    
    # Replace single quotes in string literals (simple cases)
    $content = $content -replace "errors\.push\('(.+?)'\)", 'errors.push("$1")'
    $content = $content -replace "console\.log\('(.+?)'\)", 'console.log("$1")'
    $content = $content -replace "throw new Error\('(.+?)'\)", 'throw new Error("$1")'
    
    # Replace string literals in object properties
    $content = $content -replace ": '([^']+?)'", ': "$1"'
    $content = $content -replace "'([^']+?)': ", '"$1": '
    
    # Fix common patterns
    $content = $content -replace "role: '(.+?)'", 'role: "$1"'
    $content = $content -replace "type: '(.+?)'", 'type: "$1"'
    $content = $content -replace "status: '(.+?)'", 'status: "$1"'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed quotes in: $($file.Name)"
    }
}

Write-Host "Quote fixing completed!"