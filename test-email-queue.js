#!/usr/bin/env node

/**
 * Email Queue Management Testing Script
 * 
 * Comprehensive testing for the migrated email queue management endpoints.
 * Tests all CRUD operations, authentication, bulk operations, and configuration.
 * 
 * Usage:
 *   node test-email-queue.js [--env=local|production] [--verbose]
 * 
 * Features tested:
 *   - Admin authentication middleware
 *   - Email queue CRUD operations
 *   - Bulk update and delete operations
 *   - Email queue statistics and logs
 *   - Configuration management
 *   - Email sending simulation
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  local: {
    functions: 'http://localhost:5001/ponyclub-events/australia-southeast1/api'
  },
  production: {
    functions: 'https://australia-southeast1-ponyclub-events.cloudfunctions.net/api'
  }
};

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  verbose: false,
  environment: 'local'
};

// Test data
const TEST_DATA = {
  sampleEmail: {
    to: ['test@example.com', 'admin@test.com'],
    subject: 'Email Queue Test Message',
    html: '<h1>Test Email</h1><p>This is a test email from the queue management system.</p>',
    text: 'Test Email - This is a test email from the queue management system.',
    from: 'noreply@ponyclub.com',
    status: 'queued',
    priority: 'normal',
    metadata: {
      source: 'email_queue_test',
      testId: Date.now(),
      environment: TEST_CONFIG.environment
    }
  },
  configUpdate: {
    maxRetries: 5,
    retryDelay: 300000,
    batchSize: 15,
    enableNotifications: true,
    fallbackOnFailure: true,
    defaultPriority: 'normal'
  }
};

// Results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// Utility functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  const prefix = icons[level] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const verbose = (message) => {
  if (TEST_CONFIG.verbose) {
    log(message, 'info');
  }
};

const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${TEST_CONFIG.timeout}ms`));
    }, TEST_CONFIG.timeout);

    const req = client.request(options, (res) => {
      clearTimeout(timeout);
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            data: null
          };
          
          if (res.headers['content-type']?.includes('application/json')) {
            try {
              response.data = JSON.parse(body);
            } catch (e) {
              response.parseError = e.message;
            }
          }
          
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
};

const makeApiRequest = (endpoint, method = 'GET', data = null, headers = {}) => {
  const url = new URL(`${CONFIG[TEST_CONFIG.environment].functions}${endpoint}`);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    protocol: url.protocol
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    const bodyData = JSON.stringify(data);
    options.headers['Content-Length'] = Buffer.byteLength(bodyData);
    return makeRequest(options, bodyData);
  }

  return makeRequest(options);
};

const runTest = async (testName, testFunction) => {
  testResults.total++;
  try {
    verbose(`Starting test: ${testName}`);
    const result = await testFunction();
    testResults.passed++;
    log(`✅ ${testName} - PASSED`, 'success');
    if (result && typeof result === 'object') {
      Object.keys(result).forEach(key => {
        verbose(`  ${key}: ${JSON.stringify(result[key])}`);
      });
    }
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    log(`❌ ${testName} - FAILED: ${error.message}`, 'error');
    throw error;
  }
};

// Test Functions

const testEmailQueueAuthentication = async () => {
  // Test without authentication
  const unauthResponse = await makeApiRequest('/email-queue', 'GET');
  
  if (unauthResponse.statusCode !== 401) {
    throw new Error(`Expected 401 for unauthenticated request, got ${unauthResponse.statusCode}`);
  }
  
  // Test with invalid token
  const invalidTokenResponse = await makeApiRequest('/email-queue', 'GET', null, {
    'Authorization': 'Bearer invalid-token'
  });
  
  if (invalidTokenResponse.statusCode !== 401) {
    throw new Error(`Expected 401 for invalid token, got ${invalidTokenResponse.statusCode}`);
  }
  
  // Test with valid admin token
  const validTokenResponse = await makeApiRequest('/email-queue', 'GET', null, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (validTokenResponse.statusCode !== 200) {
    throw new Error(`Valid token should work, got ${validTokenResponse.statusCode}: ${validTokenResponse.body}`);
  }
  
  return { authenticationWorking: true };
};

const testEmailQueueBasicOperations = async () => {
  // Test GET operation
  const getResponse = await makeApiRequest('/email-queue', 'GET', null, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (getResponse.statusCode !== 200) {
    throw new Error(`GET request failed: ${getResponse.statusCode}: ${getResponse.body}`);
  }
  
  if (!getResponse.data || !getResponse.data.success) {
    throw new Error('Invalid GET response format');
  }
  
  // Test POST operation (create email)
  const testEmail = {
    ...TEST_DATA.sampleEmail,
    subject: `${TEST_DATA.sampleEmail.subject} - ${Date.now()}`
  };
  
  const postResponse = await makeApiRequest('/email-queue', 'POST', testEmail, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (postResponse.statusCode !== 200) {
    throw new Error(`POST request failed: ${postResponse.statusCode}: ${postResponse.body}`);
  }
  
  if (!postResponse.data || !postResponse.data.success || !postResponse.data.id) {
    throw new Error('Invalid POST response format - missing email ID');
  }
  
  const emailId = postResponse.data.id;
  
  // Test PUT operation (update email)
  const putResponse = await makeApiRequest('/email-queue', 'PUT', {
    id: emailId,
    priority: 'high',
    metadata: { ...testEmail.metadata, updated: true }
  }, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (putResponse.statusCode !== 200) {
    throw new Error(`PUT request failed: ${putResponse.statusCode}: ${putResponse.body}`);
  }
  
  // Test DELETE operation
  const deleteResponse = await makeApiRequest('/email-queue', 'DELETE', {
    id: emailId
  }, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (deleteResponse.statusCode !== 200) {
    throw new Error(`DELETE request failed: ${deleteResponse.statusCode}: ${deleteResponse.body}`);
  }
  
  return { 
    basicOperations: 'all_passed',
    createdEmailId: emailId 
  };
};

const testEmailQueueStatistics = async () => {
  const response = await makeApiRequest('/email-queue?includeStats=true', 'GET', null, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`Statistics request failed: ${response.statusCode}: ${response.body}`);
  }
  
  if (!response.data || !response.data.success || !response.data.data) {
    throw new Error('Invalid statistics response format');
  }
  
  const stats = response.data.data;
  const expectedFields = ['total', 'queued', 'sent', 'failed'];
  const missingFields = expectedFields.filter(field => typeof stats[field] === 'undefined');
  
  if (missingFields.length > 0) {
    throw new Error(`Missing statistics fields: ${missingFields.join(', ')}`);
  }
  
  return { 
    statisticsWorking: true,
    stats: stats
  };
};

const testEmailQueueBulkOperations = async () => {
  // Create test emails for bulk operations
  const testEmails = [];
  for (let i = 0; i < 3; i++) {
    const testEmail = {
      ...TEST_DATA.sampleEmail,
      subject: `Bulk Test Email ${i + 1} - ${Date.now()}`,
      to: [`bulk-test-${i + 1}@example.com`]
    };
    
    const response = await makeApiRequest('/email-queue', 'POST', testEmail, {
      'Authorization': 'Bearer admin-token'
    });
    
    if (response.statusCode === 200 && response.data?.id) {
      testEmails.push(response.data.id);
    }
  }
  
  if (testEmails.length === 0) {
    throw new Error('Failed to create test emails for bulk operations');
  }
  
  // Test bulk update
  const bulkUpdateResponse = await makeApiRequest('/email-queue', 'POST', {
    action: 'bulk-update',
    emailIds: testEmails,
    updates: { priority: 'high' }
  }, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (bulkUpdateResponse.statusCode !== 200) {
    throw new Error(`Bulk update failed: ${bulkUpdateResponse.statusCode}: ${bulkUpdateResponse.body}`);
  }
  
  // Test bulk delete
  const bulkDeleteResponse = await makeApiRequest('/email-queue', 'POST', {
    action: 'bulk-delete',
    emailIds: testEmails
  }, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (bulkDeleteResponse.statusCode !== 200) {
    throw new Error(`Bulk delete failed: ${bulkDeleteResponse.statusCode}: ${bulkDeleteResponse.body}`);
  }
  
  return { 
    bulkOperations: 'passed',
    processedEmails: testEmails.length 
  };
};

const testEmailQueueLogs = async () => {
  const response = await makeApiRequest('/email-queue/logs', 'GET', null, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`Logs request failed: ${response.statusCode}: ${response.body}`);
  }
  
  if (!response.data || !response.data.success) {
    throw new Error('Invalid logs response format');
  }
  
  // Test with filters
  const filteredResponse = await makeApiRequest('/email-queue/logs?limit=5&status=sent', 'GET', null, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (filteredResponse.statusCode !== 200) {
    throw new Error(`Filtered logs request failed: ${filteredResponse.statusCode}`);
  }
  
  return { 
    logsWorking: true,
    logCount: response.data.data?.length || 0 
  };
};

const testEmailQueueConfiguration = async () => {
  // Test getting configuration
  const getResponse = await makeApiRequest('/email-queue/config', 'GET', null, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (getResponse.statusCode !== 200) {
    throw new Error(`Config GET failed: ${getResponse.statusCode}: ${getResponse.body}`);
  }
  
  if (!getResponse.data || !getResponse.data.success || !getResponse.data.data) {
    throw new Error('Invalid config response format');
  }
  
  // Test updating configuration
  const updateData = {
    ...TEST_DATA.configUpdate,
    updatedAt: new Date().toISOString()
  };
  
  const updateResponse = await makeApiRequest('/email-queue/config', 'POST', updateData, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (updateResponse.statusCode !== 200) {
    throw new Error(`Config update failed: ${updateResponse.statusCode}: ${updateResponse.body}`);
  }
  
  if (!updateResponse.data || !updateResponse.data.success) {
    throw new Error('Invalid config update response format');
  }
  
  return { 
    configOperations: 'passed',
    configUpdated: true 
  };
};

const testEmailQueueSending = async () => {
  // Create a test email
  const testEmail = {
    ...TEST_DATA.sampleEmail,
    subject: `Send Test Email - ${Date.now()}`
  };
  
  const createResponse = await makeApiRequest('/email-queue', 'POST', testEmail, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (createResponse.statusCode !== 200 || !createResponse.data?.id) {
    throw new Error('Failed to create test email for sending');
  }
  
  const emailId = createResponse.data.id;
  
  // Test sending in simulation mode
  const sendResponse = await makeApiRequest('/email-queue/send', 'POST', {
    emailIds: [emailId],
    simulate: true
  }, {
    'Authorization': 'Bearer admin-token'
  });
  
  if (sendResponse.statusCode !== 200) {
    throw new Error(`Email send failed: ${sendResponse.statusCode}: ${sendResponse.body}`);
  }
  
  if (!sendResponse.data || !sendResponse.data.success) {
    throw new Error('Invalid send response format');
  }
  
  return { 
    sendingWorking: true,
    simulationMode: true,
    emailId: emailId 
  };
};

// Main test suite
const runEmailQueueTests = async () => {
  log('🚀 Email Queue Management Testing Suite', 'info');
  log(`Environment: ${TEST_CONFIG.environment}`, 'info');
  log(`Base URL: ${CONFIG[TEST_CONFIG.environment].functions}`, 'info');
  log(`Timeout: ${TEST_CONFIG.timeout}ms`, 'info');
  log('');
  
  const startTime = Date.now();
  
  try {
    // Phase 1: Authentication Testing
    log('📋 Phase 1: Authentication Testing', 'info');
    await runTest('Email Queue Authentication', testEmailQueueAuthentication);
    
    // Phase 2: Basic CRUD Operations
    log('\n📋 Phase 2: Basic CRUD Operations', 'info');
    await runTest('Email Queue Basic Operations', testEmailQueueBasicOperations);
    await runTest('Email Queue Statistics', testEmailQueueStatistics);
    
    // Phase 3: Advanced Operations
    log('\n📋 Phase 3: Advanced Operations', 'info');
    await runTest('Email Queue Bulk Operations', testEmailQueueBulkOperations);
    await runTest('Email Queue Logs', testEmailQueueLogs);
    
    // Phase 4: Configuration Management
    log('\n📋 Phase 4: Configuration Management', 'info');
    await runTest('Email Queue Configuration', testEmailQueueConfiguration);
    
    // Phase 5: Email Sending
    log('\n📋 Phase 5: Email Sending', 'info');
    await runTest('Email Queue Sending', testEmailQueueSending);
    
  } catch (error) {
    log(`Test suite encountered a fatal error: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Final report
  log('\n' + '='.repeat(60), 'info');
  log('📊 EMAIL QUEUE TESTING RESULTS', 'info');
  log('='.repeat(60), 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, testResults.passed > 0 ? 'success' : 'info');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`Duration: ${duration.toFixed(2)} seconds`, 'info');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  
  if (testResults.errors.length > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults.errors.forEach(error => {
      log(`  - ${error.test}: ${error.error}`, 'error');
    });
  }
  
  // Success criteria validation
  const successCriteria = [
    { name: 'Authentication working', passed: testResults.passed > 0 && testResults.failed === 0 },
    { name: 'Basic operations functional', passed: testResults.passed >= 2 },
    { name: 'Advanced features working', passed: testResults.passed >= 4 },
    { name: 'No critical failures', passed: testResults.failed === 0 }
  ];
  
  log('\n✅ Email Queue Migration Success Criteria:', 'info');
  successCriteria.forEach(criteria => {
    log(`  ${criteria.passed ? '✅' : '❌'} ${criteria.name}`, criteria.passed ? 'success' : 'error');
  });
  
  const allCriteriaMet = successCriteria.every(criteria => criteria.passed);
  
  if (allCriteriaMet) {
    log('\n🎉 Email Queue Migration: SUCCESS! All criteria met.', 'success');
    log('✅ Email queue management is fully functional and ready for production.', 'success');
  } else {
    log('\n⚠️ Email Queue Migration: Some issues need attention.', 'warning');
    log('Please review failed tests and address issues before proceeding.', 'warning');
  }
  
  log('\n' + '='.repeat(60), 'info');
  
  return {
    success: allCriteriaMet,
    passed: testResults.passed,
    failed: testResults.failed,
    total: testResults.total,
    duration: duration
  };
};

// Command line handling
const args = process.argv.slice(2);
args.forEach(arg => {
  if (arg.startsWith('--env=')) {
    TEST_CONFIG.environment = arg.split('=')[1];
  } else if (arg === '--verbose') {
    TEST_CONFIG.verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Email Queue Management Testing Script

Usage: node test-email-queue.js [options]

Options:
  --env=local|production    Set environment (default: local)
  --verbose                 Enable verbose output
  --help, -h               Show this help message

Examples:
  node test-email-queue.js                    # Test local emulator
  node test-email-queue.js --env=production   # Test production
  node test-email-queue.js --verbose          # Verbose local testing
`);
    process.exit(0);
  }
});

// Run tests if this script is executed directly
if (require.main === module) {
  runEmailQueueTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { 
  runEmailQueueTests, 
  testEmailQueueAuthentication,
  testEmailQueueBasicOperations,
  testEmailQueueStatistics,
  testEmailQueueBulkOperations,
  testEmailQueueLogs,
  testEmailQueueConfiguration,
  testEmailQueueSending
};