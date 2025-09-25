#!/usr/bin/env node

/**
 * Debug script to test balance comparison API in staging
 * This script helps identify authentication and API issues
 */

const https = require('https');

const STAGING_API_BASE = 'https://aqyuit04jc.execute-api.ap-southeast-2.amazonaws.com/staging';

function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, STAGING_API_BASE);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Script/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          parsed: (() => {
            try {
              return JSON.parse(data);
            } catch {
              return data;
            }
          })()
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testEndpoints() {
  console.log('🔍 Testing Balance Comparison API in Staging Environment');
  console.log('=' .repeat(60));
  
  const endpoints = [
    { path: '/health', description: 'Health Check (should work without auth)' },
    { path: '/balances/compare', description: 'Balance Comparison (requires auth)' },
    { path: '/mappings', description: 'Account Mappings (requires auth)' },
    { path: '/accounts/pocketsmith', description: 'PocketSmith Accounts (requires auth)' },
    { path: '/accounts/ynab', description: 'YNAB Accounts (requires auth)' }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.description}`);
    console.log(`   URL: ${STAGING_API_BASE}${endpoint.path}`);
    
    try {
      const response = await makeRequest(endpoint.path);
      
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(response.headers, null, 2)}`);
      
      if (response.statusCode === 200) {
        console.log('   ✅ Success');
        if (typeof response.parsed === 'object') {
          console.log(`   Response keys: ${Object.keys(response.parsed).join(', ')}`);
        }
      } else if (response.statusCode === 401) {
        console.log('   🔐 Authentication required (expected for protected endpoints)');
      } else if (response.statusCode === 404) {
        console.log('   ❌ Endpoint not found');
      } else {
        console.log('   ⚠️  Unexpected response');
        console.log(`   Body: ${response.body}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🔧 Troubleshooting Recommendations:');
  console.log('');
  console.log('1. If /health returns 404: API Gateway routing issue');
  console.log('2. If protected endpoints return 401: Authentication working correctly');
  console.log('3. If protected endpoints return 403: Authorization issue');
  console.log('4. If protected endpoints return 500: Lambda function error');
  console.log('');
  console.log('Next steps:');
  console.log('- Check CloudWatch logs for Lambda function errors');
  console.log('- Verify Cognito user pool configuration');
  console.log('- Test authentication flow in the web app');
  console.log('- Check if account mappings are configured');
}

// Run the tests
testEndpoints().catch(console.error);