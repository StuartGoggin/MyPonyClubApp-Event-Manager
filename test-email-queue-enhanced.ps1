# Enhanced Email Queue Testing Script
# Run this in PowerShell to test all functionality

$baseUrl = "http://localhost:9002"
$headers = @{"Authorization" = "Bearer dev-admin-token"}

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Email Queue Management System - Test Suite" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n1. 🔍 Health Check:" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET | ConvertFrom-Json
    Write-Host "   ✅ System Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✅ Database: $($health.database.status)" -ForegroundColor Green
    Write-Host "   ✅ Database Test: $($health.database.test)" -ForegroundColor Green
    Write-Host "   ✅ Service Account: $($health.environment.hasServiceAccount)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Configuration Test
Write-Host "`n2. ⚙️  Configuration Management:" -ForegroundColor Yellow
try {
    $config = Invoke-WebRequest -Uri "$baseUrl/api/email-queue/config" -Headers $headers -Method GET | ConvertFrom-Json
    Write-Host "   ✅ Config loaded successfully" -ForegroundColor Green
    Write-Host "   📋 Require Approval: $($config.requireApproval)" -ForegroundColor Cyan
    Write-Host "   📋 Max Retries: $($config.maxRetries)" -ForegroundColor Cyan
    Write-Host "   📋 Default Priority: $($config.defaultPriority)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Config test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   ℹ️  Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
}

# 3. Queue Operations  
Write-Host "`n3. 📧 Queue Operations:" -ForegroundColor Yellow
try {
    $queue = Invoke-WebRequest -Uri "$baseUrl/api/email-queue" -Headers $headers -Method GET | ConvertFrom-Json
    Write-Host "   ✅ Queue accessed successfully" -ForegroundColor Green
    Write-Host "   📊 Total emails: $($queue.emails.Count)" -ForegroundColor Cyan
    Write-Host "   📊 Stats: $($queue.stats | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Queue test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   ℹ️  Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
}

# 4. Create Test Email
Write-Host "`n4. ✉️  Create Test Email:" -ForegroundColor Yellow
try {
    $testEmail = @{
        to = "test@example.com"
        subject = "Test Email from Queue System"
        html = "<h1>Test Message</h1><p>This is a test email from the queue system created at $(Get-Date).</p>"
        priority = "normal"
        scheduledFor = (Get-Date).AddMinutes(5).ToString("yyyy-MM-ddTHH:mm:ssZ")
        metadata = @{
            source = "testing-script"
            testRun = $true
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-WebRequest -Uri "$baseUrl/api/email-queue" -Headers $headers -Method POST -Body $testEmail -ContentType "application/json" | ConvertFrom-Json
    Write-Host "   ✅ Test email created successfully" -ForegroundColor Green
    Write-Host "   📧 Email ID: $($response.id)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Email creation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorDetails = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorDetails)
        $responseBody = $reader.ReadToEnd()
        Write-Host "   ℹ️  Error details: $responseBody" -ForegroundColor Yellow
    }
}

# 5. Admin Interface Access Test
Write-Host "`n5. 🔐 Admin Interface:" -ForegroundColor Yellow
try {
    $adminPage = Invoke-WebRequest -Uri "$baseUrl/admin/email-queue" -Method GET
    Write-Host "   ✅ Admin page accessible (Status: $($adminPage.StatusCode))" -ForegroundColor Green
    Write-Host "   🌐 Open in browser: $baseUrl/admin/email-queue" -ForegroundColor Cyan
} catch {
    Write-Host "   ⚠️  Admin page test: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   🌐 Try opening manually: $baseUrl/admin/email-queue" -ForegroundColor Cyan
}

# 6. Event Request Form Test
Write-Host "`n6. 📝 Event Request Form:" -ForegroundColor Yellow
try {
    $formPage = Invoke-WebRequest -Uri "$baseUrl/request-event" -Method GET
    Write-Host "   ✅ Event form accessible (Status: $($formPage.StatusCode))" -ForegroundColor Green
    Write-Host "   🌐 Open in browser: $baseUrl/request-event" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Event form test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "🎉 Testing Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open admin interface: $baseUrl/admin/email-queue" -ForegroundColor White
Write-Host "   2. Submit test event: $baseUrl/request-event" -ForegroundColor White
Write-Host "   3. Review and process emails in admin panel" -ForegroundColor White
Write-Host "   4. Test email sending and delivery" -ForegroundColor White

Write-Host "`n🔧 If you see errors above:" -ForegroundColor Yellow
Write-Host "   • API errors (401/403): Check authentication in browser" -ForegroundColor White
Write-Host "   • 500 errors: Check server console for details" -ForegroundColor White
Write-Host "   • Connection errors: Ensure dev server is running" -ForegroundColor White