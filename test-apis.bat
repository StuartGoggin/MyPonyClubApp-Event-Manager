@echo off
echo.
echo ===============================================
echo  Firebase Functions API Testing Suite
echo  Including Email Queue Management Testing  
echo ===============================================
echo.

REM Check if emulator is running
echo Checking Firebase emulator status...
curl -s http://localhost:5001/ponyclub-events/australia-southeast1/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Firebase emulator is not running!
    echo Please start the emulator with: firebase emulators:start
    echo.
    pause
    exit /b 1
)

echo ✅ Firebase emulator is running
echo.

echo 📋 Phase 1: Core Migration Validation
echo ========================================
node test-core-migration.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Core migration tests failed!
    pause
    exit /b 1
)

echo.
echo 📋 Phase 2: Comprehensive API Testing  
echo ========================================
node test-migrated-apis.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Comprehensive API tests failed!
    pause
    exit /b 1
)

echo.
echo 📋 Phase 3: Email Queue Management Testing
echo ==========================================
node test-email-queue.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Email queue tests failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 ALL TESTS PASSED SUCCESSFULLY!
echo ========================================
echo.
echo ✅ Core APIs working
echo ✅ Comprehensive functionality validated  
echo ✅ Email queue management operational
echo.
echo Next Steps:
echo - Deploy to production: firebase deploy
echo - Update frontend to use Functions
echo - Configure production database
echo.
pause