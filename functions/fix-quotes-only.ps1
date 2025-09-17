# PowerShell script to fix ESLint quote errors by converting single quotes to double quotes
# This script is more conservative and only fixes quote issues

# Get all TypeScript files
$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse

Write-Host "Found $($files.Count) TypeScript files"

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    try {
        # Read the file content
        $content = Get-Content -Path $file.FullName -Raw
        
        if ($content) {
            # Replace single quotes with double quotes, but be careful about:
            # 1. Quotes within strings
            # 2. Template literals
            # 3. Comments
            
            # Simple approach: replace single quotes that are likely string delimiters
            # This pattern looks for single quotes that are likely string boundaries
            $content = $content -replace "(?<!\\)'([^'`n]*)'(?!')", '"$1"'
            
            # Handle import/export statements more specifically
            $content = $content -replace "import\s+([^'`n]*)'([^'`n]*)';", 'import $1"$2";'
            $content = $content -replace "from\s+'([^'`n]*)'", 'from "$1"'
            $content = $content -replace "require\s*\(\s*'([^'`n]*)'\s*\)", 'require("$1")'
            
            # Write back to file
            $content | Set-Content -Path $file.FullName -NoNewline
            Write-Host "  Updated quotes"
        }
    }
    catch {
        Write-Host "  Error processing file: $_" -ForegroundColor Red
    }
}

Write-Host "Quote fixing completed!" -ForegroundColor Green