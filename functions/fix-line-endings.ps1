Get-ChildItem "src" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content) {
        $content = $content -replace "`r`n", "`n"
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}