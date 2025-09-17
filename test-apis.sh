#!/bin/bash

echo
echo "==============================================="
echo " Firebase Functions API Testing Suite"
echo " Including Email Queue Management Testing"
echo "==============================================="
echo

# Check if emulator is running
echo "Checking Firebase emulator status..."
if ! curl -s http://localhost:5001/ponyclub-events/australia-southeast1/api/health > /dev/null 2>&1; then
    echo
    echo "❌ Firebase emulator is not running!"
    echo "Please start the emulator with: firebase emulators:start"
    echo
    exit 1
fi

echo "✅ Firebase emulator is running"
echo

echo "📋 Phase 1: Core Migration Validation"
echo "========================================"
node test-core-migration.js
if [ $? -ne 0 ]; then
    echo
    echo "❌ Core migration tests failed!"
    exit 1
fi

echo
echo "📋 Phase 2: Comprehensive API Testing"
echo "========================================"
node test-migrated-apis.js
if [ $? -ne 0 ]; then
    echo
    echo "❌ Comprehensive API tests failed!"
    exit 1
fi

echo
echo "📋 Phase 3: Email Queue Management Testing"
echo "=========================================="
node test-email-queue.js
if [ $? -ne 0 ]; then
    echo
    echo "❌ Email queue tests failed!"
    exit 1
fi

echo
echo "========================================"
echo "🎉 ALL TESTS PASSED SUCCESSFULLY!"
echo "========================================"
echo
echo "✅ Core APIs working"
echo "✅ Comprehensive functionality validated"
echo "✅ Email queue management operational"
echo
echo "Next Steps:"
echo "- Deploy to production: firebase deploy"
echo "- Update frontend to use Functions"
echo "- Configure production database"
echo