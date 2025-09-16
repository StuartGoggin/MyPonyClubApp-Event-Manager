#!/bin/bash

# Firebase Functions API Migration - Quick Testing Script
# This script automates the testing process for the migrated APIs

set -e  # Exit on any error

echo "🚀 Firebase Functions API Migration Testing"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
fi

# Get the testing mode
TESTING_MODE=${1:-"local"}
VERBOSE=${2:-"false"}

print_status "Testing mode: $TESTING_MODE"

# Build functions first
print_status "Building Firebase Functions..."
cd functions
if npm run build; then
    print_success "Functions built successfully"
else
    print_error "Function build failed"
    exit 1
fi
cd ..

if [ "$TESTING_MODE" = "local" ]; then
    print_status "Starting Firebase Emulator for local testing..."
    
    # Check if emulator is already running
    if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null; then
        print_warning "Emulator appears to be already running on port 5001"
    else
        print_status "Starting emulator..."
        firebase emulators:start --only functions,firestore &
        EMULATOR_PID=$!
        
        # Wait for emulator to start
        print_status "Waiting for emulator to start..."
        sleep 15
        
        # Check if emulator started successfully
        if ! lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null; then
            print_error "Failed to start Firebase emulator"
            exit 1
        fi
        
        print_success "Firebase emulator started successfully"
    fi
    
    # Run tests
    print_status "Running API tests against local emulator..."
    if [ "$VERBOSE" = "verbose" ]; then
        node test-migrated-apis.js --env=local --verbose
    else
        node test-migrated-apis.js --env=local
    fi
    
    # Stop emulator if we started it
    if [ ! -z "$EMULATOR_PID" ]; then
        print_status "Stopping Firebase emulator..."
        kill $EMULATOR_PID 2>/dev/null || true
        print_success "Emulator stopped"
    fi
    
elif [ "$TESTING_MODE" = "production" ]; then
    print_warning "Production testing will test against live Firebase Functions"
    print_status "Make sure functions are deployed: firebase deploy --only functions"
    
    read -p "Continue with production testing? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Production testing cancelled"
        exit 0
    fi
    
    print_status "Running API tests against production..."
    if [ "$VERBOSE" = "verbose" ]; then
        node test-migrated-apis.js --env=production --verbose
    else
        node test-migrated-apis.js --env=production
    fi
    
else
    print_error "Invalid testing mode: $TESTING_MODE"
    echo "Usage: $0 [local|production] [verbose]"
    echo "Examples:"
    echo "  $0                    # Local testing"
    echo "  $0 local              # Local testing"
    echo "  $0 local verbose      # Local testing with verbose output"
    echo "  $0 production         # Production testing"
    echo "  $0 production verbose # Production testing with verbose output"
    exit 1
fi

print_success "Testing completed!"

# Display next steps
echo
echo "📋 Next Steps:"
echo "============="
if [ "$TESTING_MODE" = "local" ]; then
    echo "1. If all tests passed, deploy to production: firebase deploy --only functions"
    echo "2. Run production tests: $0 production"
    echo "3. Update frontend to use Functions endpoints"
else
    echo "1. Update frontend to use Functions endpoints"
    echo "2. Monitor Functions performance in Firebase Console"
    echo "3. Clean up old Next.js API routes"
fi