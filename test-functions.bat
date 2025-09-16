@echo off
setlocal enabledelayedexpansion

REM Firebase Functions API Migration - Quick Testing Script (Windows)
REM This script automates the testing process for the migrated APIs

echo 🚀 Firebase Functions API Migration Testing
echo ==========================================

REM Get the testing mode (default to local)
set "TESTING_MODE=%~1"
if "%TESTING_MODE%"=="" set "TESTING_MODE=local"

set "VERBOSE=%~2"

echo [INFO] Testing mode: %TESTING_MODE%

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    exit /b 1
)

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Firebase CLI is not installed. Installing...
    npm install -g firebase-tools
)

REM Build functions first
echo [INFO] Building Firebase Functions...
cd functions
call npm run build
if errorlevel 1 (
    echo [ERROR] Function build failed
    exit /b 1
)
cd ..
echo [SUCCESS] Functions built successfully

if "%TESTING_MODE%"=="local" (
    echo [INFO] Starting Firebase Emulator for local testing...
    
    REM Check if emulator is already running
    netstat -an | find "5001" | find "LISTENING" >nul
    if not errorlevel 1 (
        echo [WARNING] Emulator appears to be already running on port 5001
    ) else (
        echo [INFO] Starting emulator...
        start /b firebase emulators:start --only functions,firestore
        
        REM Wait for emulator to start
        echo [INFO] Waiting for emulator to start...
        timeout /t 15 /nobreak >nul
        
        REM Check if emulator started successfully
        netstat -an | find "5001" | find "LISTENING" >nul
        if errorlevel 1 (
            echo [ERROR] Failed to start Firebase emulator
            exit /b 1
        )
        
        echo [SUCCESS] Firebase emulator started successfully
    )
    
    REM Run tests
    echo [INFO] Running API tests against local emulator...
    if "%VERBOSE%"=="verbose" (
        node test-migrated-apis.js --env=local --verbose
    ) else (
        node test-migrated-apis.js --env=local
    )
    
) else if "%TESTING_MODE%"=="production" (
    echo [WARNING] Production testing will test against live Firebase Functions
    echo [INFO] Make sure functions are deployed: firebase deploy --only functions
    
    set /p "REPLY=Continue with production testing? (y/N): "
    if /i not "!REPLY!"=="y" (
        echo [INFO] Production testing cancelled
        exit /b 0
    )
    
    echo [INFO] Running API tests against production...
    if "%VERBOSE%"=="verbose" (
        node test-migrated-apis.js --env=production --verbose
    ) else (
        node test-migrated-apis.js --env=production
    )
    
) else (
    echo [ERROR] Invalid testing mode: %TESTING_MODE%
    echo Usage: %0 [local^|production] [verbose]
    echo Examples:
    echo   %0                    # Local testing
    echo   %0 local              # Local testing
    echo   %0 local verbose      # Local testing with verbose output
    echo   %0 production         # Production testing
    echo   %0 production verbose # Production testing with verbose output
    exit /b 1
)

echo [SUCCESS] Testing completed!

REM Display next steps
echo.
echo 📋 Next Steps:
echo =============
if "%TESTING_MODE%"=="local" (
    echo 1. If all tests passed, deploy to production: firebase deploy --only functions
    echo 2. Run production tests: %0 production
    echo 3. Update frontend to use Functions endpoints
) else (
    echo 1. Update frontend to use Functions endpoints
    echo 2. Monitor Functions performance in Firebase Console
    echo 3. Clean up old Next.js API routes
)

pause