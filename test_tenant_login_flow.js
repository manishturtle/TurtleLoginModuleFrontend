/**
 * Tenant Admin Login Flow Test Script
 * 
 * This script tests the complete tenant admin login flow, including:
 * 1. User existence check
 * 2. Login attempt
 * 3. Token validation
 * 
 * It tests multiple URL patterns to identify which one works for your setup.
 */

const axios = require('axios');

// Configuration - MODIFY THESE VALUES
const BASE_URL = 'http://localhost:8000';
const TENANT_SLUG = 'vb'; // Replace with your tenant slug
const TEST_EMAIL = 'admin@example.com'; // Replace with a valid tenant admin email
const TEST_PASSWORD = 'admin123'; // Replace with the correct password

// Create an axios instance for testing
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Test URL patterns
const URL_PATTERNS = [
  `/api/${TENANT_SLUG}/tenant-admin/auth/check-user/`,
  `/${TENANT_SLUG}/api/tenant-admin/auth/check-user/`,
  `/${TENANT_SLUG}/tenant-admin/api/auth/check-user/`
];

/**
 * Test the check-user endpoint with multiple URL patterns
 */
async function testCheckUserEndpoint() {
  console.log('\n🔍 TESTING CHECK USER ENDPOINT WITH MULTIPLE URL PATTERNS');
  console.log('===========================================================');
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Admin': 'true',
    'X-Tenant-Name': TENANT_SLUG
  };
  
  const data = { email: TEST_EMAIL };
  
  // Test each URL pattern
  for (const url of URL_PATTERNS) {
    console.log(`\nTesting URL pattern: ${url}`);
    console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
    console.log(`Data: ${JSON.stringify(data, null, 2)}`);
    
    try {
      const response = await api.post(url, data, { headers });
      console.log(`✅ SUCCESS - Status code: ${response.status}`);
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      
      // Save the working URL pattern for login test
      if (response.status === 200) {
        const loginUrl = url.replace('check-user', 'login');
        await testLoginEndpoint(loginUrl, headers);
      }
    } catch (error) {
      console.log(`❌ ERROR - Status code: ${error.response?.status || 'Unknown'}`);
      console.log(`Error message: ${error.message}`);
      if (error.response?.data) {
        console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
}

/**
 * Test the login endpoint with the working URL pattern
 */
async function testLoginEndpoint(loginUrl, headers) {
  console.log('\n🔑 TESTING LOGIN ENDPOINT');
  console.log('========================');
  console.log(`URL: ${loginUrl}`);
  
  const data = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  };
  
  try {
    const response = await api.post(loginUrl, data, { headers });
    console.log(`✅ SUCCESS - Status code: ${response.status}`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    // If login successful and token received, test token validation
    if (response.data.access) {
      await testTokenValidation(response.data.access);
    }
  } catch (error) {
    console.log(`❌ ERROR - Status code: ${error.response?.status || 'Unknown'}`);
    console.log(`Error message: ${error.message}`);
    if (error.response?.data) {
      console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

/**
 * Test token validation
 */
async function testTokenValidation(token) {
  console.log('\n🔒 TESTING TOKEN VALIDATION');
  console.log('==========================');
  
  // Try to access a protected endpoint with the token
  const url = `/api/${TENANT_SLUG}/tenant-admin/profile/`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Admin': 'true',
    'X-Tenant-Name': TENANT_SLUG
  };
  
  console.log(`URL: ${url}`);
  console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
  
  try {
    const response = await api.get(url, { headers });
    console.log(`✅ SUCCESS - Status code: ${response.status}`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`❌ ERROR - Status code: ${error.response?.status || 'Unknown'}`);
    console.log(`Error message: ${error.message}`);
    if (error.response?.data) {
      console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 STARTING TENANT ADMIN LOGIN FLOW TESTS');
  console.log('=========================================');
  console.log(`Tenant: ${TENANT_SLUG}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  
  try {
    await testCheckUserEndpoint();
  } catch (error) {
    console.error('Unexpected error during tests:', error);
  }
  
  console.log('\n✨ TENANT ADMIN LOGIN FLOW TESTS COMPLETED');
}

// Run the tests
runTests();
