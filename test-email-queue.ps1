# PowerShell Email Queue Testing Scripts
# Run these commands in PowerShell to test the email queue system

Write-Host "🚀 Email Queue Management System - Test Suite" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:9002"
$adminToken = "admin-token"
$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

Write-Host "`n📋 Test 1: Check Authentication" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/email-queue?action=stats" -Headers $headers -Method GET
    Write-Host "✅ Authentication successful" -ForegroundColor Green
    Write-Host "Queue Stats: $($response.data.total) total emails" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test 2: Get Current Configuration" -ForegroundColor Yellow
try {
    $config = Invoke-RestMethod -Uri "$baseUrl/api/email-queue/config" -Headers $headers -Method GET
    Write-Host "✅ Configuration retrieved" -ForegroundColor Green
    Write-Host "Event Request Approval Required: $($config.data.requireApprovalForEventRequests)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Configuration retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test 3: Enable Email Queuing" -ForegroundColor Yellow
$configBody = @{
    requireApprovalForEventRequests = $true
    requireApprovalForNotifications = $false
    requireApprovalForReminders = $true
    requireApprovalForGeneral = $true
    maxRetries = 3
    retryDelayMinutes = 30
    maxQueueSize = 100
    autoSendScheduledEmails = $true
    autoSendAfterApprovalMinutes = 5
    notifyAdminsOnFailure = $true
    notifyAdminsOnLargeQueue = $true
    largeQueueThreshold = 50
    archiveSuccessfulAfterDays = 30
    archiveFailedAfterDays = 90
    preferredProvider = "resend"
    fallbackOnFailure = $true
} | ConvertTo-Json

try {
    $configResponse = Invoke-RestMethod -Uri "$baseUrl/api/email-queue/config" -Headers $headers -Method POST -Body $configBody
    Write-Host "✅ Configuration updated successfully" -ForegroundColor Green
    Write-Host "Email queuing is now ENABLED for event requests" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Configuration update failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test 4: Get All Queued Emails" -ForegroundColor Yellow
try {
    $emails = Invoke-RestMethod -Uri "$baseUrl/api/email-queue" -Headers $headers -Method GET
    Write-Host "✅ Retrieved $($emails.data.Count) queued emails" -ForegroundColor Green
    
    if ($emails.data.Count -gt 0) {
        Write-Host "Recent emails:" -ForegroundColor Cyan
        $emails.data | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - $($_.subject) [$($_.status)]" -ForegroundColor Gray
        }
    } else {
        Write-Host "No emails in queue. Submit an event request to see emails appear here." -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to retrieve emails: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test 5: Get Queue Statistics" -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/email-queue?action=stats" -Headers $headers -Method GET
    Write-Host "✅ Queue statistics retrieved" -ForegroundColor Green
    Write-Host "Email Queue Summary:" -ForegroundColor Cyan
    Write-Host "  Total: $($stats.data.total)" -ForegroundColor Gray
    Write-Host "  Draft: $($stats.data.draft)" -ForegroundColor Gray
    Write-Host "  Pending: $($stats.data.pending)" -ForegroundColor Gray
    Write-Host "  Sent: $($stats.data.sent)" -ForegroundColor Gray
    Write-Host "  Failed: $($stats.data.failed)" -ForegroundColor Gray
    Write-Host "  Success Rate: $($stats.data.successRate)%" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to retrieve statistics: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test 6: Test Email Form Submission" -ForegroundColor Yellow
Write-Host "To test the full flow:" -ForegroundColor Cyan
Write-Host "1. Open: $baseUrl/request-event" -ForegroundColor Gray
Write-Host "2. Fill out and submit an event request form" -ForegroundColor Gray
Write-Host "3. Check the admin interface: $baseUrl/admin/email-queue" -ForegroundColor Gray
Write-Host "4. Use admin token: $adminToken" -ForegroundColor Gray

Write-Host "`n🎯 Quick Access Links:" -ForegroundColor Yellow
Write-Host "Admin Interface: $baseUrl/admin/email-queue" -ForegroundColor Cyan
Write-Host "Event Request Form: $baseUrl/request-event" -ForegroundColor Cyan
Write-Host "Admin Token: $adminToken" -ForegroundColor Cyan

Write-Host "`n✨ Testing Complete!" -ForegroundColor Green
Write-Host "Check the admin interface to manage queued emails." -ForegroundColor Green